const express = require("express");
const Candidate = require("../models/Candidate_model.js");
const Application = require("../models/Application_model.js");

const router = express.Router();

/**
 * Apply (external form submission)
 * Creates candidate if not exists and application
 */
router.post("/apply", async (req, res) => {
  try {
    const { name, email, phone, resume, jobId } = req.body;

    if (!name || !email || !jobId) {
      return res
        .status(400)
        .json({ message: "Name, email, and jobId are required" });
    }

    let candidate = await Candidate.findOne({ email });
    if (!candidate) {
      candidate = new Candidate({
        name,
        email,
        phone,
        resume,
        source: "external",
      });
      await candidate.save();
    }

    const existingApplication = await Application.findOne({
      jobId,
      candidateId: candidate._id,
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "Candidate has already applied for this job" });
    }

    const application = new Application({
      jobId,
      candidateId: candidate._id,
      status: "Pending",
      statusHistory: [
        {
          status: "Pending",
          changedAt: new Date(),
          note: "Application submitted",
        },
      ],
    });
    await application.save();

    res.status(201).json({ candidate, application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Manual candidate creation
 */
router.post("/createCandidate", async (req, res) => {
  try {
    const { name, email, phone, resume } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });

    let candidate = await Candidate.findOne({ email });
    if (candidate)
      return res.status(400).json({ message: "Candidate already exists" });

    candidate = new Candidate({ name, email, phone, resume, source: "manual" });
    await candidate.save();

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all candidates
router.get("/getCandidates", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/updateCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, resume, notes, source } = req.body;

    // Find candidate by ID
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Update fields if provided
    if (name) candidate.name = name;
    if (email) candidate.email = email;
    if (phone) candidate.phone = phone;
    if (resume) candidate.resume = resume;
    if (notes) candidate.notes = notes;
    if (source) candidate.source = source;

    await candidate.save();

    res.json({ message: "Candidate updated successfully", candidate });
  } catch (err) {
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
