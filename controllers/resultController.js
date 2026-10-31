const db = require("../config/db");


// ==========================
// CREATE RESULT
// ==========================
exports.createResult = (req, res) => {

    const {
        attempt_id,
        exam_id,
        total_marks
    } = req.body;

    if (!attempt_id || !exam_id) {
        return res.status(400).json({
            success: false,
            message: "attempt_id and exam_id required"
        });
    }

    const sql = `
        INSERT INTO result
        (
            attempt_id,
            exam_id,
            total_marks,
            submitted_at,
            is_published
        )
        VALUES (?, ?, ?, NOW(), false)
    `;

    db.query(
        sql,
        [attempt_id, exam_id, total_marks || 0],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Result created successfully",
                result_id: result.insertId
            });
        }
    );
};


// ==========================
// GET ALL RESULTS
// ==========================
exports.getResults = (req, res) => {

    const sql = `
        SELECT 
            r.*,
            a.student_user_id,
            a.exam_id,
            e.title AS exam_title,
            u.username AS student_name
        FROM result r
        JOIN attempt a ON r.attempt_id = a.attempt_id
        LEFT JOIN examination e ON r.exam_id = e.exam_id
        LEFT JOIN users u ON a.student_user_id = u.user_id
        ORDER BY r.submitted_at DESC
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
            results: results
        });
    });
};


// ==========================
// GET STUDENT RESULTS
// ==========================
exports.getStudentResults = (req, res) => {
    const { student_user_id } = req.params;

    if (!student_user_id) {
        return res.status(400).json({
            success: false,
            message: "student_user_id required"
        });
    }

    const sql = `
        SELECT 
            r.*,
            a.student_user_id,
            a.exam_id,
            a.start_time,
            a.end_time,
            e.title AS exam_title,
            e.duration_minutes,
            (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = r.exam_id) as total_questions,
            (SELECT COUNT(*) FROM student_answers sa WHERE sa.attempt_id = r.attempt_id) as answered
        FROM result r
        JOIN attempt a ON r.attempt_id = a.attempt_id
        LEFT JOIN examination e ON r.exam_id = e.exam_id
        WHERE a.student_user_id = ?
        ORDER BY r.submitted_at DESC
    `;

    db.query(sql, [student_user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            results: results
        });
    });
};


// ==========================
// PUBLISH RESULT
// ==========================
exports.publishResult = (req, res) => {

    const { result_id } = req.body;

    const sql = `
        UPDATE result
        SET is_published = true
        WHERE result_id = ?
    `;

    db.query(sql, [result_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Result published"
        });
    });
};