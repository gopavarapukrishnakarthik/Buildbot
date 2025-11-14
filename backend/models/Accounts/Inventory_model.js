const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    assetType: { type: String, required: true }, // Laptop, AC, Chair, etc.
    name: { type: String, required: true }, // Model/Item Name
    serialNumber: String,
    quantity: { type: Number, default: 1 },
    assignedTo: { type: String, default: "" }, // employeeId
    condition: { type: String, default: "Good" }, // Good | Repair | Broken
    purchaseDate: Date,
    warrantyExpiry: Date,
    addedBy: { type: String, required: true }, // employeeId
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", InventorySchema);
