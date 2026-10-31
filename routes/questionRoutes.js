const express = require("express");
const router = express.Router();

const questionController = require("../controllers/questionController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Question bank includes correct answers, so it is staff-only
router.use(verifyToken, requireRole("faculty", "admin"));

// add question
router.post("/add", questionController.addQuestion);

// get all questions
router.get("/all", questionController.getQuestions);

module.exports = router;
