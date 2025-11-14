const express = require("express");
const router = express.Router();
const Procurement = require("../../models/Accounts/Procurement_model");
const Inventory = require("../../models/Accounts/Inventory_model");

// helpers
const toInt = (v, def = 1) => (isNaN(parseInt(v)) ? def : parseInt(v));

/**
 * Create procurement
 */
router.post("/create", async (req, res) => {
  try {
    const created = await Procurement.create(req.body);
    res.status(201).json({ success: true, procurement: created });
  } catch (e) {
    console.error("Procurement create error:", e);
    res.status(500).json({ message: "Create failed" });
  }
});

/**
 * List with filters + pagination + widgets
 * ?search=&category=&status=&from=&to=&page=&pageSize=
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category,
      status,
      from,
      to,
      page = 1,
      pageSize = 10,
    } = req.query;

    const q = {};
    if (category) q.category = category;
    if (status) q.status = status;
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);
    if (search)
      q.$or = [
        { itemName: new RegExp(search, "i") },
        { supplier: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ];

    const total = await Procurement.countDocuments(q);
    const data = await Procurement.find(q)
      .sort({ createdAt: -1 })
      .skip((toInt(page) - 1) * toInt(pageSize))
      .limit(toInt(pageSize))
      .lean();

    // widgets
    const totalCost = data.reduce((a, b) => a + (b.cost || 0), 0);
    const items = data.reduce((a, b) => a + (b.quantity || 0), 0);
    const delivered = data.filter((p) => p.status === "Delivered").length;

    res.json({
      data,
      total,
      page: toInt(page),
      pageSize: toInt(pageSize),
      widgets: { totalCost, items, delivered },
    });
  } catch (e) {
    console.error("Procurement list error:", e);
    res.status(500).json({ message: "Fetch failed" });
  }
});

/**
 * Update
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Procurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, procurement: updated });
  } catch (e) {
    res.status(500).json({ message: "Update failed" });
  }
});

/**
 * Convert to inventory (for fixed assets) then mark inventoryAdded=true
 */
router.post("/:id/convert-to-inventory", async (req, res) => {
  try {
    const p = await Procurement.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Not found" });
    if (p.inventoryAdded)
      return res.status(400).json({ message: "Already converted." });

    // Minimal mapping
    const inv = await Inventory.create({
      assetType: p.category === "Device" ? "Device" : p.category,
      name: p.itemName,
      quantity: p.quantity,
      purchaseDate: p.date,
      addedBy: p.addedBy,
    });

    p.inventoryAdded = true;
    await p.save();

    res.json({ success: true, procurement: p, inventory: inv });
  } catch (e) {
    console.error("Convert to inventory error:", e);
    res.status(500).json({ message: "Conversion failed" });
  }
});

/**
 * Delete
 */
router.delete("/:id", async (req, res) => {
  await Procurement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
