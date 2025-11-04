const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const Circular = require("../../models/Accounts/Circular_model");
const Employee = require("../../models/Accounts/Employee_models");

// === File Upload Setup ===
const uploadDir = path.join(__dirname, "../../uploads"); // fixed path
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// === Save Draft ===
router.post("/", async (req, res) => {
  try {
    const circular = new Circular(req.body);
    await circular.save();
    res.json({ message: "Draft saved successfully", circular });
  } catch (err) {
    console.error("Save draft error:", err);
    res.status(500).json({ error: "Error saving draft" });
  }
});

// === Publish & Send Circular ===
router.post("/send", upload.array("attachments"), async (req, res) => {
  try {
    const {
      title,
      category,
      content,
      departments,
      employees,
      effectiveDate,
      expiryDate,
    } = req.body;

    const parsedDepartments = JSON.parse(departments || "[]");
    const parsedEmployees = JSON.parse(employees || "[]");
    const attachmentFiles = req.files.map((f) => f.filename);

    // 🔹 Get recipients
    let targetEmployees = [];
    if (parsedEmployees.length > 0) {
      targetEmployees = await Employee.find({ _id: { $in: parsedEmployees } });
    } else if (parsedDepartments.length > 0) {
      targetEmployees = await Employee.find({
        department: { $in: parsedDepartments },
      });
    } else {
      targetEmployees = await Employee.find(); // send to all
    }

    if (targetEmployees.length === 0) {
      return res.status(404).json({ error: "No matching employees found." });
    }

    // 🔹 Save to DB
    const circular = new Circular({
      title,
      category,
      content,
      departments: parsedDepartments,
      employees: parsedEmployees,
      effectiveDate,
      expiryDate,
      attachments: attachmentFiles,
      status: "Published",
    });
    await circular.save();

    // 🔹 Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    for (const emp of targetEmployees) {
      await transporter.sendMail({
        from: `"HR Department" <${process.env.USER_EMAIL}>`,
        to: emp.email,
        subject: `📢 ${title}`,
        html: `
          <p>Dear ${emp.firstName},</p>
          <p>${content}</p>
          <p><b>Effective From:</b> ${effectiveDate || "-"}<br/>
          ${expiryDate ? `<b>Expires:</b> ${expiryDate}` : ""}</p>
          <p>Regards,<br/>HR Department</p>
        `,
        attachments: attachmentFiles.map((file) => ({
          filename: file,
          path: path.join(uploadDir, file),
        })),
      });
    }

    res.json({ message: "Circular published & emails sent successfully" });
  } catch (err) {
    console.error("Send circular error:", err);
    res.status(500).json({ error: "Failed to send circular" });
  }
});

// === Fetch All Circulars ===
router.get("/", async (req, res) => {
  try {
    const data = await Circular.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching circulars" });
  }
});

// === Fetch Employees ===
router.get("/employees/list", async (req, res) => {
  try {
    const data = await Employee.find(
      {},
      "firstName lastName email department designation"
    );
    res.json(data);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Error fetching employees" });
  }
});

// === Fetch Departments dynamically from Employee model ===
router.get("/departments/list", async (req, res) => {
  try {
    const departments = await Employee.distinct("department");
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Error fetching departments" });
  }
});

// === Update Circular (Edit) ===
router.put("/:id", upload.array("attachments"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse JSON if sent as string
    if (updateData.departments) {
      updateData.departments = JSON.parse(updateData.departments);
    }
    if (updateData.employees) {
      updateData.employees = JSON.parse(updateData.employees);
    }

    if (req.files && req.files.length > 0) {
      const attachmentFiles = req.files.map((f) => f.filename);
      updateData.attachments = attachmentFiles;
    }

    const updatedCircular = await Circular.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCircular)
      return res.status(404).json({ message: "Circular not found" });

    res.json({ message: "Circular updated successfully", updatedCircular });
  } catch (err) {
    console.error("Update circular error:", err);
    res.status(500).json({ error: "Error updating circular" });
  }
});

// === Delete Circular ===
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Circular.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Circular not found" });

    res.json({ message: "Circular deleted successfully" });
  } catch (err) {
    console.error("Delete circular error:", err);
    res.status(500).json({ error: "Error deleting circular" });
  }
});

// === Fetch Single Circular === (⚠️ Keep last)
router.get("/:id", async (req, res) => {
  try {
    const data = await Circular.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching circular" });
  }
});

module.exports = router;
