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
