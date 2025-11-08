const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // 🧍 Personal Info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    employeeId: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    avatar: { type: String, trim: true },
    joinDate: { type: Date, required: true },

    // Employee details
    panNo: { type: String, trim: true },
    UANNo: { type: String, trim: true },
    PFNo: { type: String, trim: true },

    // 💼 Job Details
    department: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    employeeType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    workMode: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid"],
      default: "Onsite",
    },
    salary: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Probation", "Away", "Active", "Inactive"],
      default: "Active",
    },

    // 🧑‍💼 Manager Relation
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // self-reference
      default: null,
    },

    // 📄 Documents & Onboarding
    documents: {
      offerLetter: { type: String, trim: true },
      idProof: { type: String, trim: true },
      nda: { type: String, trim: true },
    },
    onboardingTasks: {
      laptopAccess: { type: Boolean, default: false },
      hrOrientation: { type: Boolean, default: false },
      teamIntro: { type: Boolean, default: false },
    },

    // 🕵️ Review Info
    reviewedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

employeeSchema.virtual("reportees", {
  ref: "Employee",
  localField: "_id",
  foreignField: "manager",
});

employeeSchema.set("toJSON", { virtuals: true });
employeeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Employee", employeeSchema);
