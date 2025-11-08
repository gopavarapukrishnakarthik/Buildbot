// routes/Accounts/payrollRoutes.js
const express = require("express");
const router = express.Router();
const Payroll = require("../../models/Accounts/Payroll_model");
const Employee = require("../../models/Accounts/Employee_models");
const Leave = require("../../models/Accounts/Leave_model.js");

const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// ---------- Helpers ----------

// Days in month from "November", 2025
function getDaysInMonth(month, year) {
  const d = new Date(`${month} 1, ${year}`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// ✅ Safe inclusive date-count (NO negative)
function countDays(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (e < s) return 0;

  const startUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const endUTC = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());

  return Math.max(0, (endUTC - startUTC) / (1000 * 60 * 60 * 24) + 1);
}

// ✅ Correct leave impact (LOP + HALF_DAY)
async function calculateLeaveImpact(hrEmployeeId, month, year) {
  const leaves = await Leave.find({ employeeId: hrEmployeeId, month, year });

  let lopDays = 0;

  for (const l of leaves) {
    const span = countDays(l.startDate, l.endDate);
    if (l.leaveType === "LOP") lopDays += span;
    if (l.leaveType === "HALF_DAY") lopDays += 0.5;
  }

  return lopDays;
}
// Filter out existing total keys so we do NOT double count
function calcTotals(earnings = {}, deductions = {}) {
  const cleanEarnings = Object.entries(earnings).filter(
    ([k]) => k !== "totalEarnings"
  );
  const cleanDeductions = Object.entries(deductions).filter(
    ([k]) => k !== "totalDeductions"
  );

  const totalEarnings = cleanEarnings.reduce(
    (a, [, b]) => a + Number(b || 0),
    0
  );
  const totalDeductions = cleanDeductions.reduce(
    (a, [, b]) => a + Number(b || 0),
    0
  );

  return {
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions,
  };
}

function drawLine(doc, y) {
  doc.moveTo(50, y).lineTo(550, y).stroke();
}

// ✅ Count days safely (no negative values)
function countDays(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);

  // ✅ Flip if start > end
  if (e < s) return 0;

  // ✅ Convert to UTC to avoid timezone shifting issues
  const startUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const endUTC = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());

  const diff = (endUTC - startUTC) / (1000 * 60 * 60 * 24) + 1;

  return Math.max(0, diff); // ✅ No negative values
}

// ✅ NEW calculateLeaveImpact (replace old function)
async function calculateLeaveImpact(hrEmployeeId, month, year) {
  const leaves = await Leave.find({ employeeId: hrEmployeeId, month, year });

  let lopDays = 0;

  for (const l of leaves) {
    const spanDays = countDays(l.startDate, l.endDate);

    if (l.leaveType === "LOP") lopDays += spanDays;

    if (l.leaveType === "HALF_DAY") lopDays += 0.5;

    // ✅ No LOP for PAID_LEAVE / CASUAL_LEAVE / SICK_LEAVE
  }

  return lopDays;
}

// Convert number to words (handles up to lakh/thousands reasonably)
function convertNumberToWords(num) {
  if (typeof num !== "number") num = Number(num) || 0;
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n) {
    n = Number(n);
    if (n < 20) return a[n];
    if (n < 100) return (b[Math.floor(n / 10)] + " " + a[n % 10]).trim();
    if (n < 1000)
      return (a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100)).trim();
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand " +
        inWords(n % 1000)
      ).trim();
    // larger numbers - fallback to the numeric string
    return n.toString();
  }

  // Capitalize first letters of each word
  return inWords(num)
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return "-";
  return Number(n).toLocaleString("en-IN");
}

