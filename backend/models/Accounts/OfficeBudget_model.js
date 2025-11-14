const mongoose = require("mongoose");

const SpendItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true },
    category: { type: String, default: "General" }, // Snacks, Stationery, Utilities, etc.
    addedBy: { type: String, required: true }, // employeeId
    billUrl: String,
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OfficeBudgetSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // "November"
    year: { type: Number, required: true },
    allocatedAmount: { type: Number, required: true },
    spentAmount: { type: Number, default: 0 },
    managers: [{ type: String, required: true }], // array of employeeId
    items: [SpendItemSchema],
    notes: String,
  },
  { timestamps: true }
);

OfficeBudgetSchema.methods.recalcSpent = function () {
  this.spentAmount = (this.items || []).reduce(
    (a, i) => a + Number(i.amount || 0),
    0
  );
};

module.exports = mongoose.model("OfficeBudget", OfficeBudgetSchema);
