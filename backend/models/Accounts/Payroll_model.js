const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // Example: "November 2025"

    // Employees receiving this payroll
    employees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        name: String,
        role: String,
        joinDate: Date,
        email: String,
      },
    ],

    // Earnings
    earnings: {
      basicSalary: { type: Number, default: 0 },
      houseRentAllowance: { type: Number, default: 0 },
      dearnessAllowance: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
    },

    // Deductions
    deductions: {
      professionalTax: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      incomeTax: { type: Number, default: 0 },
      loanRecovery: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
    },

    // Attendance
    totalDays: { type: Number, default: 30 },
    paidDays: { type: Number, default: 0 },
    arrearDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },

    // Identifiers
    panNo: { type: String },
    uanNo: { type: String },
    pfNo: { type: String },

    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);