// Generates the PDF file for a payroll and resolves when the file is written.
// Uses static logo at assets/logo.png if present.
function generatePDFFile(payroll, filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header - blue band with logo left (if exists), company name center
      const logoPath = path.join(__dirname, "../../assets/logo.png"); // adjust if needed
      // draw header background
      doc.rect(40, 40, 520, 60).fill("#2E74B5");
      // logo
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 45, 45, { width: 80, height: 50, align: "left" });
        } catch (err) {
          // ignore image errors
        }
      } else {
        // placeholder rectangle for logo
        doc
          .lineWidth(0.5)
          .rect(45, 45, 80, 50)
          .strokeColor("#000000")
          .stroke()
          .fillColor("#000000")
          .fontSize(10)
          .text("Company Logo", 48, 65, { width: 80, align: "center" });
      }

      // company name and address (center)
      doc
        .fillColor("white")
        .fontSize(16)
        .text("Company Name", 40, 52, { width: 520, align: "center" });
      doc.fontSize(9).text("Company Address Line 1, City - PIN", 40, 72, {
        width: 520,
        align: "center",
      });

      // Payslip title bar (grey)
      doc.fillColor("black"); // reset
      doc.rect(40, 105, 520, 24).fill("#e3e3e3").stroke().fillColor("black");
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Payslip For the Month of ${payroll.month || "-"}`, 45, 110, {
          width: 510,
          align: "center",
        });

      // Employee and Bank Details box - draw rectangle border
      let y = 140;
      doc.rect(40, y, 520, 110).stroke();
      const leftX = 48;
      const middleX = 240;
      const rightColX = 380;

      // left column labels
      const emp = (payroll.employees && payroll.employees[0]) || {};
      const safe = (v) => (v === undefined || v === null ? "-" : v);

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Employee ID:", leftX, y + 6);
      doc.text("Employee Name:", leftX, y + 24);
      doc.text("Department:", leftX, y + 42);
      doc.text("Designation:", leftX, y + 60);
      doc.text("Gender:", leftX, y + 78);

      doc.font("Helvetica");
      doc.text(safe(emp.employeeId || "-"), leftX + 110, y + 6);
      doc.text(safe(emp.name || "-"), leftX + 110, y + 24);
      doc.text(safe(payroll.department || "-"), leftX + 110, y + 42);
      doc.text(
        safe(emp.role || emp.designation || payroll.designation || "-"),
        leftX + 110,
        y + 60
      );
      doc.text(safe(emp.gender || payroll.gender || "-"), leftX + 110, y + 78);

      // middle/bank column
      doc.font("Helvetica-Bold");
      doc.text("Bank Name:", middleX, y + 6);
      doc.text("A/C #:", middleX, y + 24);
      doc.text("UAN #:", middleX, y + 42);
      doc.text("ESI #:", middleX, y + 60);
      doc.text("PAN #:", middleX, y + 78);

      doc.font("Helvetica");
      doc.text(safe(payroll.bankName || "-"), middleX + 80, y + 6);
      doc.text(
        safe(payroll.accountNo || payroll.accountNumber || "-"),
        middleX + 80,
        y + 24
      );
      doc.text(
        safe(payroll.uanNo || payroll.uanNumber || "-"),
        middleX + 80,
        y + 42
      );
      doc.text(
        safe(payroll.esiNo || payroll.esiNumber || "-"),
        middleX + 80,
        y + 60
      );
      doc.text(
        safe(payroll.panNo || payroll.panNumber || "-"),
        middleX + 80,
        y + 78
      );

      // right small column for days
      doc.font("Helvetica-Bold");
      doc.text("Paid Days:", rightColX, y + 6);
      doc.text("LOP Days:", rightColX, y + 30);
      doc.text("Days in Month:", rightColX, y + 54);

      doc.font("Helvetica");
      doc.text(safe(payroll.paidDays || "-"), rightColX + 90, y + 6);
      doc.text(safe(payroll.lopDays || 0), rightColX + 90, y + 30);
      doc.text(safe(payroll.totalDays || "-"), rightColX + 90, y + 54);

      // Earnings & Deductions table box
      y = y + 120;
      doc.rect(40, y, 520, 320).stroke();
      const boxTop = y + 8;

      // Headings inside earnings/deductions
      doc.font("Helvetica-Bold").fontSize(11);
      doc.text("Earnings", 50, boxTop);
      doc.text("Amount", 200, boxTop, { width: 80, align: "right" });
      doc.text("Deductions", 340, boxTop);
      doc.text("Amount", 500, boxTop, { width: 45, align: "right" });

      // draw a horizontal line below headings
      drawLine(doc, boxTop + 18);

      // Prepare arrays: filter out 'totalEarnings' / 'totalDeductions' keys
      const earningsObj = payroll.earnings || {};
      const deductionsObj = payroll.deductions || {};
      const eKeys = Object.keys(earningsObj).filter(
        (k) => k !== "totalEarnings"
      );
      const dKeys = Object.keys(deductionsObj).filter(
        (k) => k !== "totalDeductions"
      );
      const maxRows = Math.max(eKeys.length, dKeys.length);

      let rowY = boxTop + 26;
      doc.font("Helvetica").fontSize(10);
      for (let i = 0; i < maxRows; i++) {
        const eKey = eKeys[i] || "";
        const dKey = dKeys[i] || "";
        const eVal = eKey ? earningsObj[eKey] : "";
        const dVal = dKey ? deductionsObj[dKey] : "";

        // left earnings column
        if (eKey) doc.text(eKey, 50, rowY);
        if (eKey)
          doc.text(formatNumber(eVal), 200, rowY, {
            width: 80,
            align: "right",
          });

        // right deductions column
        if (dKey) doc.text(dKey, 340, rowY);
        if (dKey)
          doc.text(formatNumber(dVal), 500, rowY, {
            width: 40,
            align: "right",
          });

        rowY += 18;
      }

      // Other section spacing - allow a few empty lines if rows are small
      const totalsY = rowY + 6;
      drawLine(doc, totalsY - 6);

      // Compute totals ONCE (ignores any existing total fields)
      const { totalEarnings, totalDeductions, netSalary } = calcTotals(
        payroll.earnings || {},
        payroll.deductions || {}
      );

      doc.font("Helvetica-Bold");
      doc.text("Total Earnings", 50, totalsY);
      doc.text(formatNumber(totalEarnings), 200, totalsY, {
        width: 80,
        align: "right",
      });
      doc.text("Total Deductions", 340, totalsY);
      doc.text(formatNumber(totalDeductions), 500, totalsY, {
        width: 40,
        align: "right",
      });

      // Net Pay row
      const netY = totalsY + 28;
      doc.rect(40, netY - 8, 520, 38).stroke();
      doc.fontSize(12).fillColor("green").font("Helvetica-Bold");
      doc.text("Net Pay", 50, netY);
      doc.text(`Rs ${formatNumber(netSalary)}`, 200, netY, {
        width: 80,
        align: "right",
      });

      doc.fillColor("black").fontSize(10).font("Helvetica");
      doc.text(
        `In Words: ${convertNumberToWords(netSalary)} Only`,
        50,
        netY + 20
      );

      doc.moveDown(2);
      doc
        .fillColor("gray")
        .fontSize(9)
        .text(
          "This payslip is computer generated and doesn't require any signature",
          { align: "right" }
        );

      // End the PDF
      doc.end();

      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- Routes (create/update/list) ----------

// Create payroll - calculates totals once and stores them
// ✅ Create payroll — fully manual (NO auto leave calculation)
// ✅ CREATE PAYROLL — auto calculate paidDays from leave
router.post("/create", async (req, res) => {
  try {
    const { employeeIds, month, year, payrollData } = req.body;

    if (!employeeIds?.length)
      return res.status(400).json({ message: "No employees selected" });
    if (!month || !year)
      return res.status(400).json({ message: "Month and year are required" });

    // ✅ Fetch employees
    const employees = await Employee.find({ _id: { $in: employeeIds } }).select(
      "employeeId firstName lastName role joinDate email gender"
    );

    const employeesBlock = employees.map((e) => ({
      employeeId: e.employeeId || "-",
      name: `${e.firstName} ${e.lastName}`,
      role: e.role || "-",
      joinDate: e.joinDate,
      email: e.email || "-",
      gender: e.gender || "-",
    }));

    // ✅ Auto days in month
    const totalDays = getDaysInMonth(month, year);

    // ✅ Leave → LOP calculation
    const hrEmployeeId = employees[0]?.employeeId;
    const lopDays = hrEmployeeId
      ? await calculateLeaveImpact(hrEmployeeId, month, year)
      : 0;

    // ✅ Paid days
    const paidDays = totalDays - lopDays;

    // ✅ Salary totals (no proration)
    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      payrollData.earnings,
      payrollData.deductions
    );

    const payload = {
      month,
      year,
      employees: employeesBlock,
      totalDays,
      paidDays,
      lopDays,
      arrearDays: payrollData.arrearDays || 0,
      panNo: payrollData.panNo || "",
      uanNo: payrollData.uanNo || "",
      pfNo: payrollData.pfNo || "",
      earnings: { ...payrollData.earnings, totalEarnings },
      deductions: { ...payrollData.deductions, totalDeductions },
      netSalary,
    };

    const created = await Payroll.create(payload);
    res.status(201).json({ success: true, payroll: created });
  } catch (error) {
    console.error("❌ Payroll Create Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update payroll - recalc totals once and update document
// ✅ Update payroll — fully manual days logic
router.put("/:id", async (req, res) => {
  try {
    const { payrollData, month, year } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    const safe = (v, fallback) => {
      const n = Number(v);
      return isNaN(n) ? fallback : n;
    };

    const totalDays = safe(payrollData.totalDays, payroll.totalDays);
    const paidDays = safe(payrollData.paidDays, payroll.paidDays);
    let lopDays = safe(payrollData.lopDays, payroll.lopDays);
    if (lopDays < 0) lopDays = 0;

    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      payrollData.earnings,
      payrollData.deductions
    );

    payroll.month = month;
    payroll.year = year;
    payroll.totalDays = totalDays;
    payroll.paidDays = paidDays;
    payroll.lopDays = lopDays;
    payroll.earnings = { ...payrollData.earnings, totalEarnings };
    payroll.deductions = { ...payrollData.deductions, totalDeductions };
    payroll.netSalary = netSalary;

    const updated = await payroll.save();
    res.json({ success: true, payroll: updated });
  } catch (error) {
    console.error("❌ Payroll Update Error:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// Get all payrolls (with recalculated totals)
router.get("/", async (req, res) => {
  try {
    const data = await Payroll.find().sort({ createdAt: -1 });

    res.json(
      data.map((item) => {
        const { totalEarnings, totalDeductions, netSalary } = calcTotals(
          item.earnings,
          item.deductions
        );

        return {
          ...item.toObject(),
          earnings: { ...item.earnings, totalEarnings },
          deductions: { ...item.deductions, totalDeductions },
          netSalary,
        };
      })
    );
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// Get single payroll (with recalculated totals)
router.get("/:id", async (req, res) => {
  try {
    const data = await Payroll.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });

    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      data.earnings,
      data.deductions
    );

    res.json({
      ...data.toObject(),
      earnings: { ...data.earnings, totalEarnings },
      deductions: { ...data.deductions, totalDeductions },
      netSalary,
    });
  } catch (error) {
    console.error("Fetch single payroll error:", error);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// ---------- Preview route (uses generatePDFFile) ----------
router.get("/preview/:id", async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).lean();
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    const tempDir = path.join(__dirname, "../../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const filePath = path.join(tempDir, `payslip_preview_${payroll._id}.pdf`);
    await generatePDFFile(payroll, filePath);

    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ message: "Failed to generate payslip" });
  }
});

// ---------- Send Email (uses generatePDFFile) ----------
router.post("/send-email/:id", async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).lean();
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const filePath = path.join(tempDir, `payslip_mail_${payroll._id}.pdf`);
    await generatePDFFile(payroll, filePath);

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.USER_EMAIL, pass: process.env.USER_PASSWORD },
    });

    const emp = payroll.employees?.[0] || {};

    await transport.sendMail({
      from: process.env.USER_EMAIL,
      to: emp.email || process.env.USER_EMAIL,
      subject: `Payslip for ${payroll.month}`,
      text: `Dear ${emp.name},\n\nPlease find attached your payslip for ${payroll.month}.\n\nRegards,\nHR Department`,
      attachments: [
        { filename: `Payslip_${payroll.month}.pdf`, path: filePath },
      ],
    });

    fs.unlink(filePath, () => {});
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Send-email error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// 🗑️ Delete Payroll
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Payroll.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Payroll record not found" });

    res.json({ message: "Payroll deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete payroll" });
  }
});

module.exports = router;
