const db = require("../config/db");

exports.saveAnswer = (req, res) => {
    const { attempt_id, question_id, selected_answer } = req.body;

    if (!attempt_id || !question_id || !selected_answer) {
        return res.status(400).json({
            success: false,
            message: "attempt_id, question_id, and selected_answer are required"
        });
    }

    // The attempt must belong to this student, still be ongoing,
    // and the question must be part of that attempt's exam
    const scoreSql = `
        SELECT q.correct_answer, a.student_user_id, a.status
        FROM attempt a
        JOIN exam_questions eq ON eq.exam_id = a.exam_id
        JOIN question_bank q ON q.question_id = eq.question_id
        WHERE a.attempt_id = ? AND q.question_id = ?
    `;

    db.query(scoreSql, [attempt_id, question_id], (scoreErr, scoreRows) => {
        if (scoreErr) {
            return res.status(500).json({
                success: false,
                error: scoreErr.message
            });
        }

        if (scoreRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Question not found in this exam"
            });
        }

        if (Number(scoreRows[0].student_user_id) !== Number(req.user.user_id)) {
            return res.status(403).json({
                success: false,
                message: "This attempt does not belong to you"
            });
        }

        if (scoreRows[0].status !== "ONGOING") {
            return res.status(409).json({
                success: false,
                message: "This exam has already been submitted"
            });
        }

        const selected = String(selected_answer).trim();
        const correct = String(scoreRows[0].correct_answer || "").trim();
        const isCorrect = selected.toUpperCase() === correct.toUpperCase();
        const marks = isCorrect ? 1 : 0;

        const findSql = `
            SELECT answer_id
            FROM student_answers
            WHERE attempt_id = ? AND question_id = ?
            LIMIT 1
        `;

        db.query(findSql, [attempt_id, question_id], (findErr, rows) => {
            if (findErr) {
                return res.status(500).json({
                    success: false,
                    error: findErr.message
                });
            }

            const params = [selected, isCorrect, marks];
            let sql;

            if (rows.length > 0) {
                sql = `
                    UPDATE student_answers
                    SET selected_answer = ?,
                        is_correct = ?,
                        marks_obtained = ?
                    WHERE answer_id = ?
                `;
                params.push(rows[0].answer_id);
            } else {
                sql = `
                    INSERT INTO student_answers
                    (
                        selected_answer,
                        is_correct,
                        marks_obtained,
                        attempt_id,
                        question_id
                    )
                    VALUES (?, ?, ?, ?, ?)
                `;
                params.push(attempt_id, question_id);
            }

            db.query(sql, params, (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    // Correctness is never revealed while the exam is in progress
                    message: "Answer saved"
                });
            });
        });
    });
};
