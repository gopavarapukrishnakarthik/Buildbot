const express = require("express");
const router = express.Router();
const Inventory = require("../../models/Accounts/Inventory_model");

// helpers
const toInt = (v, def = 1) => (isNaN(parseInt(v)) ? def : parseInt(v));

/**
 * Create
 */
router.post("/create", async (req, res) => {
  try {
    const created = await Inventory.create(req.body);
    res.status(201).json({ success: true, inventory: created });
  } catch (e) {
    console.error("Inventory create error:", e);
    res.status(500).json({ message: "Create failed" });
  }
});

/**
 * List with filters + pagination + widgets
 * ?search=&assetType=&condition=&assigned=assigned|unassigned&page=&pageSize=
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      assetType,
      condition,
      assigned,
      page = 1,
      pageSize = 10,
    } = req.query;

    const q = {};
    if (assetType) q.assetType = assetType;
    if (condition) q.condition = condition;
    if (assigned === "assigned") q.assignedTo = { $ne: "" };
    if (assigned === "unassigned") q.assignedTo = "";

    if (search)
      q.$or = [
        { name: new RegExp(search, "i") },
        { serialNumber: new RegExp(search, "i") },
        { notes: new RegExp(search, "i") },
      ];

    const total = await Inventory.countDocuments(q);
    const data = await Inventory.find(q)
      .sort({ createdAt: -1 })
      .skip((toInt(page) - 1) * toInt(pageSize))
      .limit(toInt(pageSize))
      .lean();

    // widgets
    const totalItems = data.reduce((a, b) => a + (b.quantity || 0), 0);
    const assignedCount = data.filter(
      (x) => x.assignedTo && x.assignedTo !== ""
    ).length;
    const unassignedCount = data.length - assignedCount;
    const warrantyExpiring30 = data.filter(
      (x) =>
        x.warrantyExpiry &&
        new Date(x.warrantyExpiry) - Date.now() <= 30 * 24 * 3600 * 1000
    ).length;

    res.json({
      data,
      total,
      page: toInt(page),
      pageSize: toInt(pageSize),
      widgets: {
        totalItems,
        assignedCount,
        unassignedCount,
        warrantyExpiring30,
      },
    });
  } catch (e) {
    console.error("Inventory list error:", e);
    res.status(500).json({ message: "Fetch failed" });
  }
});

/**
 * Update
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, inventory: updated });
  } catch (e) {
    res.status(500).json({ message: "Update failed" });
  }
});

/**
 * Delete
 */
router.delete("/:id", async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
