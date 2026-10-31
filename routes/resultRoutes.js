const express = require("express");
const router = express.Router();

const resultController =
require("../controllers/resultController");
const { verifyToken, requireRole, requireSelfOrRole } = require("../middleware/authMiddleware");

router.use(verifyToken);


// create result
router.post(
    "/create",
    requireRole("faculty", "admin"),
    resultController.createResult
);


// get all results
router.get(
    "/all",
    requireRole("faculty", "admin"),
    resultController.getResults
);


// get student results
router.get(
    "/student/:student_user_id",
    requireSelfOrRole("student_user_id", "faculty", "admin"),
    resultController.getStudentResults
);


// publish result
router.put(
    "/publish",
    requireRole("faculty", "admin"),
    resultController.publishResult
);

module.exports = router;
