const db = require("../config/db");
const { ELIGIBLE_EXAM_FILTER } = require("./studentExamController");

exports.startExam = (req, res) => {
    // Students can only start attempts for themselves
    const student_user_id = req.user.user_id;
    const { exam_id } = req.body;

    if (!exam_id) {
        return res.status(400).json({
            success: false,
            message: "exam_id required"
        });
    }

    const eligibilitySql = `SELECT e.exam_id FROM examination e WHERE e.exam_id = ? AND ${ELIGIBLE_EXAM_FILTER}`;

    db.query(eligibilitySql, [exam_id, student_user_id], (eligErr, eligibleRows) => {
        if (eligErr) {
            return res.status(500).json({
                success: false,
                error: eligErr.message
            });
        }

        if (eligibleRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this exam"
            });
        }

        // Resume an ongoing attempt instead of creating a duplicate
        const checkSql = `
            SELECT *
            FROM attempt
            WHERE student_user_id = ?
              AND exam_id = ?
            ORDER BY (status = 'ONGOING') DESC, start_time DESC
            LIMIT 1
        `;

        db.query(checkSql, [student_user_id, exam_id], (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Each exam can be submitted once per student
            if (rows.length > 0 && rows[0].status !== "ONGOING") {
                return res.status(409).json({
                    success: false,
                    message: "You have already submitted this exam"
                });
            }

            if (rows.length > 0) {
                return res.json({
                    success: true,
                    message: "Exam already started",
                    attempt_id: rows[0].attempt_id,
                    start_time: rows[0].start_time
                });
            }

            const sql = `
                INSERT INTO attempt (student_user_id, exam_id, status, start_time)
                VALUES (?, ?, 'ONGOING', NOW())
            `;

            db.query(sql, [student_user_id, exam_id], (err2, result) => {
                if (err2) {
                    return res.status(500).json({
                        success: false,
                        error: err2.message
                    });
                }

                res.json({
                    success: true,
                    message: "Exam started",
                    attempt_id: result.insertId,
                    start_time: new Date()
                });
            });
        });
    });
};

exports.getAttempts = (req, res) => {
    const sql = `
        SELECT
            a.*,
            u.username AS student_name,
            e.title AS exam_title
        FROM attempt a
        LEFT JOIN users u ON a.student_user_id = u.user_id
        LEFT JOIN examination e ON a.exam_id = e.exam_id
        ORDER BY a.start_time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            attempts: results
        });
    });
};
