const express = require("express");
const router = express.Router();

const examController = require("../controllers/examController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

// create exam
router.post("/create", requireRole("faculty", "admin"), examController.createExam);

// get all exams
router.get("/all", examController.getExams);
router.get("/paper/:examId", examController.getExamPaper);

module.exports = router;
