/**
 * Input Validation Middleware
 * Validates and sanitizes user input
 */

const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Handle validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));
        return ApiResponse.validationError(res, formattedErrors);
    }
    next();
};

/**
 * Validation rules for user registration
 */
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores')
        .escape(),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('Role must be student, faculty, or admin'),
    
    // Optional fields for student - accepts undefined, null, or empty string
    body('current_semester')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 12 })
        .withMessage('Semester must be between 1 and 12'),
    
    body('major_program')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Major program must be less than 100 characters')
        .escape(),
    
    // Optional fields for faculty - accepts undefined, null, or empty string
    body('department')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Department must be less than 100 characters')
        .escape(),
    
    // Optional fields for admin - accepts undefined, null, or empty string
    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    
    validate
];

/**
 * Validation rules for login
 */
const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .escape(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    validate
];

/**
 * Validation rules for creating a question
 */
const validateQuestion = [
    body('faculty_user_id')
        .isInt({ min: 1 })
        .withMessage('Valid faculty user ID is required'),
    
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Question content is required')
        .isLength({ max: 1000 })
        .withMessage('Question content must be less than 1000 characters'),
    
    body('question_type')
        .isIn(['MCQ'])
        .withMessage('Question type must be MCQ'),
    
    body('difficulty_level')
        .isIn(['EASY', 'MEDIUM', 'HARD'])
        .withMessage('Difficulty level must be EASY, MEDIUM, or HARD'),
    
    body('correct_answer')
        .trim()
        .notEmpty()
        .withMessage('Correct answer is required')
        .isIn(['A', 'B', 'C', 'D'])
        .withMessage('Correct answer must be A, B, C, or D'),
    
    body('option_a')
        .trim()
        .notEmpty()
        .withMessage('Option A is required')
        .isLength({ max: 500 })
        .withMessage('Option must be less than 500 characters'),
    
    body('option_b')
        .trim()
        .notEmpty()
        .withMessage('Option B is required')
        .isLength({ max: 500 })
        .withMessage('Option must be less than 500 characters'),
    
    body('option_c')
        .trim()
        .notEmpty()
        .withMessage('Option C is required')
        .isLength({ max: 500 })
        .withMessage('Option must be less than 500 characters'),
    
    body('option_d')
        .trim()
        .notEmpty()
        .withMessage('Option D is required')
        .isLength({ max: 500 })
        .withMessage('Option must be less than 500 characters'),
    
    body('subject_topic')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Subject topic must be less than 150 characters')
        .escape(),
    
    body('tags')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Tags must be less than 255 characters')
        .escape(),
    
    validate
];

/**
 * Validation rules for creating an exam
 */
const validateExam = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Exam title is required')
        .isLength({ max: 200 })
        .withMessage('Title must be less than 200 characters')
        .escape(),
    
    body('duration_minutes')
        .isInt({ min: 1, max: 300 })
        .withMessage('Duration must be between 1 and 300 minutes'),
    
    body('scheduled_time')
        .notEmpty()
        .withMessage('Scheduled time is required')
        .isISO8601()
        .withMessage('Scheduled time must be a valid date-time'),
    
    body('faculty_user_id')
        .isInt({ min: 1 })
        .withMessage('Valid faculty user ID is required'),
    
    body('randomize_questions')
        .optional()
        .isBoolean()
        .withMessage('Randomize questions must be true or false'),
    
    validate
];

/**
 * Validation rules for ID parameters
 */
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),
    
    validate
];

/**
 * Validation rules for attempt submission
 */
const validateAttempt = [
    body('student_user_id')
        .isInt({ min: 1 })
        .withMessage('Valid student user ID is required'),
    
    body('exam_id')
        .isInt({ min: 1 })
        .withMessage('Valid exam ID is required'),
    
    validate
];

/**
 * Validation rules for saving answers
 */
const validateAnswer = [
    body('attempt_id')
        .isInt({ min: 1 })
        .withMessage('Valid attempt ID is required'),
    
    body('question_id')
        .isInt({ min: 1 })
        .withMessage('Valid question ID is required'),
    
    body('selected_answer')
        .trim()
        .isIn(['A', 'B', 'C', 'D'])
        .withMessage('Selected answer must be A, B, C, or D'),
    
    validate
];

module.exports = {
    validate,
    validateRegistration,
    validateLogin,
    validateQuestion,
    validateExam,
    validateId,
    validateAttempt,
    validateAnswer
};
