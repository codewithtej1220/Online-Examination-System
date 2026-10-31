const express = require("express");
const router = express.Router();

const db = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const llm = require("../services/llmService");
const { generateFromNotes, pickQuestions } = require("../services/questionGeneratorService");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(verifyToken, requireRole("faculty", "admin"));

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const LETTERS = ["A", "B", "C", "D"];

function ownerId(req) {
    return req.user.role === "faculty" ? req.user.user_id : Number(req.body.faculty_user_id) || null;
}

function normalizeQuestion(raw, defaults) {
    const question = {
        content: String(raw.content || raw.question || "").trim(),
        option_a: String(raw.option_a ?? raw.options?.[0] ?? "").trim(),
        option_b: String(raw.option_b ?? raw.options?.[1] ?? "").trim(),
        option_c: String(raw.option_c ?? raw.options?.[2] ?? "").trim(),
        option_d: String(raw.option_d ?? raw.options?.[3] ?? "").trim(),
        correct_answer: String(raw.correct_answer || "").trim().toUpperCase(),
        difficulty_level: DIFFICULTIES.includes(String(raw.difficulty_level).toUpperCase()) ? String(raw.difficulty_level).toUpperCase() : defaults.difficulty,
        subject_topic: (raw.subject_topic || defaults.subjectTopic || "").toString().slice(0, 150) || null,
        tags: (raw.tags || "generated").toString().slice(0, 255)
    };
    const valid = question.content && question.option_a && question.option_b && question.option_c && question.option_d && LETTERS.includes(question.correct_answer);
    return valid ? question : null;
}

/**
 * GET /api/generator/topics
 * Question bank coverage per topic and difficulty (for the test builder)
 */
router.get("/topics", asyncHandler(async (req, res) => {
    const scopeMine = req.query.scope !== "all";
    const [rows] = await db.promise.query(
        `SELECT COALESCE(NULLIF(subject_topic, ''), 'General') AS topic, difficulty_level, COUNT(*) AS count
         FROM question_bank
         ${scopeMine ? "WHERE faculty_user_id = ?" : ""}
         GROUP BY topic, difficulty_level
         ORDER BY topic`,
        scopeMine ? [req.user.user_id] : []
    );

    const topics = new Map();
    for (const row of rows) {
        const entry = topics.get(row.topic) || { topic: row.topic, EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
        entry[row.difficulty_level] = Number(row.count);
        entry.total += Number(row.count);
        topics.set(row.topic, entry);
    }
    return ApiResponse.success(res, { topics: [...topics.values()], aiAvailable: llm.isConfigured() });
}));

/**
 * POST /api/generator/from-notes
 * Generate MCQs from study notes. Uses Gemini when configured (mode "ai"),
 * otherwise the offline term/definition generator. Returns a preview only.
 */
router.post("/from-notes", asyncHandler(async (req, res) => {
    const notes = String(req.body.notes || "");
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 10, 1), 30);
    const difficulty = DIFFICULTIES.includes(req.body.difficulty) ? req.body.difficulty : "MEDIUM";
    const subjectTopic = String(req.body.subject_topic || "").slice(0, 150);
    const wantAi = req.body.mode === "ai";

    if (notes.trim().length < 40) {
        return ApiResponse.error(res, "Please paste at least a few lines of notes (40+ characters).", 400);
    }

    if (wantAi && llm.isConfigured()) {
        try {
            const prompt = `Create ${count} multiple-choice questions at ${difficulty} difficulty from the study notes below.
Return JSON: {"questions":[{"content":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A|B|C|D"}]}
Rules: exactly one correct option; plausible distractors; vary the position of the correct answer; no "all of the above".

NOTES:
${notes.slice(0, 12000)}`;
            const data = await llm.generateJSON(prompt, "You are an expert examiner who writes clear, unambiguous exam questions.");
            const questions = (data.questions || [])
                .map((q) => normalizeQuestion(q, { difficulty, subjectTopic }))
                .filter(Boolean)
                .slice(0, count);
            if (questions.length) {
                return ApiResponse.success(res, { questions, mode: "ai" }, `Generated ${questions.length} questions with AI`);
            }
        } catch (error) {
            logger.warn(`AI question generation failed, using offline generator: ${error.message}`);
        }
    }

    const { questions, pairsFound } = generateFromNotes(notes, { count, difficulty, subjectTopic });
    if (!questions.length) {
        return ApiResponse.error(
            res,
            `Found ${pairsFound} term/definition pair(s); at least 4 are needed. Write one concept per line, e.g. "Primary key: a column that uniquely identifies each row".`,
            422
        );
    }
    return ApiResponse.success(res, { questions, mode: "offline", pairsFound }, `Generated ${questions.length} questions from ${pairsFound} concepts`);
}));

