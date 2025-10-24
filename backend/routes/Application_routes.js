const express = require("express");
const multer = require("multer");
const Application = require("../models/Application_model.js");
const Candidate = require("../models/Candidate_model.js");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = "attachments") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// 🟢 Get all applications
router.get("/getApplications", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("candidateId")
      .lean();

    // Attach latest status and note for convenience
    const formatted = applications.map((app) => {
      const latest =
        app.statusHistory?.length > 0
          ? app.statusHistory[app.statusHistory.length - 1]
          : { status: app.status, note: "", changedAt: app.appliedAt };

      return {
        ...app,
        latestStatus: latest.status,
        latestNote: latest.note,
        latestDate: latest.changedAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🟡 Update single status
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

    // Update current status + append history
    application.status = status;
    application.statusHistory.push({ status, changedAt: new Date(), note });
    await application.save();

    const latest =
      application.statusHistory[application.statusHistory.length - 1] || {};

    res.json({
      message: `Application status updated to ${status}`,
      application: {
        ...application.toObject(),
        latestStatus: latest.status,
        latestNote: latest.note,
        latestDate: latest.changedAt,
      },
    });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🟠 Bulk status update
router.patch("/bulk-status", async (req, res) => {
  try {
    const { applicationIds, status, note } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      !applicationIds.length
    )
      return res
        .status(400)
        .json({ message: "applicationIds array is required" });

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
    }

    res.json({
      message: `Updated ${applications.length} applications to ${status}`,
      updatedCount: applications.length,
    });
  } catch (err) {
    console.error("Error in bulk status update:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🔵 Upload attachment to an application
router.post(
  "/uploadAttachment/:applicationId",
  upload.single("file"),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const application = await Application.findById(applicationId);
      if (!application)
        return res.status(404).json({ message: "Application not found" });

      const fileLink = await uploadToCloudinary(file.buffer);

      if (!application.attachments) application.attachments = [];
      application.attachments.push({
        name: file.originalname,
        link: fileLink,
        uploadedAt: new Date(),
      });

      await application.save();
      res.status(201).json({
        message: "File uploaded successfully",
        attachments: application.attachments,
      });
    } catch (err) {
      console.error("Error uploading attachment:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

const nodemailer = require("nodemailer");

router.post("/:id/scheduleInterview", async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewer, interviewDate, meetLink, notes } = req.body;

    const app = await Application.findById(id).populate("candidateId jobId");
    if (!app) return res.status(404).json({ message: "Application not found" });

    // Update interview info
    app.interview = {
      interviewer,
      interviewDate,
      meetLink,
      notes,
      emailSent: false,
    };

    // Update status to Interviewed
    app.status = "Interviewed";
    app.statusHistory.push({
      status: "Interviewed",
      changedAt: new Date(),
      note: "Interview scheduled",
    });

    await app.save();

    // Send email to candidate
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"HR Team" <${process.env.EMAIL_USER}>`,
      to: app.candidateId.email,
      subject: `Interview Scheduled for ${app.jobId.title}`,
      html: `
        <p>Dear ${app.candidateId.name},</p>
        <p>Your interview for the position <b>${app.jobId.title}</b> has been scheduled.</p>
        <ul>
          <li><b>Date:</b> ${new Date(interviewDate).toLocaleString()}</li>
          <li><b>Interviewer:</b> ${interviewer}</li>
          <li><b>Meeting Link:</b> <a href="${meetLink}">${meetLink}</a></li>
        </ul>
        <p>${notes || ""}</p>
        <p>Best Regards,<br/>Recruitment Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    app.interview.emailSent = true;
    await app.save();

    res.json({
      message: "Interview scheduled and email sent successfully",
      application: app,
    });
  } catch (err) {
    console.error("Error scheduling interview:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
