const express = require("express");
const Application = require("../models/Application_model.js");
const Candidate = require("../models/Candidate_model.js");
// const sendEmail = require("../utils/sendEmail"); // optional email function

const router = express.Router();

// Get all applications with candidate & job details
router.get("/getApplications", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("candidateId");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Update single application status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["Reviewed", "Interviewed", "Hired", "Rejected"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const application = await Application.findById(id).populate("candidateId");
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    application.status = status;
    application.statusHistory.push({ status, changedAt: new Date(), note });
    await application.save();

    // Optional: send email
    // await sendEmail(application.candidateId.email, `Your application status is now ${status}`, `Note: ${note || ""}`);

    res.json({
      message: `Application status updated to ${status}`,
      application,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Bulk update application statuses
 */
router.patch("/bulk-status", async (req, res) => {
  try {
    const { applicationIds, status, note } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "applicationIds array is required" });
    }

    const validStatuses = ["Reviewed", "Interviewed", "Hired", "Rejected"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const applications = await Application.find({
      _id: { $in: applicationIds },
    }).populate("candidateId");

    for (let app of applications) {
      app.status = status;
      app.statusHistory.push({ status, changedAt: new Date(), note });
      await app.save();

      // Optional: send email
      // await sendEmail(app.candidateId.email, `Your application status is now ${status}`, `Note: ${note || ""}`);
    }

    res.json({
      message: `Updated ${applications.length} applications to ${status}`,
      applications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
