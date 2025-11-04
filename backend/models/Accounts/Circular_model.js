const mongoose = require("mongoose");

const circularSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    content: String,
    effectiveDate: String,
    expiryDate: String,
    // ✅ Store department names or references
    departments: [String],

    // ✅ Reference employee documents
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    attachments: [String],
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Circular", circularSchema);
