import React, { useEffect, useState } from "react";
import ApplyLeave from "./AddLeave";
import LeaveCalendar from "./LeaveCalendar";
import LeaveList from "./LeaveList";
import { TabsContent } from "@/components/ui/tabs";
import API from "@/utils/api";

const LeaveOverview = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ✅ Fetch all employees
  useEffect(() => {
    API.get("/employee/getEmployees")
      .then((res) => {
        setEmployees(res.data);

        // ✅ Auto-select first employee initially
        if (res.data.length > 0) {
          setSelectedEmployee(res.data[0]);
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  if (!selectedEmployee)
    return <p className="text-gray-400 p-4">Loading employee data...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Leave Management</h2>

      {/* ✅ Employee Dropdown */}
      <div className="mb-4">
        <label className="text-sm text-gray-600">Select Employee</label>
        <select
          className="border p-2 rounded w-full mt-1"
          value={selectedEmployee._id}
          onChange={(e) =>
            setSelectedEmployee(
              employees.find((emp) => emp._id === e.target.value)
            )
          }>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName} ({emp.employeeId})
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Apply Leave Form */}
      <ApplyLeave employee={selectedEmployee} />

      {/* ✅ Calendar & Leave List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <LeaveCalendar employeeId={selectedEmployee.employeeId} />
        <LeaveList employeeId={selectedEmployee.employeeId} />
      </div>
    </div>
  );
};

export default LeaveOverview;
