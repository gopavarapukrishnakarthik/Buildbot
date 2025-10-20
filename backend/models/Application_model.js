const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Interviewed", "Hired", "Rejected"],
      default: "Pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Pending", "Reviewed", "Interviewed", "Hired", "Rejected"],
        },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    appliedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

// Initial Pending event
applicationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: "Pending",
      changedAt: new Date(),
      note: "Application submitted",
    });
  }
  next();
});

// Virtual for frontend event timeline
applicationSchema.virtual("events").get(function () {
  const allEvents = [
    { status: "Pending", label: "Application Submitted" },
    { status: "Reviewed", label: "Profile Reviewed" },
    { status: "Interviewed", label: "Interview Scheduled" },
    { status: "Hired", label: "Offer Accepted" },
    { status: "Rejected", label: "Application Rejected" },
  ];

  return allEvents.map((event) => {
    const history = this.statusHistory.find((h) => h.status === event.status);
    return {
      status: event.status,
      label: event.label,
      date: history ? history.changedAt : null,
    };
  });
});

applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Application", applicationSchema);