/**
 * POST /api/generator/save
 * Save a batch of reviewed questions to the bank in one transaction
 */
router.post("/save", asyncHandler(async (req, res) => {
    const facultyId = ownerId(req);
    const questions = (Array.isArray(req.body.questions) ? req.body.questions : [])
        .map((q) => normalizeQuestion(q, { difficulty: "MEDIUM", subjectTopic: "" }))
        .filter(Boolean)
        .slice(0, 100);

    if (!facultyId) return ApiResponse.error(res, "faculty_user_id is required", 400);
    if (!questions.length) return ApiResponse.error(res, "No valid questions to save", 400);

    const connection = await db.promise.getConnection();
    try {
        await connection.beginTransaction();
        const ids = [];
        for (const q of questions) {
            const [result] = await connection.query(
                `INSERT INTO question_bank
                 (faculty_user_id, content, question_type, difficulty_level, subject_topic, tags, correct_answer, option_a, option_b, option_c, option_d)
                 VALUES (?, ?, 'MCQ', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [facultyId, q.content, q.difficulty_level, q.subject_topic, q.tags, q.correct_answer, q.option_a, q.option_b, q.option_c, q.option_d]
            );
            ids.push(result.insertId);
        }
        await connection.commit();
        return ApiResponse.success(res, { question_ids: ids }, `Saved ${ids.length} questions to your bank`, 201);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

/**
 * POST /api/generator/auto-test
 * Create an exam and fill it from the question bank by topic + difficulty mix
 */
router.post("/auto-test", asyncHandler(async (req, res) => {
    const facultyId = ownerId(req);
    const { title, duration_minutes, scheduled_time } = req.body;
    const questionCount = Math.min(Math.max(parseInt(req.body.question_count, 10) || 10, 1), 100);
    const topics = Array.isArray(req.body.topics) ? req.body.topics.filter(Boolean).map(String) : [];
    const mix = req.body.difficulty_mix || { EASY: 30, MEDIUM: 50, HARD: 20 };
    const useAllQuestions = req.body.source === "all";

    if (!facultyId) return ApiResponse.error(res, "faculty_user_id is required", 400);
    if (!title || !Number(duration_minutes) || !scheduled_time) {
        return ApiResponse.error(res, "Title, duration and scheduled time are required", 400);
    }

    const where = [];
    const params = [];
    if (!useAllQuestions) {
        where.push("faculty_user_id = ?");
        params.push(facultyId);
    }
    if (topics.length) {
        where.push(`COALESCE(NULLIF(subject_topic, ''), 'General') IN (${topics.map(() => "?").join(",")})`);
        params.push(...topics);
    }

    const [candidates] = await db.promise.query(
        `SELECT question_id, difficulty_level, subject_topic FROM question_bank ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
        params
    );
    if (!candidates.length) {
        return ApiResponse.error(res, "No questions match those topics. Add or generate questions first.", 422);
    }

    const picked = pickQuestions(candidates, questionCount, mix);

    const connection = await db.promise.getConnection();
    try {
        await connection.beginTransaction();
        const [exam] = await connection.query(
            "INSERT INTO examination (title, duration_minutes, scheduled_time, faculty_user_id) VALUES (?, ?, ?, ?)",
            [title, Number(duration_minutes), scheduled_time, facultyId]
        );
        await connection.query(
            "INSERT INTO exam_questions (exam_id, question_id) VALUES ?",
            [picked.map((q) => [exam.insertId, q.question_id])]
        );
        await connection.commit();

        const breakdown = { EASY: 0, MEDIUM: 0, HARD: 0 };
        picked.forEach((q) => { breakdown[q.difficulty_level] = (breakdown[q.difficulty_level] || 0) + 1; });

        logger.info(`Auto-generated exam ${exam.insertId} with ${picked.length} questions by user ${req.user.user_id}`);
        return ApiResponse.success(
            res,
            { exam_id: exam.insertId, question_count: picked.length, requested: questionCount, breakdown },
            picked.length < questionCount
                ? `Test created with ${picked.length} questions (only ${picked.length} matched)`
                : `Test created with ${picked.length} questions`,
            201
        );
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

module.exports = router;
