/**
 * Global Error Handling Middleware
 * Catches all errors and sends consistent error responses
 */

const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.user_id
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry - record already exists';
    }

    // Don't leak error details in production
    const errorResponse = {
        message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err 
        })
    };

    return ApiResponse.error(res, message, statusCode, 
        process.env.NODE_ENV === 'development' ? errorResponse : null
    );
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};

/**
 * Async error wrapper
 * Wraps async functions to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};
