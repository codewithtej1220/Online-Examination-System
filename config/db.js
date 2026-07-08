const mysql = require("mysql2");
const logger = require("../utils/logger");
require("dotenv").config();

const dbConfig = process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: process.env.DB_SSL === "true"
            ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
            : undefined
    };

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Get promise-based pool
const promisePool = pool.promise();

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        logger.error("DB Connection Failed:", err.message);
        console.log("DB Connection Failed:", err.message);
    } else {
        logger.info("MySQL Connected Successfully");
        console.log("MySQL Connected Successfully");
        connection.release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
    logger.error('MySQL pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        logger.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        logger.error('Database connection was refused.');
    }
});

// Export both callback and promise versions
module.exports = pool;
module.exports.promise = promisePool;
