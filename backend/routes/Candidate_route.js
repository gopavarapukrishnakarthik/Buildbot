const express = require("express");
const multer = require("multer");
const Candidate = require("../models/Candidate_model.js");
const Application = require("../models/Application_model.js");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");
const nodemailer = require("nodemailer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // store file in memory

// -------------------- Constants --------------------

// Nodemailer transporter
const EMAIL_TRANSPORTER = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

// Function to send status email
const sendStatusEmail = async (email, name, status) => {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: "Application Status Update",
    html: `<p>Dear ${name},</p>
           <p>Your application status has been updated to: <strong>${status}</strong>.</p>
           <p>Thank you,</p>
           <p>The Recruitment Team</p>`,
  };

  await EMAIL_TRANSPORTER.sendMail(mailOptions);
};

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = "resumes") => {
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

// -------------------- Routes --------------------

// Apply route
router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { name, email, phone, jobId } = req.body;
    const file = req.file;

    if (!name || !email || !jobId) {
      return res
        .status(400)
        .json({ message: "Name, email, and jobId are required" });
    }

    let candidate = await Candidate.findOne({ email });
    let resumeLink = "";

    if (file) resumeLink = await uploadToCloudinary(file.buffer);

    if (!candidate) {
      candidate = new Candidate({
        name,
        email,
        phone,
        resume: resumeLink,
        source: "Portal",
      });
      await candidate.save();
    } else if (resumeLink) {
      candidate.resume = resumeLink;
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

router.get("/getCandidates", async (req, res) => {
  try {
    // Get all candidates
    const candidates = await Candidate.find();

    // For each candidate, fetch their applications with job titles
    const candidatesWithApplications = await Promise.all(
      candidates.map(async (candidate) => {
        const applications = await Application.find({
          candidateId: candidate._id,
        })
          .populate("jobId", "title") // get only the job title
          .lean();

        // Map applications to include only relevant info
        const formattedApps = applications.map((app) => ({
          applicationId: app._id,
          jobId: app.jobId._id,
          jobTitle: app.jobId.title,
          status: app.status,
        }));

        return {
          ...candidate.toObject(),
          applications: formattedApps,
        };
      })
    );

    res.json(candidatesWithApplications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single candidate by ID with applications
router.get("/getCandidates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find candidate by ID
    const candidate = await Candidate.findById(id).lean();
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Fetch all applications for this candidate
    const applications = await Application.find({ candidateId: id })
      .populate("jobId", "title") // get only job title
      .lean();

    // Format applications to include latest status, note, and appliedAt
    const formattedApps = applications.map((app) => {
      const latest =
        app.statusHistory?.length > 0
          ? app.statusHistory[app.statusHistory.length - 1]
          : {
              status: app.status || "Pending",
              note: app.comment || "",
              changedAt: app.createdAt,
            };

      return {
        applicationId: app._id,
        jobId: app.jobId?._id,
        jobTitle: app.jobId?.title || "Unknown Job",
        status: app.status,
        latestStatus: latest.status,
        latestStatusNote: latest.note,
        latestStatusDate: latest.changedAt,
        appliedAt: app.createdAt,
        resume: candidate.resume || "",
      };
    });

    res.json({
      ...candidate,
      applications: formattedApps,
    });
  } catch (err) {
    console.error("Error fetching candidate by ID:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update candidate
router.put(
  "/updateCandidate/:id",
  upload.single("resume"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, notes, score, active, source } = req.body;
      const file = req.file;

      const candidate = await Candidate.findById(id);
      if (!candidate)
        return res.status(404).json({ message: "Candidate not found" });

      if (name) candidate.name = name;
      if (email) candidate.email = email;
      if (phone) candidate.phone = phone;
      if (notes) candidate.notes = notes;
      if (source) candidate.source = source;

      // ✅ Validate score (0–10)
      if (score !== undefined) {
        const numScore = Number(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 10) {
          return res
            .status(400)
            .json({ message: "Score must be a number between 0 and 10" });
        }
        candidate.score = numScore;
      }

      // ✅ Handle active toggle (true/false)
      if (active !== undefined) {
        candidate.active = active === "true" || active === true ? true : false;
      }

      // ✅ Upload resume if file provided
      if (file) candidate.resume = await uploadToCloudinary(file.buffer);

      await candidate.save();

      res.json({
        message: "Candidate updated successfully",
        candidate,
      });
    } catch (err) {
      if (err.code === 11000)
        return res.status(400).json({ message: "Email already exists" });
      res.status(500).json({ message: err.message });
    }
  }
);

router.get("/getCandidatesWithApplications", async (req, res) => {
  try {
    const candidates = await Candidate.find().lean();

    const candidatesWithApps = await Promise.all(
      candidates.map(async (cand) => {
        const applications = await Application.find({ candidateId: cand._id })
          .populate("jobId", "title") // only get job title
          .lean();

        return {
          ...cand,
          applications: applications.map((app) => ({
            jobTitle: app.jobId?.title || "Unknown Job",
            status: app.status,
            score: app.score || Math.floor(Math.random() * 21) + 70, // optional demo score
          })),
        };
      })
    );

    res.json(candidatesWithApps);
  } catch (err) {
    console.error("Error fetching candidates with applications:", err);
    res.status(500).json({ message: err.message });
  }
});

// Send application status email
router.post("/sendStatusEmail", async (req, res) => {
  try {
    const { email, name, status } = req.body;
    if (!email || !name || !status) {
      return res
        .status(400)
        .json({ message: "Email, name, and status are required" });
    }

    await sendStatusEmail(email, name, status);

    res.status(200).json({ message: "Status email sent successfully" });
  } catch (err) {
    console.error("Error sending status email:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;
