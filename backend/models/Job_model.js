const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    employeeType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      required: true,
    },
    seniority: {
      type: String,
      enum: ["Entry", "Mid", "Senior", "Lead", "Manager"],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    onsitePolicy: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid"],
      default: "Onsite",
    },
    salaryRange: { type: String, trim: true },
    jobDescription: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    niceToHaveSkills: { type: [String], default: [] },
    targetStartDate: { type: String, trim: true }, // or Date if you want calendar date
    postedDate: { type: Date, default: Date.now },
    immediateJoiner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
