const express = require("express");
const router = express.Router();

const examQuestionController =
require("../controllers/examQuestionController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken, requireRole("faculty", "admin"));

// assign question to exam
router.post(
    "/assign",
    examQuestionController.assignQuestion
);


// get questions of exam
router.get(
    "/:examId",
    examQuestionController.getExamQuestions
);

module.exports = router;
