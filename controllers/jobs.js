const Job = require("../models/Job");
const parseValidationErrors = require("../utils/parseValidationErrors");

// Get all jobs for the logged-in user
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id });
    res.render("jobs", { jobs });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load jobs.");
    res.redirect("/");
  }
};

// Display the form to create a new job
const getJobForm = (req, res) => {
  try {
    res.render("job", { job: null });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load job creation form.");
    res.redirect("/jobs");
  }
};

// Create a new job
const createJob = async (req, res) => {
  try {
    console.log("received csrf token:", req.body._csrf); //added this to test
    console.log(req.user); //added this to test
    console.log(req.body); //added this to test
    const job = new Job({ ...req.body, createdBy: req.user._id });
    await job.save();
    console.log("Job created:", job); //added this to test
    req.flash("info", "Job created successfully.");
    res.redirect("/jobs");
  } catch (e) {
    console.error("Error creating job:", e); // added this to test
    if (e.name === "ValidationError") {
      parseValidationErrors(e, req);
    } else {
      console.error(e);
      req.flash("error", "Failed to create job.");
    }
    res.redirect("/jobs/new");
  }
};

// Display the form to edit an existing job
const getEditForm = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }
    res.render("job", { job });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load edit form.");
    res.redirect("/jobs");
  }
};

// Update an existing job
const updateJob = async (req, res) => {
  try {
    await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body
    );
    req.flash("info", "Job updated successfully.");
    res.redirect("/jobs");
  } catch (e) {
    if (e.name === "ValidationError") {
      parseValidationErrors(e, req);
    } else {
      console.error(e);
      req.flash("error", "Failed to update job.");
    }
    res.redirect(`/jobs/edit/${req.params.id}`);
  }
};

// Delete a job
const deleteJob = async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    req.flash("info", "Job deleted successfully.");
    res.redirect("/jobs");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to delete job.");
    res.redirect("/jobs");
  }
};

module.exports = {
  getAllJobs,
  getJobForm,
  createJob,
  getEditForm,
  updateJob,
  deleteJob,
};
