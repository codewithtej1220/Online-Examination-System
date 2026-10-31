const db = require("../config/db");

// An exam is visible to a student when the student is assigned to it,
// or when the exam has no assignments at all (open to every student).
const ELIGIBLE_EXAM_FILTER = `
    (
        EXISTS (SELECT 1 FROM student_exam se WHERE se.exam_id = e.exam_id AND se.student_user_id = ?)
        OR NOT EXISTS (SELECT 1 FROM student_exam se2 WHERE se2.exam_id = e.exam_id)
    )
`;

exports.ELIGIBLE_EXAM_FILTER = ELIGIBLE_EXAM_FILTER;


// ==========================
// ASSIGN STUDENT TO EXAM
// ==========================
exports.assignStudent = (req, res) => {

    const { student_user_id, exam_id } = req.body;

    if (!student_user_id || !exam_id) {
        return res.status(400).json({
            success: false,
            message: "student_user_id and exam_id required"
        });
    }

    const sql = `
        INSERT INTO student_exam
        (student_user_id, exam_id)
        VALUES (?, ?)
    `;

    db.query(sql, [student_user_id, exam_id], (err) => {

        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ success: false, message: "Student is already assigned to this exam" });
            }
            if (err.code === "ER_NO_REFERENCED_ROW_2") {
                return res.status(404).json({ success: false, message: "Student or exam does not exist" });
            }
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Student assigned to exam"
        });
    });
};


// ==========================
// GET EXAMS OF STUDENT
// ==========================
exports.getStudentExams = (req, res) => {

    const studentId = req.params.studentId;

    const sql = `
        SELECT
            e.exam_id,
            e.title,
            e.duration_minutes,
            e.scheduled_time,
            e.faculty_user_id,
            (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.exam_id) AS question_count,
            (SELECT a.status FROM attempt a
              WHERE a.exam_id = e.exam_id AND a.student_user_id = ?
              ORDER BY a.start_time DESC LIMIT 1) AS attempt_status
        FROM examination e
        WHERE ${ELIGIBLE_EXAM_FILTER}
        ORDER BY e.scheduled_time DESC, e.created_at DESC
    `;

    db.query(sql, [studentId, studentId], (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            exams: results
        });
    });
};
