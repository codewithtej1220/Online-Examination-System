const express = require("express");
const router = express.Router();

const studentExamViewController =
require("../controllers/studentExamViewController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get(
    "/paper/:examId",
    verifyToken,
    studentExamViewController.getExamPaper
);

module.exports = router;
