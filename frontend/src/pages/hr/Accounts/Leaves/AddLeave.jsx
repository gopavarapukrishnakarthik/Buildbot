import React, { useState } from "react";
import API from "../../../../utils/api";
import { Label } from "@/components/ui/label";

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
    <div className="p-5">
      <h3 className="text-xl font-semibold mb-3">Apply Leave</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Type of Leave */}
          <div className="flex flex-col">
            <Label className="mb-1 text-sm font-medium">Type of Leave</Label>
            <select
              className="border p-2 rounded w-full"
              value={leave.leaveType}
              onChange={(e) =>
                setLeave({ ...leave, leaveType: e.target.value })
              }>
              {leaveTypes.map((l) => (
                <option value={l.value} key={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Start Date */}
          <div className="flex flex-col">
            <Label className="mb-1 text-sm font-medium">Leave Start Date</Label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={leave.startDate}
              onChange={(e) =>
                setLeave({ ...leave, startDate: e.target.value })
              }
            />
          </div>

          {/* Leave End Date */}
          <div className="flex flex-col">
            <Label className="mb-1 text-sm font-medium">Leave End Date</Label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={leave.endDate}
              onChange={(e) => setLeave({ ...leave, endDate: e.target.value })}
            />
          </div>

          {/* Reason */}
          <div className="flex flex-col">
            <Label className="mb-1 text-sm font-medium">Reason for leave</Label>
            <input
              type="text"
              placeholder="Reason"
              className="border p-2 rounded w-full"
              value={leave.reason}
              onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
            />
          </div>
        </div>

        {/* Submit button below row */}
        <div className="flex justify-end mt-4">
          <button
            className="bg-[#F9AC25] hover:bg-[#e6991f] text-white px-6 py-2 rounded transition"
            onClick={submitLeave}>
            Add Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
