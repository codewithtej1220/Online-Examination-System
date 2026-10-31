const express = require("express");
const router = express.Router();

const studentExamController =
require("../controllers/studentExamController");
const { verifyToken, requireRole, requireSelfOrRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

// assign student to exam
router.post(
    "/assign",
    requireRole("faculty", "admin"),
    studentExamController.assignStudent
);


// get exams of student
router.get(
    "/:studentId",
    requireSelfOrRole("studentId", "faculty", "admin"),
    studentExamController.getStudentExams
);

module.exports = router;
