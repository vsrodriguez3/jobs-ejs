const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  getJobForm,
  createJob,
  getEditForm,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

router.route("/").get(getAllJobs).post(createJob);

router.route("/new").get(getJobForm); // Display form to create a new job

router.route("/edit/:id").get(getEditForm); // Get form for editing a job

router.route("/update/:id").post(updateJob); // Handle job update (POST request)

router.route("/delete/:id").post(deleteJob); // Handle job deletion (POST request)

module.exports = router;
