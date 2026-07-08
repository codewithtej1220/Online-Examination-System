const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
    const { username, password, role, current_semester, major_program, department, email } = req.body;

    // Check if user already exists
    const checkSql = "SELECT user_id FROM users WHERE username = ?";
    db.query(checkSql, [username], async (err, results) => {
        if (err) {
            logger.error("Database error during registration:", err);
            throw new Error("Database error");
        }

        if (results.length > 0) {
            return ApiResponse.error(res, "Username already exists", 409);
        }

        // Hash password with salt rounds from env or default to 12
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`;

        db.query(sql, [username, hashedPassword, role], (err, result) => {
            if (err) {
                logger.error("Error creating user:", err);
                return ApiResponse.error(res, "Failed to create user", 500);
            }

            const userId = result.insertId;
            let roleSql;
            let roleParams;

            // Insert role-specific data
            if (role === "faculty") {
                roleSql = "INSERT INTO faculty (user_id, department) VALUES (?, ?)";
                roleParams = [userId, department || "General"];
            } else if (role === "student") {
                roleSql = "INSERT INTO student (user_id, current_semester, major_program) VALUES (?, ?, ?)";
                roleParams = [userId, current_semester || null, major_program || null];
            } else if (role === "admin") {
                roleSql = "INSERT INTO admin (user_id, email) VALUES (?, ?)";
                roleParams = [userId, email || `${username}@admin.oes.com`];
            }

            db.query(roleSql, roleParams, (roleErr) => {
                if (roleErr) {
                    logger.error("Error creating role-specific data:", roleErr);
                    // Rollback user creation
                    db.query("DELETE FROM users WHERE user_id = ?", [userId]);
                    return ApiResponse.error(res, "Failed to complete registration", 500);
                }

                logger.info(`New user registered: ${username} (${role})`);

                return ApiResponse.success(
                    res,
                    {
                        user_id: userId,
                        username,
                        role
                    },
                    "User registered successfully",
                    201
                );
            });
        });
    });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) {
            logger.error("Database error during login:", err);
            return ApiResponse.error(res, "Database error", 500);
        }

        if (results.length === 0) {
            logger.warn(`Login attempt for non-existent user: ${username}`);
            return ApiResponse.error(res, "Invalid username or password", 401);
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            logger.warn(`Failed login attempt for user: ${username}`);
            return ApiResponse.error(res, "Invalid username or password", 401);
        }

        // Generate JWT with expiration
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
        );

        logger.info(`User logged in: ${username} (${user.role})`);

        return ApiResponse.success(
            res,
            {
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    role: user.role
                }
            },
            "Login successful"
        );
    });
});

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
exports.getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.role;

    let sql = `
        SELECT u.user_id, u.username, u.role, u.created_at
        FROM users u
        WHERE u.user_id = ?
    `;

    // Add role-specific data
    if (role === 'student') {
        sql = `
            SELECT u.user_id, u.username, u.role, u.created_at,
                   s.current_semester, s.major_program
            FROM users u
            LEFT JOIN student s ON u.user_id = s.user_id
            WHERE u.user_id = ?
        `;
    } else if (role === 'faculty') {
        sql = `
            SELECT u.user_id, u.username, u.role, u.created_at,
                   f.department
            FROM users u
            LEFT JOIN faculty f ON u.user_id = f.user_id
            WHERE u.user_id = ?
        `;
    } else if (role === 'admin') {
        sql = `
            SELECT u.user_id, u.username, u.role, u.created_at,
                   a.email
            FROM users u
            LEFT JOIN admin a ON u.user_id = a.user_id
            WHERE u.user_id = ?
        `;
    }

    db.query(sql, [userId], (err, results) => {
        if (err) {
            logger.error("Error fetching profile:", err);
            return ApiResponse.error(res, "Failed to fetch profile", 500);
        }

        if (results.length === 0) {
            return ApiResponse.notFound(res, "User not found");
        }

        return ApiResponse.success(res, { user: results[0] }, "Profile fetched successfully");
    });
});
