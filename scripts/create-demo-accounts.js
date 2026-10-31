/**
 * Creates (or resets) one demo account per role for local testing.
 * Usage: node scripts/create-demo-accounts.js
 * Password matches scripts/seed.js.
 */
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
require("dotenv").config();

const password = "Password@123";

const accounts = [
    { username: "demo_admin", role: "admin", roleSql: "INSERT IGNORE INTO admin (user_id, email) VALUES (?, 'demo_admin@oes.local')" },
    { username: "demo_faculty", role: "faculty", roleSql: "INSERT IGNORE INTO faculty (user_id, department) VALUES (?, 'Computer Science')" },
    { username: "demo_student", role: "student", roleSql: "INSERT IGNORE INTO student (user_id, current_semester, major_program) VALUES (?, 5, 'B.Tech CSE')" }
];

(async () => {
    const connection = await mysql.createConnection(process.env.DATABASE_URL || {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "online_exam_system"
    });

    const hash = await bcrypt.hash(password, 10);

    for (const account of accounts) {
        await connection.query(
            `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            [account.username, hash, account.role]
        );
        const [[user]] = await connection.query("SELECT user_id FROM users WHERE username = ?", [account.username]);
        await connection.query(account.roleSql, [user.user_id]);
        console.log(`${account.role.padEnd(8)} ${account.username} (id ${user.user_id})`);
    }

    console.log(`\nAll demo accounts use the password from scripts/seed.js`);
    await connection.end();
})().catch((error) => {
    console.error("Failed to create demo accounts:", error.message);
    process.exit(1);
});
