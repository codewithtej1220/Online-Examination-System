/**
 * Standardized API Response Handler
 * Ensures consistent response format across all endpoints
 */

class ApiResponse {
    /**
     * Send success response
     * @param {Object} res - Express response object
     * @param {Object} data - Response data
     * @param {String} message - Success message
     * @param {Number} statusCode - HTTP status code
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send error response
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     * @param {Number} statusCode - HTTP status code
     * @param {Object} errors - Validation errors (optional)
     */
    static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Send validation error response
     * @param {Object} res - Express response object
     * @param {Array} errors - Validation errors
     */
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send unauthorized response
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send forbidden response
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static forbidden(res, message = 'Access forbidden') {
        return res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send not found response
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ApiResponse;
