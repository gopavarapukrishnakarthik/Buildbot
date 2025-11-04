import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import API from "../../../../utils/api";

export default function PayrollForm() {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({
    month: "",
    earnings: {},
    deductions: {},
    totalDays: 30,
    paidDays: 30,
    arrearDays: 0,
    lopDays: 0,
    panNo: "",
    uanNo: "",
    pfNo: "",
  });

  useEffect(() => {
    API.get("/employee/getEmployees").then((res) => {
      setEmployees(res.data);
    });
  }, []);

  const toggleEmployee = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChange = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: Number(value) },
    }));
  };

  const calcTotal = (obj) =>
    Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);

  const totalEarnings = calcTotal(form.earnings);
  const totalDeductions = calcTotal(form.deductions);
  const netSalary = totalEarnings - totalDeductions;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/payroll/create", {
      employeeIds: selectedIds,
      payrollData: { ...form, totalEarnings, totalDeductions, netSalary },
    });
    alert("Payroll generated successfully");
  };

  return (
    <Card className="p-6 m-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">📄 Generate Payroll</h2>

      <Label>Select Month</Label>
      <Input
        type="text"
        placeholder="e.g., November 2025"
        onChange={(e) => setForm({ ...form, month: e.target.value })}
      />

      <div className="mt-4">
        <h3 className="font-semibold">Select Employees</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
          {employees.map((emp) => (
            <div key={emp._id} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedIds.includes(emp._id)}
                onCheckedChange={() => toggleEmployee(emp._id)}
              />
              <Label>
                {emp.firstName} {emp.lastName} ({emp.role})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <CardContent className="mt-6">
        <h3 className="font-semibold text-lg">Earnings</h3>
        {[
          "basicSalary",
          "houseRentAllowance",
          "dearnessAllowance",
          "transportAllowance",
          "medicalAllowance",
          "specialAllowance",
          "bonus",
        ].map((field) => (
          <div key={field} className="mt-2">
            <Label>{field}</Label>
            <Input
              type="number"
              onChange={(e) => handleChange("earnings", field, e.target.value)}
            />
          </div>
        ))}

        <h3 className="font-semibold text-lg mt-6">Deductions</h3>
        {[
          "professionalTax",
          "providentFund",
          "incomeTax",
          "loanRecovery",
          "otherDeductions",
        ].map((field) => (
          <div key={field} className="mt-2">
            <Label>{field}</Label>
            <Input
              type="number"
              onChange={(e) =>
                handleChange("deductions", field, e.target.value)
              }
            />
          </div>
        ))}

        {/* Totals */}
        <div className="mt-6 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Total Earnings:</span>
            <span className="font-semibold text-green-700">
              ₹ {totalEarnings.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Deductions:</span>
            <span className="font-semibold text-red-700">
              ₹ {totalDeductions.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-lg mt-2 border-t pt-2">
            <span>Net Salary (in ₹):</span>
            <span className="font-bold text-blue-800">
              ₹ {netSalary.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <Button className="mt-6 bg-[#F9AC25] text-white" onClick={handleSubmit}>
          Generate Payroll
        </Button>
      </CardContent>
    </Card>
  );
}
