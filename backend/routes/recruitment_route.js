// routes/recruitment.js
const express = require("express");
const router = express.Router();
const Application = require("../models/Application_model");

// Helpers
const toDate = (v) => (v ? new Date(v) : null);

// GET /recruitment/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns interview events in the range
router.get("/calendar", async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = {
      "interview.interviewDate": {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      },
    };

    const apps = await Application.find(q)
      .populate("candidateId", "name email")
      .populate("jobId", "title")
      .populate("interview.interviewer", "firstName lastName email")
      .lean();

    const events = apps.map((a) => ({
      id: String(a._id),
      title: `${a.candidateId?.name || "Candidate"} — ${a.jobId?.title || ""}`,
      start: a.interview?.interviewDate,
      extendedProps: {
        candidate: a.candidateId,
        job: a.jobId,
        interviewer: a.interview?.interviewer,
        meetLink: a.interview?.meetLink || "",
        status: a.status,
      },
    }));

    res.json({ events });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load calendar" });
  }
});

// GET /recruitment/upcoming?days=7
router.get("/upcoming", async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    const apps = await Application.find({
      "interview.interviewDate": { $gte: now, $lte: end },
    })
      .sort({ "interview.interviewDate": 1 })
      .populate("candidateId", "name email phone")
      .populate("jobId", "title")
      .populate("interview.interviewer", "firstName lastName email")
      .lean();

    res.json({ data: apps });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load upcoming" });
  }
});

// GET /recruitment/metrics
router.get("/metrics", async (_req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay(); // 0..6
    const diff = (day + 6) % 7; // Monday as start
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [totalScheduled, today, thisWeek] = await Promise.all([
      Application.countDocuments({ "interview.interviewDate": { $ne: null } }),
      Application.countDocuments({
        "interview.interviewDate": { $gte: startOfDay, $lte: endOfDay },
      }),
      Application.countDocuments({
        "interview.interviewDate": { $gte: startOfWeek, $lte: endOfWeek },
      }),
    ]);

    res.json({ totalScheduled, today, thisWeek });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load metrics" });
  }
});

// PATCH /recruitment/interviews/:id  (reschedule or cancel)
// body: { interviewDate?: ISOString, meetLink?: string, notes?: string, cancel?: boolean }
router.patch("/interviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewDate, meetLink, notes, cancel } = req.body;

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (cancel) {
      app.interview = undefined;
      // keep status history but do not force status change
    } else {
      app.interview = {
        ...(app.interview || {}),
        interviewDate: interviewDate
          ? new Date(interviewDate)
          : app.interview?.interviewDate,
        meetLink: meetLink ?? app.interview?.meetLink ?? "",
        notes: notes ?? app.interview?.notes ?? "",
      };
    }

    await app.save();
    res.json({ success: true, application: app });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update interview" });
  }
});

module.exports = router;
