const mongoose = require("mongoose");

const ProcurementSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    category: { type: String, default: "Consumable" }, // Consumable | Device | Furniture | Service
    quantity: { type: Number, default: 1 },
    cost: { type: Number, required: true },
    supplier: String,
    date: { type: Date, default: Date.now },
    addedBy: { type: String, required: true }, // employeeId
    billUrl: String,
    status: { type: String, default: "Ordered" }, // Ordered | Delivered | Cancelled
    inventoryAdded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Procurement", ProcurementSchema);
