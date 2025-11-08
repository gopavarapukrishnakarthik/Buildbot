const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    employeeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["PAID_LEAVE", "CASUAL_LEAVE", "SICK_LEAVE", "HALF_DAY", "LOP"],
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    month: { type: String, required: true },
    year: { type: Number, required: true },

    reason: String,
    approvedBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
