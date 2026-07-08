const express = require("express");
const router = express.Router();

const resultController =
require("../controllers/resultController");


// create result
router.post(
    "/create",
    resultController.createResult
);


// get all results
router.get(
    "/all",
    resultController.getResults
);


// get student results
router.get(
    "/student/:student_user_id",
    resultController.getStudentResults
);


// publish result
router.put(
    "/publish",
    resultController.publishResult
);

module.exports = router;