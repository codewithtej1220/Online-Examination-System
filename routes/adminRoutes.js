const express = require("express");
const router = express.Router();

const db = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(verifyToken, requireRole("admin"));

/**
 * GET /api/admin/overview
 * Real system metrics for the admin dashboard
 */
router.get("/overview", asyncHandler(async (req, res) => {
    const pool = db.promise;

    const [
        [roleRows],
        [[counts]],
        [[scoreRow]],
        [trendRows],
        [distributionRows],
        [topExamRows]
    ] = await Promise.all([
        pool.query("SELECT role, COUNT(*) AS count FROM users GROUP BY role"),
        pool.query(`
            SELECT
                (SELECT COUNT(*) FROM examination) AS exams,
                (SELECT COUNT(*) FROM question_bank) AS questions,
                (SELECT COUNT(*) FROM attempt) AS attempts,
                (SELECT COUNT(*) FROM attempt WHERE status = 'ONGOING') AS ongoing,
                (SELECT COUNT(*) FROM result) AS results
        `),
        // Average percentage score: marks divided by the number of questions in each exam
        pool.query(`
            SELECT ROUND(AVG(r.total_marks / NULLIF(qc.cnt, 0)) * 100, 1) AS avgScore
            FROM result r
            JOIN (SELECT exam_id, COUNT(*) AS cnt FROM exam_questions GROUP BY exam_id) qc ON qc.exam_id = r.exam_id
        `),
        pool.query(`
            SELECT DATE(start_time) AS day, COUNT(*) AS attempts
            FROM attempt
            WHERE start_time >= CURDATE() - INTERVAL 6 DAY
            GROUP BY DATE(start_time)
        `),
        pool.query(`
            SELECT
                LEAST(FLOOR((r.total_marks / NULLIF(qc.cnt, 0)) * 100 / 20), 4) AS bucket,
                COUNT(*) AS count
            FROM result r
            JOIN (SELECT exam_id, COUNT(*) AS cnt FROM exam_questions GROUP BY exam_id) qc ON qc.exam_id = r.exam_id
            GROUP BY bucket
        `),
        pool.query(`
            SELECT e.exam_id, e.title, COUNT(a.attempt_id) AS attempts
            FROM examination e
            LEFT JOIN attempt a ON a.exam_id = e.exam_id
            GROUP BY e.exam_id, e.title
            ORDER BY attempts DESC
            LIMIT 5
        `)
    ]);

    // Proctoring tables are optional (created by a separate migration)
    let violations = 0;
    try {
        const [[violationRow]] = await pool.query(
            "SELECT COUNT(*) AS count FROM proctoring_logs WHERE severity IN ('medium', 'high', 'critical')"
        );
        violations = Number(violationRow.count);
    } catch (err) {
        logger.warn(`Proctoring logs unavailable for overview: ${err.message}`);
    }

    const roles = { student: 0, faculty: 0, admin: 0 };
    roleRows.forEach((row) => { roles[row.role] = Number(row.count); });

    // Fill the last 7 days so days without attempts show as zero
    const trendByDay = new Map(trendRows.map((row) => [new Date(row.day).toDateString(), Number(row.attempts)]));
    const trend = [];
    for (let offset = 6; offset >= 0; offset--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - offset);
        trend.push({
            date: day.toLocaleDateString("en-US", { weekday: "short" }),
            attempts: trendByDay.get(day.toDateString()) || 0
        });
    }

    const bucketLabels = ["0-19%", "20-39%", "40-59%", "60-79%", "80-100%"];
    const distribution = bucketLabels.map((label, index) => ({
        label,
        count: Number(distributionRows.find((row) => Number(row.bucket) === index)?.count || 0)
    }));

    return ApiResponse.success(res, {
        roles,
        totals: {
            users: roles.student + roles.faculty + roles.admin,
            exams: Number(counts.exams),
            questions: Number(counts.questions),
            attempts: Number(counts.attempts),
            ongoing: Number(counts.ongoing),
            results: Number(counts.results)
        },
        avgScore: scoreRow.avgScore === null ? null : Number(scoreRow.avgScore),
        violations,
        trend,
        distribution,
        topExams: topExamRows.map((row) => ({ ...row, attempts: Number(row.attempts) }))
    });
}));

/**
 * GET /api/admin/users
 * User directory (never includes password hashes)
 */
router.get("/users", asyncHandler(async (req, res) => {
    const [users] = await db.promise.query(`
        SELECT user_id, username, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 200
    `);
    return ApiResponse.success(res, { users });
}));

module.exports = router;
