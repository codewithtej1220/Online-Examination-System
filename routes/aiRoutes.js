const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const aiController = require("../controllers/aiController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// All routes require authentication and faculty role
router.use(verifyToken);
router.use(requireRole('faculty'));

/**
 * POST /api/ai/upload-syllabus
 * Upload and extract text from syllabus file (PDF/TXT)
 */
router.post("/upload-syllabus", upload.single('file'), aiController.uploadSyllabus);

/**
 * POST /api/ai/generate-questions
 * Generate questions using AI based on syllabus content
 */
router.post("/generate-questions", aiController.generateQuestions);

/**
 * POST /api/ai/save-questions
 * Save AI-generated questions to question bank
 */
router.post("/save-questions", aiController.saveQuestions);

/**
 * POST /api/ai/evaluate-essay
 * Evaluate essay answer using AI
 */
router.post("/evaluate-essay", aiController.evaluateEssay);

/**
 * GET /api/ai/history
 * Get AI generation history for the faculty member
 */
router.get("/history", aiController.getGenerationHistory);

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get("/health", aiController.checkAIServiceHealth);

/**
 * POST /api/ai/proctor/start-session
 * Start proctoring session with baselines
 */
router.post("/proctor/start-session", aiController.startProctoringSession);

/**
 * POST /api/ai/proctor/analyze-stream
 * Analyze video/audio stream for violations
 */
router.post("/proctor/analyze-stream", aiController.analyzeProctoringStream);

/**
 * GET /api/ai/proctor/session-summary/:studentId/:examId/:attemptId
 * Get session summary
 */
router.get("/proctor/session-summary/:studentId/:examId/:attemptId", aiController.getProctoringSessionSummary);

/**
 * POST /api/ai/proctor/end-session/:studentId/:examId/:attemptId
 * End proctoring session
 */
router.post("/proctor/end-session/:studentId/:examId/:attemptId", aiController.endProctoringSession);

module.exports = router;
