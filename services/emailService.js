/**
 * Email Service
 * Handles all email notifications
 */

const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        // Initialize transporter only if email is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false, // Use TLS
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            // Verify connection
            this.transporter.verify((error) => {
                if (error) {
                    logger.warn('Email service not configured:', error.message);
                } else {
                    logger.info('Email service ready');
                }
            });
        } else {
            logger.warn('Email service not configured - SMTP credentials missing');
        }
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            logger.warn('Email not sent - service not configured');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.APP_NAME || 'OES'}" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || this.stripHtml(html)
            });

            logger.info(`Email sent: ${info.messageId} to ${to}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Strip HTML tags for plain text version
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Render email template
     */
    async renderTemplate(templateName, data) {
        try {
            const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.ejs`);
            return await ejs.renderFile(templatePath, data);
        } catch (error) {
            logger.error(`Template render error (${templateName}):`, error);
            // Fallback to simple HTML
            return this.generateFallbackHtml(data);
        }
    }

    /**
     * Generate fallback HTML when template is missing
     */
    generateFallbackHtml(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #146c94; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f4f7fb; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${process.env.APP_NAME || 'OES'}</h1>
                    </div>
                    <div class="content">
                        ${data.message || 'Notification from Online Examination System'}
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Online Examination System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(user, email) {
        const html = await this.renderTemplate('welcome', {
            user,
            appUrl: process.env.APP_URL || 'http://localhost:5000',
            appName: process.env.APP_NAME || 'OES'
        });

        return this.sendEmail({
            to: email || user.email || `${user.username}@example.com`,
            subject: `Welcome to ${process.env.APP_NAME || 'OES'}!`,
            html
        });
    }

    /**
     * Send exam scheduled notification
     */
    async sendExamNotification(user, exam, email) {
        const html = await this.renderTemplate('exam-notification', {
            user,
            exam,
            appUrl: process.env.APP_URL || 'http://localhost:5000',
            appName: process.env.APP_NAME || 'OES'
        });

        return this.sendEmail({
            to: email || user.email || `${user.username}@example.com`,
            subject: `Exam Scheduled: ${exam.title}`,
            html
        });
    }

    /**
     * Send exam reminder (24h before)
     */
    async sendExamReminder(user, exam, email) {
        const html = await this.renderTemplate('exam-reminder', {
            user,
            exam,
            appUrl: process.env.APP_URL || 'http://localhost:5000',
            appName: process.env.APP_NAME || 'OES'
        });

        return this.sendEmail({
            to: email || user.email || `${user.username}@example.com`,
            subject: `Reminder: ${exam.title} - Tomorrow`,
            html
        });
    }

    /**
     * Send result published notification
     */
    async sendResultNotification(user, exam, result, email) {
        const html = await this.renderTemplate('result-notification', {
            user,
            exam,
            result,
            appUrl: process.env.APP_URL || 'http://localhost:5000',
            appName: process.env.APP_NAME || 'OES'
        });

        return this.sendEmail({
            to: email || user.email || `${user.username}@example.com`,
            subject: `Results Published: ${exam.title}`,
            html
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(user, resetToken, email) {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
        
        const html = await this.renderTemplate('password-reset', {
            user,
            resetUrl,
            appName: process.env.APP_NAME || 'OES'
        });

        return this.sendEmail({
            to: email || user.email || `${user.username}@example.com`,
            subject: 'Password Reset Request',
            html
        });
    }

    /**
     * Send test email
     */
    async sendTestEmail(to) {
        return this.sendEmail({
            to,
            subject: 'Test Email from OES',
            html: this.generateFallbackHtml({
                message: '<h2>Test Email</h2><p>If you received this, email service is working correctly!</p>'
            })
        });
    }
}

module.exports = new EmailService();
