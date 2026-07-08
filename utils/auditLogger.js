/**
 * Audit Logger
 * Logs all important actions to the audit_log table
 */

const db = require('../config/db');
const logger = require('./logger');

class AuditLogger {
    /**
     * Log an action to the audit log
     * @param {Object} params - Audit log parameters
     * @param {Number} params.userId - User ID performing the action
     * @param {String} params.action - Action performed (e.g., 'LOGIN', 'CREATE_EXAM', 'DELETE_USER')
     * @param {String} params.tableName - Table affected (optional)
     * @param {Number} params.recordId - Record ID affected (optional)
     * @param {Object} params.oldValue - Old value before change (optional)
     * @param {Object} params.newValue - New value after change (optional)
     * @param {String} params.ipAddress - IP address of user (optional)
     * @param {String} params.userAgent - User agent string (optional)
     */
    static log({
        userId,
        action,
        tableName = null,
        recordId = null,
        oldValue = null,
        newValue = null,
        ipAddress = null,
        userAgent = null
    }) {
        const sql = `
            INSERT INTO audit_log 
            (user_id, action, table_name, record_id, old_value, new_value, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            userId,
            action,
            tableName,
            recordId,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress,
            userAgent
        ];

        db.query(sql, params, (err) => {
            if (err) {
                logger.error('Failed to write audit log:', err);
            }
        });
    }

    /**
     * Log a login attempt
     */
    static logLogin(userId, success, ipAddress, userAgent) {
        this.log({
            userId,
            action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            ipAddress,
            userAgent
        });
    }

    /**
     * Log a user registration
     */
    static logRegistration(userId, role, ipAddress, userAgent) {
        this.log({
            userId,
            action: 'USER_REGISTERED',
            tableName: 'users',
            recordId: userId,
            newValue: { role },
            ipAddress,
            userAgent
        });
    }

    /**
     * Log exam creation
     */
    static logExamCreation(userId, examId, examData, ipAddress) {
        this.log({
            userId,
            action: 'EXAM_CREATED',
            tableName: 'examination',
            recordId: examId,
            newValue: examData,
            ipAddress
        });
    }

    /**
     * Log exam update
     */
    static logExamUpdate(userId, examId, oldData, newData, ipAddress) {
        this.log({
            userId,
            action: 'EXAM_UPDATED',
            tableName: 'examination',
            recordId: examId,
            oldValue: oldData,
            newValue: newData,
            ipAddress
        });
    }

    /**
     * Log exam deletion
     */
    static logExamDeletion(userId, examId, examData, ipAddress) {
        this.log({
            userId,
            action: 'EXAM_DELETED',
            tableName: 'examination',
            recordId: examId,
            oldValue: examData,
            ipAddress
        });
    }

    /**
     * Log question creation
     */
    static logQuestionCreation(userId, questionId, ipAddress) {
        this.log({
            userId,
            action: 'QUESTION_CREATED',
            tableName: 'question_bank',
            recordId: questionId,
            ipAddress
        });
    }

    /**
     * Log exam attempt start
     */
    static logExamStart(userId, examId, attemptId, ipAddress) {
        this.log({
            userId,
            action: 'EXAM_STARTED',
            tableName: 'attempt',
            recordId: attemptId,
            newValue: { examId },
            ipAddress
        });
    }

    /**
     * Log exam submission
     */
    static logExamSubmission(userId, attemptId, ipAddress) {
        this.log({
            userId,
            action: 'EXAM_SUBMITTED',
            tableName: 'attempt',
            recordId: attemptId,
            ipAddress
        });
    }

    /**
     * Log result publication
     */
    static logResultPublication(userId, resultId, ipAddress) {
        this.log({
            userId,
            action: 'RESULT_PUBLISHED',
            tableName: 'result',
            recordId: resultId,
            ipAddress
        });
    }

    /**
     * Get audit logs for a user
     */
    static getUserLogs(userId, limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM audit_log 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;

            db.query(sql, [userId, limit], (err, results) => {
                if (err) {
                    logger.error('Failed to fetch audit logs:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    /**
     * Get recent audit logs
     */
    static getRecentLogs(limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    al.*,
                    u.username,
                    u.role
                FROM audit_log al
                LEFT JOIN users u ON al.user_id = u.user_id
                ORDER BY al.created_at DESC 
                LIMIT ?
            `;

            db.query(sql, [limit], (err, results) => {
                if (err) {
                    logger.error('Failed to fetch recent logs:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = AuditLogger;
