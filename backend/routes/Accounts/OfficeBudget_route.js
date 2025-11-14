const express = require("express");
const router = express.Router();
const OfficeBudget = require("../../models/Accounts/OfficeBudget_model");

// helpers
const toInt = (v, def = 1) => (isNaN(parseInt(v)) ? def : parseInt(v));

/**
 * Create monthly budget
 */
router.post("/create", async (req, res) => {
  try {
    const { month, year, allocatedAmount, managers = [], notes } = req.body;
    const exists = await OfficeBudget.findOne({ month, year });
    if (exists)
      return res
        .status(409)
        .json({ message: "Budget already exists for this month." });

    const budget = await OfficeBudget.create({
      month,
      year,
      allocatedAmount,
      managers,
      notes,
    });
    res.status(201).json({ success: true, budget });
  } catch (e) {
    console.error("Budget create error:", e);
    res.status(500).json({ message: "Create failed" });
  }
});

/**
 * List budgets with filters + pagination + widgets
 * ?search=&month=&year=&page=&pageSize=
 */
router.get("/", async (req, res) => {
  try {
    const { search = "", month, year, page = 1, pageSize = 10 } = req.query;

    const q = {};
    if (month) q.month = month;
    if (year) q.year = Number(year);
    if (search)
      q.$or = [
        { month: new RegExp(search, "i") },
        { notes: new RegExp(search, "i") },
      ];

    const total = await OfficeBudget.countDocuments(q);
    const data = await OfficeBudget.find(q)
      .sort({ year: -1, createdAt: -1 })
      .skip((toInt(page) - 1) * toInt(pageSize))
      .limit(toInt(pageSize))
      .lean();

    // widgets
    const allocated = data.reduce((a, b) => a + (b.allocatedAmount || 0), 0);
    const spent = data.reduce((a, b) => a + (b.spentAmount || 0), 0);

    res.json({
      data,
      total,
      page: toInt(page),
      pageSize: toInt(pageSize),
      widgets: {
        allocated,
        spent,
        remaining: allocated - spent,
        billsCount: data.reduce(
          (a, b) => a + (b.items || []).filter((i) => i.billUrl).length,
          0
        ),
      },
    });
  } catch (e) {
    console.error("Budget list error:", e);
    res.status(500).json({ message: "Fetch failed" });
  }
});

/**
 * Get single
 */
router.get("/:id", async (req, res) => {
  const budget = await OfficeBudget.findById(req.params.id);
  if (!budget) return res.status(404).json({ message: "Not found" });
  res.json(budget);
});

/**
 * Update monthly budget header (allocatedAmount/managers/notes)
 */
router.put("/:id", async (req, res) => {
  try {
    const b = await OfficeBudget.findById(req.params.id);
    if (!b) return res.status(404).json({ message: "Not found" });

    ["allocatedAmount", "managers", "notes", "month", "year"].forEach((k) => {
      if (req.body[k] !== undefined) b[k] = req.body[k];
    });

    b.recalcSpent();
    await b.save();
    res.json({ success: true, budget: b });
  } catch (e) {
    console.error("Budget update error:", e);
    res.status(500).json({ message: "Update failed" });
  }
});

/**
 * Add spend line (with optional bill)
 */
router.post("/:id/add-spend", async (req, res) => {
  try {
    const { title, description, amount, category, addedBy, billUrl, date } =
      req.body;
    const b = await OfficeBudget.findById(req.params.id);
    if (!b) return res.status(404).json({ message: "Not found" });

    b.items.push({
      title,
      description,
      amount,
      category,
      addedBy,
      billUrl,
      date,
    });
    b.recalcSpent();
    await b.save();
    res.json({ success: true, budget: b });
  } catch (e) {
    console.error("Add spend error:", e);
    res.status(500).json({ message: "Add spend failed" });
  }
});

/**
 * Delete spend line
 */
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const b = await OfficeBudget.findById(req.params.id);
    if (!b) return res.status(404).json({ message: "Not found" });
    b.items = (b.items || []).filter(
      (i) => i._id.toString() !== req.params.itemId
    );
    b.recalcSpent();
    await b.save();
    res.json({ success: true, budget: b });
  } catch (e) {
    console.error("Delete spend error:", e);
    res.status(500).json({ message: "Delete spend failed" });
  }
});

/**
 * Delete month
 */
router.delete("/:id", async (req, res) => {
  await OfficeBudget.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
