const express = require("express");
const router = express.Router();
const Maintenance = require("../../models/Accounts/Maintenance_model");
const Employee = require("../../models/Accounts/Employee_models");

// ✅ CREATE
router.post("/create", async (req, res) => {
  try {
    const maintenance = await Maintenance.create({
      assetType: req.body.assetType,
      title: req.body.title,
      category: req.body.category,
      assignedTo: req.body.assignedTo,
      dueDate: req.body.dueDate,
      description: req.body.description,
      status: req.body.status || "Pending",
    });

    res.status(201).json(maintenance);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ message: "Failed to create item" });
  }
});

// ✅ LIST ALL
router.get("/", async (req, res) => {
  try {
    const data = await Maintenance.find()
      .populate("assignedTo", "firstName lastName department")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

// ✅ UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update" });
  }
});

// ✅ DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
});

module.exports = router;
