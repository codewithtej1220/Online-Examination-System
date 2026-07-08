const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");

/**
 * Verify JWT Token Middleware
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return ApiResponse.unauthorized(res, "No token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return ApiResponse.unauthorized(res, "Invalid token format");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        // Log the access
        logger.info(`User ${decoded.user_id} (${decoded.role}) accessed ${req.method} ${req.originalUrl}`);
        
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return ApiResponse.unauthorized(res, "Token expired, please login again");
        }
        if (err.name === 'JsonWebTokenError') {
            return ApiResponse.unauthorized(res, "Invalid token");
        }
        return ApiResponse.unauthorized(res, "Token verification failed");
    }
};

/**
 * Role-based access control middleware
 * Usage: verifyToken, requireRole('admin', 'faculty')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, "Authentication required");
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`User ${req.user.user_id} (${req.user.role}) attempted unauthorized access to ${req.originalUrl}`);
            return ApiResponse.forbidden(res, "You do not have permission to perform this action");
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if invalid
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Silently fail for optional auth
    }
    
    next();
};

module.exports = {
    verifyToken,
    requireRole,
    optionalAuth
};
