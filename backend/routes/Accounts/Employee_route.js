const express = require("express");
const Employee = require("../../models/Accounts/Employee_models.js");

const router = express.Router();

router.post("/createEmployee", async (req, res) => {
  try {
    const employeeData = req.body;

    // Validate manager if provided
    if (employeeData.manager) {
      const managerExists = await Employee.findById(employeeData.manager);
      if (!managerExists) {
        return res.status(400).json({ message: "Manager not found" });
      }
    } else {
      // If manager is not provided, ensure it's not set at all
      delete employeeData.manager;
    }

    const newEmployee = new Employee(employeeData);
    await newEmployee.save();

    res.status(201).json({
      message: "Employee added successfully",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📋 Get all employees
router.get("/getEmployees", async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("manager", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📄 Get one employee by ID
router.get("/getEmployeeById/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("manager", "firstName lastName email role")
      .populate("reportees", "firstName lastName email role");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🧾 Update employee details
router.put("/updateEmployee/:id", async (req, res) => {
  try {
    const updateData = req.body;

    // ✅ Handle manager optional validation
    if (updateData.manager && updateData.manager !== "") {
      const managerExists = await Employee.findById(updateData.manager);
      if (!managerExists) {
        return res.status(400).json({ message: "Manager not found" });
      }
    } else {
      // Remove manager if empty or not provided
      delete updateData.manager;
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updated,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ❌ Delete employee
router.delete("/deleteEmployee/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
