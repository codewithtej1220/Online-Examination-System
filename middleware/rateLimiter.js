/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/ApiResponse');

/**
 * General rate limiter for all routes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return ApiResponse.error(
            res,
            'Too many requests, please try again later',
            429
        );
    }
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Increased to 50 login attempts for testing/demo
    message: 'Too many login attempts, please try again after 15 minutes',
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        return ApiResponse.error(
            res,
            'Too many login attempts, please try again after 15 minutes',
            429
        );
    }
});

/**
 * Rate limiter for registration
 */
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (reduced for testing)
    max: 50, // Increased to 50 registrations per 15 minutes for testing/demo
    message: 'Too many accounts created, please try again after 15 minutes',
    handler: (req, res) => {
        return ApiResponse.error(
            res,
            'Too many accounts created from this IP, please try again later',
            429
        );
    }
});

/**
 * Rate limiter for API queries (stricter for security)
 */
const queryLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit to 10 queries per minute
    message: 'Too many queries, please slow down',
    handler: (req, res) => {
        return ApiResponse.error(
            res,
            'Query rate limit exceeded, please slow down',
            429
        );
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    registerLimiter,
    queryLimiter
};
