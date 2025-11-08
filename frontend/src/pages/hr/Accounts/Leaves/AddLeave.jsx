import React, { useState } from "react";
import API from "../../../../utils/api";

const ApplyLeave = ({ employee }) => {
  const [leave, setLeave] = useState({
    leaveType: "PAID_LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const leaveTypes = [
    { value: "PAID_LEAVE", label: "Paid Leave" },
    { value: "CASUAL_LEAVE", label: "Casual Leave" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "HALF_DAY", label: "Half Day" },
    { value: "LOP", label: "Loss Of Pay" },
  ];

  const submitLeave = async () => {
    try {
      await API.post("/leaves/create", {
        ...leave,
        employeeId: employee.employeeId,
        employeeRef: employee._id,
      });

      alert("Leave Applied Successfully!");
    } catch (e) {
      alert("Failed to apply leave.");
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3">Apply Leave</h3>

      <div className="space-y-3">
        <select
          className="border p-2 rounded w-full"
          value={leave.leaveType}
          onChange={(e) => setLeave({ ...leave, leaveType: e.target.value })}>
          {leaveTypes.map((l) => (
            <option value={l.value} key={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="border p-2 rounded w-full"
          value={leave.startDate}
          onChange={(e) => setLeave({ ...leave, startDate: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 rounded w-full"
          value={leave.endDate}
          onChange={(e) => setLeave({ ...leave, endDate: e.target.value })}
        />

        <textarea
          className="border p-2 rounded w-full"
          placeholder="Reason"
          value={leave.reason}
          onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={submitLeave}>
          Add Leave
        </button>
      </div>
    </div>
  );
};

export default ApplyLeave;
