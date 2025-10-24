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
    interview: {
      interviewer: String,
      interviewDate: Date,
      meetLink: String,
      notes: String,
      emailSent: { type: Boolean, default: false },
    },
    appliedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

// Add initial pending event on new document creation
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

// Simplified virtual field (without labels)
applicationSchema.virtual("events").get(function () {
  return this.statusHistory.map((h) => ({
    status: h.status,
    date: h.changedAt,
  }));
});

applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Application", applicationSchema);
