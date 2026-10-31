const express = require("express");
const router = express.Router();

const studentAnswerController =
require("../controllers/studentAnswerController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");


// save answer
router.post(
    "/save",
    verifyToken,
    requireRole("student"),
    studentAnswerController.saveAnswer
);

module.exports = router;
