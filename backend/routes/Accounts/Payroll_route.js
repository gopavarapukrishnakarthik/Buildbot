// routes/Accounts/payrollRoutes.js
const express = require("express");
const router = express.Router();
const Payroll = require("../../models/Accounts/Payroll_model");
const Employee = require("../../models/Accounts/Employee_models");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// ---------- Helpers ----------

// Filter out existing total keys so we do NOT double count
function calcTotals(earnings = {}, deductions = {}) {
  const cleanEarningsEntries = Object.entries(earnings).filter(
    ([k]) => k !== "totalEarnings"
  );
  const cleanDeductionsEntries = Object.entries(deductions).filter(
    ([k]) => k !== "totalDeductions"
  );

  const totalEarnings = cleanEarningsEntries.reduce(
    (a, [, b]) => a + Number(b || 0),
    0
  );
  const totalDeductions = cleanDeductionsEntries.reduce(
    (a, [, b]) => a + Number(b || 0),
    0
  );
  const netSalary = totalEarnings - totalDeductions;
  return { totalEarnings, totalDeductions, netSalary };
}

function drawLine(doc, y) {
  doc.moveTo(50, y).lineTo(550, y).stroke();
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
router.post("/create", async (req, res) => {
  try {
    const { employeeIds, payrollData } = req.body;

    // If employeeIds provided, populate first employee details
    let formatted = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length) {
      const employees = await Employee.find({
        _id: { $in: employeeIds },
      }).select("employeeId firstName lastName role joinDate email gender");
      formatted = employees.map((e) => ({
        employeeId: e.employeeId || "-", // ✅ HR Employee ID
        name: `${e.firstName} ${e.lastName}`, // ✅ Full Name
        role: e.role || "-",
        joinDate: e.joinDate || null,
        email: e.email || "-",
        gender: e.gender || "-",
      }));
    }

    // Calculate totals (ignores preexisting total fields in object)
    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      payrollData.earnings || {},
      payrollData.deductions || {}
    );

    const payload = {
      ...payrollData,
      employees: formatted.length ? formatted : payrollData.employees || [],
      // store totals explicitly once
      earnings: { ...(payrollData.earnings || {}), totalEarnings },
      deductions: { ...(payrollData.deductions || {}), totalDeductions },
      netSalary,
    };

    const created = await Payroll.create(payload);
    res.status(201).json({ success: true, payroll: created });
  } catch (e) {
    console.error("Create payroll error:", e);
    res.status(500).json({ success: false, message: "Create failed" });
  }
});

// Update payroll - recalc totals once and update document
router.put("/:id", async (req, res) => {
  try {
    const { payrollData } = req.body;
    // recalc totals (ignore preexisting total keys)
    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      payrollData.earnings || {},
      payrollData.deductions || {}
    );

    const payload = {
      ...payrollData,
      earnings: { ...(payrollData.earnings || {}), totalEarnings },
      deductions: { ...(payrollData.deductions || {}), totalDeductions },
      netSalary,
    };

    const updated = await Payroll.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    res.json({ success: true, payroll: updated });
  } catch (e) {
    console.error("Update payroll error:", e);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// Get all payrolls
// Get all payrolls (with recalculated totals)
router.get("/", async (req, res) => {
  try {
    const data = await Payroll.find().sort({ createdAt: -1 });

    // Map through each payroll and recalc totals
    const result = data.map((item) => {
      const { totalEarnings, totalDeductions, netSalary } = calcTotals(
        item.earnings || {},
        item.deductions || {}
      );

      return {
        ...item.toObject(),
        earnings: { ...(item.earnings || {}), totalEarnings },
        deductions: { ...(item.deductions || {}), totalDeductions },
        netSalary,
      };
    });

    res.json(result);
  } catch (e) {
    console.error("Fetch all payrolls error:", e);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// Get single payroll (with recalculated totals)
router.get("/:id", async (req, res) => {
  try {
    const data = await Payroll.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });

    const { totalEarnings, totalDeductions, netSalary } = calcTotals(
      data.earnings || {},
      data.deductions || {}
    );

    const response = {
      ...data.toObject(),
      earnings: { ...(data.earnings || {}), totalEarnings },
      deductions: { ...(data.deductions || {}), totalDeductions },
      netSalary,
    };

    res.json(response);
  } catch (e) {
    console.error("Fetch single payroll error:", e);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// ---------- Preview route (uses generatePDFFile) ----------
router.get("/preview/:id", async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).lean();
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    const tempDir = path.join(__dirname, "../../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `payslip_preview_${payroll._id}.pdf`);

    // generate and wait
    await generatePDFFile(payroll, filePath);

    res.setHeader("Content-Type", "application/pdf");
    // stream file
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    // optional: cleanup after streaming (commented out to keep previews if needed)
    readStream.on("end", () => {
      // fs.unlinkSync(filePath);
    });
  } catch (e) {
    console.error("Preview error:", e);
    res.status(500).json({ message: "Failed to generate payslip" });
  }
});

// ---------- Send Email (uses generatePDFFile) ----------
router.post("/send-email/:id", async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).lean();
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });

    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `payslip_mail_${payroll._id}.pdf`);

    await generatePDFFile(payroll, filePath);

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.USER_EMAIL, pass: process.env.USER_PASSWORD },
    });

    const emp = (payroll.employees && payroll.employees[0]) || {};
    await transport.sendMail({
      from: process.env.USER_EMAIL,
      to: emp.email || req.body.to || process.env.USER_EMAIL,
      subject: `Payslip for ${payroll.month}`,
      text: `Dear ${emp.name || "Employee"},\n\nPlease find attached your payslip for ${payroll.month}.\n\nRegards,\nHR Department`,
      attachments: [
        { filename: `Payslip_${payroll.month}.pdf`, path: filePath },
      ],
    });

    // cleanup file after sending
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Failed to delete temp file:", err.message);
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (e) {
    console.error("Send-email error:", e);
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
  } catch (e) {
    console.error("Delete payroll error:", e);
    res.status(500).json({ error: "Failed to delete payroll" });
  }
});

module.exports = router;
