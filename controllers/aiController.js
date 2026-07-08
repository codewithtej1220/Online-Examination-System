const axios = require("axios");
const db = require("../config/db");
const logger = require("../utils/logger");

// AI Service URL from environment
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Upload syllabus file and extract text
 */
exports.uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const file = req.file;
        
        // Create FormData for multipart upload to Python service
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // Send to AI service for text extraction
        const response = await axios.post(
            `${AI_SERVICE_URL}/extract-text`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 30000 // 30 second timeout
            }
        );

        logger.info(`Syllabus uploaded by faculty ${req.user.user_id}: ${file.originalname}`);

        res.json({
            success: true,
            message: "Syllabus text extracted successfully",
            data: {
                filename: file.originalname,
                extractedText: response.data.extractedText,
                wordCount: response.data.wordCount
            }
        });

    } catch (error) {
        logger.error("Syllabus upload error:", error);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: "AI service is unavailable. Please ensure the AI microservice is running.",
                error: "Service unavailable"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to extract text from syllabus",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Generate questions using AI
 */
exports.generateQuestions = async (req, res) => {
    try {
        const {
            syllabusText,
            questionType,
            count,
            difficultyLevel,
            subjectTopic
        } = req.body;

        // Validation
        if (!syllabusText || !questionType) {
            return res.status(400).json({
                success: false,
                message: "Syllabus text and question type are required"
            });
        }

        if (!['MCQ', 'Essay', 'FillInBlank'].includes(questionType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question type. Must be MCQ, Essay, or FillInBlank"
            });
        }

        // Send request to AI service
        const response = await axios.post(
            `${AI_SERVICE_URL}/generate-questions`,
            {
                syllabusText,
                questionType,
                count: count || 5,
                difficultyLevel: difficultyLevel || "MEDIUM",
                subjectTopic: subjectTopic || ""
            },
            {
                timeout: 60000 // 60 second timeout for question generation
            }
        );

        // Log generation to history
        const sql = `
            INSERT INTO ai_generation_history
            (faculty_user_id, syllabus_filename, syllabus_text, question_type, 
             requested_count, generated_count, difficulty_level, subject_topic)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                req.user.user_id,
                "direct_input",
                syllabusText.substring(0, 1000), // Store first 1000 chars
                questionType,
                count || 5,
                response.data.questions.length,
                difficultyLevel || "MEDIUM",
                subjectTopic || ""
            ],
            (err) => {
                if (err) {
                    logger.error("Failed to log AI generation:", err);
                }
            }
        );

        logger.info(`Questions generated for faculty ${req.user.user_id}: ${response.data.questions.length} ${questionType} questions`);

        res.json({
            success: true,
            message: response.data.message,
            questions: response.data.questions
        });

    } catch (error) {
        logger.error("Question generation error:", error);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: "AI service is unavailable",
                error: "Service unavailable"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to generate questions",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Save AI-generated questions to question bank
 */
exports.saveQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        const faculty_user_id = req.user.user_id;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Questions array is required"
            });
        }

        // Insert questions into database
        const sql = `
            INSERT INTO question_bank
            (faculty_user_id, content, question_type, difficulty_level, 
             subject_topic, tags, correct_answer, option_a, option_b, 
             option_c, option_d, ai_generated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;

        const savedQuestions = [];
        let errorCount = 0;

        for (const q of questions) {
            try {
                await new Promise((resolve, reject) => {
                    db.query(
                        sql,
                        [
                            faculty_user_id,
                            q.content,
                            q.question_type,
                            q.difficulty_level,
                            q.subject_topic || null,
                            q.tags || "AI-generated",
                            q.correct_answer || null,
                            q.option_a || null,
                            q.option_b || null,
                            q.option_c || null,
                            q.option_d || null
                        ],
                        (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                savedQuestions.push({
                                    question_id: result.insertId,
                                    content: q.content
                                });
                                resolve();
                            }
                        }
                    );
                });
            } catch (err) {
                logger.error("Failed to save question:", err);
                errorCount++;
            }
        }

        logger.info(`Saved ${savedQuestions.length} AI-generated questions for faculty ${faculty_user_id}`);

        res.json({
            success: true,
            message: `Successfully saved ${savedQuestions.length} questions${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
            savedQuestions,
            totalSaved: savedQuestions.length,
            totalFailed: errorCount
        });

    } catch (error) {
        logger.error("Save questions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save questions",
            error: error.message
        });
    }
};

/**
 * Evaluate essay answer using AI
 */
exports.evaluateEssay = async (req, res) => {
    try {
        const {
            questionContent,
            expectedAnswer,
            studentAnswer,
            maxMarks
        } = req.body;

        // Validation
        if (!questionContent || !studentAnswer) {
            return res.status(400).json({
                success: false,
                message: "Question content and student answer are required"
            });
        }

        // Send to AI service for evaluation
        const response = await axios.post(
            `${AI_SERVICE_URL}/evaluate-essay`,
            {
                questionContent,
                expectedAnswer: expectedAnswer || "",
                studentAnswer,
                maxMarks: maxMarks || 10
            },
            {
                timeout: 30000 // 30 second timeout
            }
        );

        logger.info(`Essay evaluated for faculty ${req.user.user_id}`);

        res.json({
            success: true,
            evaluation: response.data.evaluation
        });

    } catch (error) {
        logger.error("Essay evaluation error:", error);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: "AI service is unavailable",
                error: "Service unavailable"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to evaluate essay",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Get AI generation history
 */
exports.getGenerationHistory = (req, res) => {
    const faculty_user_id = req.user.user_id;

    const sql = `
        SELECT 
            generation_id,
            syllabus_filename,
            question_type,
            requested_count,
            generated_count,
            difficulty_level,
            subject_topic,
            created_at
        FROM ai_generation_history
        WHERE faculty_user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `;

    db.query(sql, [faculty_user_id], (err, results) => {
        if (err) {
            logger.error("Failed to fetch AI history:", err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            history: results
        });
    });
};

/**
 * Check AI service health
 */
exports.checkAIServiceHealth = async (req, res) => {
    try {
        const response = await axios.get(
            `${AI_SERVICE_URL}/health`,
            { timeout: 5000 }
        );

        res.json({
            success: true,
            aiService: {
                status: response.data.status,
                url: AI_SERVICE_URL,
                ...response.data
            }
        });

    } catch (error) {
        logger.error("AI service health check failed:", error);
        
        res.status(503).json({
            success: false,
            message: "AI service is unavailable",
            aiService: {
                status: "offline",
                url: AI_SERVICE_URL,
                error: error.code === 'ECONNREFUSED' ? "Connection refused" : error.message
            }
        });
    }
};

/**
 * Start proctoring session
 */
exports.startProctoringSession = async (req, res) => {
    try {
        const {
            studentId,
            examId,
            attemptId,
            baselineImage,
            baselineAudio
        } = req.body;

        // Send to AI service
        const response = await axios.post(
            `${AI_SERVICE_URL}/api/ai/proctor/start-session`,
            {
                studentId,
                examId,
                attemptId,
                baselineImage,
                baselineAudio
            },
            { timeout: 30000 }
        );

        logger.info(`Proctoring session started for student ${studentId}, exam ${examId}`);

        res.json(response.data);

    } catch (error) {
        logger.error("Start proctoring session error:", error);
        
        res.status(500).json({
            success: false,
            message: "Failed to start proctoring session",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Analyze proctoring stream
 */
exports.analyzeProctoringStream = async (req, res) => {
    try {
        const {
            studentId,
            examId,
            attemptId,
            frameData,
            audioData,
            audioMetadata
        } = req.body;

        // Send to AI service for analysis
        const response = await axios.post(
            `${AI_SERVICE_URL}/api/ai/proctor/analyze-stream`,
            {
                studentId,
                examId,
                attemptId,
                frameData,
                audioData,
                audioMetadata
            },
            { timeout: 10000 }
        );

        const analysis = response.data;

        // If violations detected, log to database
        if (analysis.aggregated_violations && analysis.aggregated_violations.has_violations) {
            await logProctoringViolations(studentId, examId, attemptId, analysis);
        }

        res.json(analysis);

    } catch (error) {
        logger.error("Proctoring analysis error:", error);
        
        res.status(500).json({
            success: false,
            message: "Failed to analyze proctoring stream",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Get proctoring session summary
 */
exports.getProctoringSessionSummary = async (req, res) => {
    try {
        const { studentId, examId, attemptId } = req.params;

        const response = await axios.get(
            `${AI_SERVICE_URL}/api/ai/proctor/session-summary/${studentId}/${examId}/${attemptId}`,
            { timeout: 5000 }
        );

        res.json(response.data);

    } catch (error) {
        logger.error("Get session summary error:", error);
        
        res.status(error.response?.status || 500).json({
            success: false,
            message: "Failed to get session summary",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * End proctoring session
 */
exports.endProctoringSession = async (req, res) => {
    try {
        const { studentId, examId, attemptId } = req.params;

        const response = await axios.post(
            `${AI_SERVICE_URL}/api/ai/proctor/end-session/${studentId}/${examId}/${attemptId}`,
            {},
            { timeout: 5000 }
        );

        logger.info(`Proctoring session ended for student ${studentId}, exam ${examId}`);

        res.json(response.data);

    } catch (error) {
        logger.error("End proctoring session error:", error);
        
        res.status(error.response?.status || 500).json({
            success: false,
            message: "Failed to end proctoring session",
            error: error.response?.data?.detail || error.message
        });
    }
};

/**
 * Helper function to log proctoring violations to database
 */
async function logProctoringViolations(studentId, examId, attemptId, analysis) {
    try {
        const violations = analysis.aggregated_violations.active_violations || [];
        
        for (const violation of violations) {
            const sql = `
                INSERT INTO proctoring_logs
                (attempt_id, student_user_id, exam_id, event_type, severity, details, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            
            await new Promise((resolve, reject) => {
                db.query(
                    sql,
                    [
                        attemptId,
                        studentId,
                        examId,
                        violation.type,
                        violation.severity,
                        violation.details
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    } catch (error) {
        logger.error("Failed to log proctoring violations:", error);
    }
}
