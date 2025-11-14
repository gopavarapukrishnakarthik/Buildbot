const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    assetType: {
      type: String,
      enum: ["Laptop", "Chair", "AC", "Printer", "Furniture", "Other"],
      required: true,
    },

    title: { type: String, required: true },

    description: { type: String },

    assignedTo: {
      type: String, // store employeeId here
      required: true,
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed"],
      default: "Open",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    cost: { type: Number, default: 0 },

    date: { type: Date, default: Date.now },

    // ✅ NEW FIELD
    dueDate: { type: Date, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Maintenance", MaintenanceSchema);
