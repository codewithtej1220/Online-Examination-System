const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Import utilities and middleware
const db = require("./config/db");
const logger = require("./utils/logger");
const ApiResponse = require("./utils/ApiResponse");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { generalLimiter, queryLimiter } = require("./middleware/rateLimiter");
const { verifyToken, requireRole } = require("./middleware/authMiddleware");

// Import routes
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const examQuestionRoutes = require("./routes/examQuestionRoutes");
const studentExamRoutes = require("./routes/studentExamRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const resultRoutes = require("./routes/resultRoutes");
const studentExamViewRoutes = require("./routes/studentExamViewRoutes");
const studentAnswerRoutes = require("./routes/studentAnswerRoutes");
const proctoringRoutes = require("./routes/proctoringRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, configure for production
    crossOriginEmbedderPolicy: false
}));

// CORS configuration - allow all origins in development
const corsOptions = {
    origin: true, // Allow all origins
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
app.use('/api/', generalLimiter);

function serveReactApp(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const appIndex = path.join(__dirname, "public", "app", "index.html");
    res.sendFile(appIndex, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, "public", "legacy", "test.html"));
        }
    });
}

// Serve app shell without caching so browsers pick up new hashed bundles
app.get(["/app", "/app/"], serveReactApp);

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// Serve legacy demo explicitly
app.get("/legacy", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "legacy", "test.html"));
});

// Serve React app at root after it has been built, otherwise fall back to legacy demo
app.get("/", serveReactApp);

// Health check endpoint
app.get("/api/health", (req, res) => {
    db.query("SELECT 1 AS ok", (err) => {
        if (err) {
            logger.error("Health check failed:", err);
            return ApiResponse.error(res, "Database connection failed", 500);
        }

        return ApiResponse.success(res, {
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }, "System is healthy");
    });
});

// Database tables endpoint
app.get("/api/tables", (req, res) => {
    db.query("SHOW TABLES", (err, rows) => {
        if (err) {
            logger.error("Failed to fetch tables:", err);
            return ApiResponse.error(res, "Failed to fetch tables", 500);
        }

        const key = rows[0] ? Object.keys(rows[0])[0] : null;
        return ApiResponse.success(res, {
            tables: key ? rows.map((row) => row[key]) : []
        });
    });
});

// SQL Query endpoint - RESTRICTED TO ADMIN ONLY IN PRODUCTION
if (process.env.NODE_ENV !== 'production') {
    // Development: Allow with rate limiting
    app.post("/api/query", queryLimiter, (req, res) => {
        const { sql } = req.body;

        if (!sql || typeof sql !== "string") {
            return ApiResponse.error(res, "SQL query is required", 400);
        }

        // Prevent dangerous operations
        const dangerous = /\b(DROP|TRUNCATE|DELETE|UPDATE|ALTER|CREATE|INSERT)\b/i;
        if (dangerous.test(sql)) {
            logger.warn(`Dangerous SQL query attempted: ${sql}`);
            return ApiResponse.error(res, "Dangerous operations are not allowed", 403);
        }

        db.query(sql, (err, rows) => {
            if (err) {
                logger.error("Query execution failed:", err);
                return ApiResponse.error(res, err.message, 500);
            }

            return ApiResponse.success(res, { rows });
        });
    });
} else {
    // Production: Admin only or disable completely
    app.post("/api/query", verifyToken, requireRole('admin'), queryLimiter, (req, res) => {
        const { sql } = req.body;

        if (!sql || typeof sql !== "string") {
            return ApiResponse.error(res, "SQL query is required", 400);
        }

        // Log admin queries
        logger.info(`Admin query by user ${req.user.user_id}: ${sql}`);

        db.query(sql, (err, rows) => {
            if (err) {
                logger.error("Query execution failed:", err);
                return ApiResponse.error(res, err.message, 500);
            }

            return ApiResponse.success(res, { rows });
        });
    });
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exam-questions", examQuestionRoutes);
app.use("/api/student-exams", studentExamRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/student-exam", studentExamViewRoutes);
app.use("/api/student-answers", studentAnswerRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
    logger.info(`OES Server started in ${NODE_ENV} mode`);
    logger.info(`Server running on http://localhost:${PORT}`);
    console.log(`OES server running on http://localhost:${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
});

// Initialize Socket.io for real-time proctoring
const { initializeSocketService } = require('./services/socketService');
initializeSocketService(server);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        db.end((err) => {
            if (err) {
                logger.error('Error closing database connection:', err);
            } else {
                logger.info('Database connection closed');
            }
            process.exit(0);
        });
    });
});

module.exports = app;
