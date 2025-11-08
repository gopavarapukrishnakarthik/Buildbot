const express = require("express");
const router = express.Router();
const Leave = require("../../models/Accounts/Leave_model.js");
const Employee = require("../../models/Accounts/Employee_models.js");

// ✅ CREATE LEAVE
router.post("/create", async (req, res) => {
  try {
    const { employeeId, employeeRef, leaveType, startDate, endDate, reason } =
      req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const date = new Date(startDate);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const payload = {
      employeeId,
      employeeRef,
      leaveType,
      startDate,
      endDate,
      month,
      year,
      status: "Approved", // ✅ No approve/reject system needed
      reason,
    };

    const created = await Leave.create(payload);
    res.status(201).json({ success: true, leave: created });
  } catch (e) {
    console.error("Leave create error:", e);
    res.status(500).json({ message: "Failed to create leave" });
  }
});

// ✅ GET LEAVES FOR EMPLOYEE
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.params.employeeId }).sort(
      { startDate: -1 }
    );
    res.json(leaves);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch employee leaves" });
  }
});

// ✅ GET LEAVES FOR CALENDAR (BY MONTH)
router.get("/calendar/:employeeId/:month/:year", async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;

    const leaves = await Leave.find({
      employeeId,
      month,
      year,
    });

    res.json(leaves);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch calendar leaves" });
  }
});

// router.get("/on-date", async (req, res) => {
//   try {
//     const { date } = req.query;

//     if (!date) {
//       return res.status(400).json({ message: "Date is required" });
//     }

//     const target = new Date(date);
//     target.setHours(0, 0, 0, 0);

//     // ✅ Find leaves where the selected date is within leave range
//     const leaves = await Leave.find({
//       startDate: { $lte: target },
//       endDate: { $gte: target },
//     }).lean();

//     if (leaves.length === 0) return res.json([]);

//     // ✅ Fetch employee details (based on employeeRef)
//     const employeeIds = leaves.map((l) => l.employeeRef);

//     const employees = await Employee.find({ _id: { $in: employeeIds } })
//       .select("firstName lastName employeeId role department email phone")
//       .lean();

//     // ✅ Merge employee + leave information
//     const result = leaves.map((leave) => {
//       const emp = employees.find(
//         (e) => e._id.toString() === leave.employeeRef.toString()
//       );

//       return {
//         employeeId: emp?.employeeId,
//         name: `${emp?.firstName} ${emp?.lastName}`,
//         role: emp?.role,
//         department: emp?.department,
//         email: emp?.email,
//         phone: emp?.phone,

//         leaveType: leave.leaveType,
//         startDate: leave.startDate,
//         endDate: leave.endDate,
//         status: leave.status,
//         reason: leave.reason,
//       };
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching leave for date:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// ✅ Get employees on leave for a selected date
// ✅ Get employees on leave for a selected date
router.get("/on-date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // ✅ Find all leaves for that date
    const leaves = await Leave.find({
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    })
      .populate(
        "employeeRef",
        "firstName lastName employeeId role department email phone"
      )
      .lean();

    if (!leaves.length) return res.json({ success: true, count: 0, data: [] });

    const data = leaves.map((l) => ({
      leaveId: l._id,
      employeeMongoId: l.employeeRef?._id,
      employeeId: l.employeeRef?.employeeId,
      name: `${l.employeeRef?.firstName || ""} ${l.employeeRef?.lastName || ""}`,
      role: l.employeeRef?.role || "-",
      department: l.employeeRef?.department || "-",
      email: l.employeeRef?.email,
      phone: l.employeeRef?.phone,

      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason || "",
      status: l.status,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Error fetching employees on leave:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ DELETE LEAVE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Leave.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Leave not found" });

    res.json({ success: true, message: "Leave deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete leave" });
  }
});

module.exports = router;
