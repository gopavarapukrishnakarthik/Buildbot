const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, trim: true },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    resume: { type: String }, // URL or filename
    source: {
      type: String,
      enum: ["Reference", "Portal", "Indeed", "Naukri", "LinkedIn", "Other"],
      default: "Portal",
    },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Virtual field: link candidate → all their applications
candidateSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "candidateId",
});

candidateSchema.set("toJSON", { virtuals: true });
candidateSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Candidate", candidateSchema);
