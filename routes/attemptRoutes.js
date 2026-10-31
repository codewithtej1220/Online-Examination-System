const express = require("express");
const router = express.Router();

const attemptController =
require("../controllers/attemptController");

const evaluationController =
require("../controllers/evaluationController");

const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken);


// ==========================
// START EXAM
// ==========================
router.post(
    "/start",
    requireRole("student"),
    attemptController.startExam
);


// ==========================
// SUBMIT EXAM (AUTO EVALUATION)
// ==========================
router.post(
    "/submit",
    requireRole("student"),
    evaluationController.submitExam
);


// ==========================
// GET ALL ATTEMPTS
// ==========================
router.get(
    "/all",
    requireRole("faculty", "admin"),
    attemptController.getAttempts
);

module.exports = router;
