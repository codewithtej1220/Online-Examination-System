const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const { validateRegistration, validateLogin } = require("../middleware/validator");

// TEST ROUTE
router.get("/test", (req, res) => {
    res.json({ message: "Auth route working", timestamp: new Date().toISOString() });
});

// REGISTER - with validation and rate limiting
router.post("/register", registerLimiter, validateRegistration, authController.register);

// LOGIN - with validation and rate limiting
router.post("/login", authLimiter, validateLogin, authController.login);

// PROTECTED ROUTE - get user profile
router.get("/profile", verifyToken, authController.getProfile);

// REFRESH TOKEN (future implementation)
// router.post("/refresh", authController.refreshToken);

// LOGOUT (optional - mainly client-side token removal)
router.post("/logout", verifyToken, (req, res) => {
    res.json({
        success: true,
        message: "Logged out successfully"
    });
});

module.exports = router;