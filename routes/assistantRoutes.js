const express = require("express");
const router = express.Router();

const db = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const llm = require("../services/llmService");
const { respond, SITE_GUIDE } = require("../services/assistantKnowledge");
const { verifyToken } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(verifyToken);

/** True while a student has an attempt that is ongoing and still inside its time window. */
async function hasExamInProgress(user) {
    if (user.role !== "student") return false;
    const [rows] = await db.promise.query(
        `SELECT 1 FROM attempt a
         JOIN examination e ON e.exam_id = a.exam_id
         WHERE a.student_user_id = ? AND a.status = 'ONGOING'
           AND a.start_time + INTERVAL e.duration_minutes MINUTE > NOW()
         LIMIT 1`,
        [user.user_id]
    );
    return rows.length > 0;
}

/**
 * POST /api/assistant/chat
 * body: { message, view?, history?: [{role, text}] }
 */
router.post("/chat", asyncHandler(async (req, res) => {
    const message = String(req.body.message || "").trim().slice(0, 1000);
    if (!message) return ApiResponse.error(res, "Message is required", 400);

    const { role, username } = req.user;
    const examInProgress = await hasExamInProgress(req.user);
    const offline = respond({ message, role, name: username, examInProgress });

    // The LLM is never used during an exam, so it can't leak answers
    if (!examInProgress && llm.isConfigured()) {
        const history = (Array.isArray(req.body.history) ? req.body.history : [])
            .slice(-8)
            .map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", text: String(item.text || "").slice(0, 1000) }));
        const system = `You are Ava, a friendly, concise study assistant inside "OES Pro", an online examination system.
The user is a ${role} named ${username}, currently on the "${req.body.view || "home"}" page.
Site guide: ${SITE_GUIDE[role].overview}
Help with: explaining course concepts (DBMS, programming, CS), how to use the site, exam rules (camera proctoring, fullscreen, no tab switching, auto-submit when time ends, 1 mark per correct MCQ, no negative marking).
Keep answers under 150 words, use plain text with short bullet points when helpful. Never invent features the site doesn't have.`;
        const reply = await llm.chat(system, [...history, { role: "user", text: message }]);
        if (reply) {
            return ApiResponse.success(res, { text: reply.trim(), actions: offline.actions || [], mood: offline.mood || "explain", source: "ai" });
        }
    }

    return ApiResponse.success(res, { ...offline, source: "offline", examInProgress });
}));

/**
 * GET /api/assistant/review/:attemptId
 * Test evaluation: per-question breakdown, topic/difficulty analysis and feedback.
 * Correct answers are revealed to students only once the result is published.
 */
router.get("/review/:attemptId", asyncHandler(async (req, res) => {
    const pool = db.promise;
    const [[attempt]] = await pool.query(
        `SELECT a.attempt_id, a.student_user_id, a.exam_id, a.status, a.start_time, a.end_time,
                e.title, e.faculty_user_id, r.total_marks, r.is_published
         FROM attempt a
         JOIN examination e ON e.exam_id = a.exam_id
         LEFT JOIN result r ON r.attempt_id = a.attempt_id
         WHERE a.attempt_id = ?`,
        [req.params.attemptId]
    );

    if (!attempt) return ApiResponse.notFound(res, "Attempt not found");

    const { role, user_id } = req.user;
    const allowed =
        role === "admin" ||
        (role === "student" && Number(attempt.student_user_id) === Number(user_id)) ||
        (role === "faculty" && Number(attempt.faculty_user_id) === Number(user_id));
    if (!allowed) return ApiResponse.forbidden(res, "You can only review your own attempts");
    if (attempt.status === "ONGOING") return ApiResponse.error(res, "This exam is still in progress", 409);

    const [questions] = await pool.query(
        `SELECT q.question_id, q.content, q.option_a, q.option_b, q.option_c, q.option_d,
                q.correct_answer, q.difficulty_level,
                COALESCE(NULLIF(q.subject_topic, ''), 'General') AS topic,
                sa.selected_answer
         FROM exam_questions eq
         JOIN question_bank q ON q.question_id = eq.question_id
         LEFT JOIN student_answers sa ON sa.question_id = q.question_id AND sa.attempt_id = ?
         WHERE eq.exam_id = ?
         ORDER BY q.question_id`,
        [attempt.attempt_id, attempt.exam_id]
    );

    const revealAnswers = role !== "student" || Boolean(attempt.is_published);
    const tally = (map, key, correct) => {
        const entry = map.get(key) || { name: key, correct: 0, total: 0 };
        entry.total++;
        if (correct) entry.correct++;
        map.set(key, entry);
    };

    const topics = new Map();
    const difficulties = new Map();
    let correctCount = 0;
    let unanswered = 0;

    const items = questions.map((q) => {
        const selected = q.selected_answer ? String(q.selected_answer).trim().toUpperCase() : null;
        const isCorrect = selected !== null && selected === String(q.correct_answer).trim().toUpperCase();
        if (isCorrect) correctCount++;
        if (!selected) unanswered++;
        tally(topics, q.topic, isCorrect);
        tally(difficulties, q.difficulty_level, isCorrect);
        return {
            question_id: q.question_id,
            content: q.content,
            options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
            selected,
            is_correct: isCorrect,
            correct_answer: revealAnswers ? q.correct_answer : null,
            topic: q.topic,
            difficulty: q.difficulty_level
        };
    });

    const total = questions.length;
    const percent = total ? Math.round((correctCount / total) * 100) : 0;
    const withPct = (entry) => ({ ...entry, percent: Math.round((entry.correct / entry.total) * 100) });
    const topicStats = [...topics.values()].map(withPct).sort((a, b) => a.percent - b.percent);
    const difficultyStats = ["EASY", "MEDIUM", "HARD"].filter((d) => difficulties.has(d)).map((d) => withPct(difficulties.get(d)));

    const strengths = topicStats.filter((t) => t.percent >= 75).map((t) => t.name);
    const weaknesses = topicStats.filter((t) => t.percent < 50).map((t) => t.name);

    const feedback = [];
    feedback.push(
        percent >= 85 ? `Outstanding work — ${percent}%! You clearly know this material.`
            : percent >= 65 ? `Solid result at ${percent}%. A little revision will push you higher.`
                : percent >= 40 ? `You scored ${percent}%. You have the basics; let's close the gaps.`
                    : `You scored ${percent}%. Don't worry — let's build this up step by step.`
    );
    if (strengths.length) feedback.push(`Strong areas: ${strengths.join(", ")}.`);
    if (weaknesses.length) feedback.push(`Revise first: ${weaknesses.join(", ")}.`);
    const hard = difficulties.get("HARD");
    if (hard && hard.correct / hard.total < 0.5) feedback.push("Hard questions cost you the most — practise multi-step reasoning on those topics.");
    if (unanswered) feedback.push(`You left ${unanswered} question${unanswered === 1 ? "" : "s"} unanswered — with no negative marking, it's always worth answering.`);
    if (!revealAnswers) feedback.push("Correct answers will be shown here once your instructor publishes the result.");

    return ApiResponse.success(res, {
        attempt: { attempt_id: attempt.attempt_id, exam_id: attempt.exam_id, title: attempt.title, submitted_at: attempt.end_time, published: Boolean(attempt.is_published) },
        summary: { correct: correctCount, total, unanswered, percent },
        topics: topicStats,
        difficulties: difficultyStats,
        feedback,
        revealAnswers,
        questions: items
    });
}));

module.exports = router;
