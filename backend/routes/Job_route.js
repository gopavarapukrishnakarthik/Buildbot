const express = require("express");
const Job = require("../models/Job_model.js");
const { verifyToken, requireLead } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/createjob", async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/getJobs", async (req, res) => {
  const jobs = await Job.find().sort({ postedDate: -1 });
  res.json(jobs);
});

router.get("/getJob/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/getJobWithApplicants/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: "applications",
      populate: {
        path: "candidateId",
        select: "name email phone source resume",
      },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json({
      jobDetails: {
        _id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        status: job.status,
        postedDate: job.postedDate,
      },
      applicants: job.applications || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/updateJob/:id", verifyToken, requireLead, async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Update only provided fields
    Object.keys(req.body).forEach((key) => {
      job[key] = req.body[key];
    });

    await job.save();
    res.json({ message: "Job updated successfully", job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
