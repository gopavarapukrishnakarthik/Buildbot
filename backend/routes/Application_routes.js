const express = require("express");
const multer = require("multer");
const Application = require("../models/Application_model.js");
const Candidate = require("../models/Candidate_model.js");
const Employee = require("../models/Accounts/Employee_models.js");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");
const nodemailer = require("nodemailer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ---------------- HELPER - Upload To Cloudinary ---------------- */
const uploadToCloudinary = (fileBuffer, folder = "attachments") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/* ---------------- MAIL SENDER ---------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

/* =====================================================================
 ✅ GET ALL APPLICATIONS (with Job, Candidate & Interviewer populated)
===================================================================== */
// routes/applications.js
router.get("/getApplications", async (req, res) => {
  try {
    const apps = await Application.find()
      .populate("jobId")
      .populate("candidateId")
      .populate("interview.interviewer", "firstName lastName email department")
      .lean();

    const formatted = apps.map((app) => {
      const latest =
        app.statusHistory?.length > 0
          ? app.statusHistory[app.statusHistory.length - 1]
          : { status: app.status, note: "", changedAt: app.appliedAt };

      return {
        ...app,
        latestStatus: latest.status,
        latestDate: latest.changedAt,
        interviewerDisplay: app.interview?.interviewer
          ? `${app.interview.interviewer.firstName} ${app.interview.interviewer.lastName}`
          : "-",
        interviewDate: app.interview?.interviewDate || null,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Must be placed BEFORE any "/:id/scheduleInterview" route
router.get("/:id", async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("candidateId")
      .populate("jobId")
      .populate("interview.interviewer", "firstName lastName email department");

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================================
 ✅ UPDATE SINGLE STATUS
===================================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ["Reviewed", "Interviewed", "Hired", "Rejected"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const application = await Application.findById(req.params.id).populate(
      "candidateId"
    );
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    application.status = status;
    application.statusHistory.push({ status, changedAt: new Date(), note });

    await application.save();

    res.json({ message: `Status updated to ${status}`, application });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================================
 ✅ UPLOAD ATTACHMENT
===================================================================== */
router.post(
  "/uploadAttachment/:applicationId",
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const app = await Application.findById(req.params.applicationId);
      if (!app) return res.status(404).json({ message: "Not found" });

      const link = await uploadToCloudinary(file.buffer);

      if (!app.attachments) app.attachments = [];
      app.attachments.push({
        name: file.originalname,
        link,
        uploadedAt: new Date(),
      });

      await app.save();
      res.json({ message: "Uploaded", attachments: app.attachments });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* =====================================================================
 ✅ SCHEDULE INTERVIEW (Auto email + CC interviewer)
===================================================================== */
router.post("/:id/scheduleInterview", async (req, res) => {
  const { id } = req.params;
  const { interviewer, interviewDate, meetLink, notes } = req.body;

  if (!interviewer || !interviewDate) {
    return res.status(400).json({ message: "Interviewer and date required" });
  }

  try {
    const app = await Application.findById(id)
      .populate("candidateId")
      .populate("jobId");

    if (!app) return res.status(404).json({ message: "Application not found" });

    // ✅ Load interviewer (Employee)
    const emp = await Employee.findById(interviewer);
    if (!emp) {
      return res.status(400).json({ message: "Invalid interviewer ID" });
    }

    /* ✅ Save interview */
    app.interview = {
      interviewer,
      interviewDate: new Date(interviewDate),
      meetLink,
      notes,
    };

    app.status = "Interviewed";
    await app.save();

    /* ✅ EMAIL CONTENT */
    /* ✅ EMAIL CONTENT — Adjusted for both Candidate + Interviewer CC */
    const emailBody = `
  <p>Hello ${app.candidateId.name},</p>

  <p>
    Your interview has been scheduled for the position of 
    <b>${app.jobId.title}</b>.
  </p>

  <table style="margin-top: 10px;">
    <tr>
      <td><b>Date & Time:</b></td>
      <td>${new Date(interviewDate).toLocaleString()}</td>
    </tr>
    <tr>
      <td><b>Interviewer:</b></td>
      <td>${emp.firstName} ${emp.lastName} (${emp.department})</td>
    </tr>
    <tr>
      <td><b>Meeting Link:</b></td>
      <td><a href="${meetLink}">${meetLink}</a></td>
    </tr>
  </table>

  <p style="margin-top: 15px;">Interview Notes (for internal use):</p>
  <p style="color: #555;"><i>${notes || "No additional notes provided."}</i></p>

  <hr style="margin: 20px 0;">

  <p style="font-size: 13px; color: #666;">
    <b>Note to Interviewer:</b><br>
    You have been assigned to conduct this interview. Please review the
    candidate's profile and be prepared for the scheduled discussion.
  </p>

  <p style="margin-top: 20px;">
    Regards,<br>
    <b>HR Team</b>
  </p>
`;

    /* ✅ SEND MAIL WITH CC TO INTERVIEWER */
    await transporter.sendMail({
      from: process.env.MAIL_EMAIL,
      to: app.candidateId.email, // candidate
      cc: emp.email, // interviewer receives CC
      subject: `Interview Scheduled – ${app.jobId.title}`,
      html: emailBody,
    });

    res.json({ message: "Interview scheduled + Email sent", application: app });
  } catch (err) {
    console.error("Interview scheduling error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
