import React, { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import API from "@/utils/api";

const LeaveCalendar = ({ employeeId }) => {
  const today = new Date();
  const month = today.toLocaleString("en-US", { month: "long" });
  const year = today.getFullYear();

  const [leaveRanges, setLeaveRanges] = useState([]);

  useEffect(() => {
    API.get(`/leaves/calendar/${employeeId}/${month}/${year}`).then((res) => {
      // Convert DB leaves to date ranges
      const ranges = res.data.map((l) => ({
        from: new Date(l.startDate),
        to: new Date(l.endDate),
        leaveType: l.leaveType,
      }));

      setLeaveRanges(ranges);
    });
  }, [employeeId, month, year]);

  return (
    <div className="bg-white mt-5 p-5 rounded-xl shadow flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-3">Leave Calendar</h3>

      <Calendar
        mode="range"
        className="justify-items-center"
        numberOfMonths={1}
        modifiers={{
          leave: leaveRanges,
        }}
        modifiersStyles={{
          leave: {
            backgroundColor: "#f87171", // red-400
            color: "white",
          },
        }}
      />
    </div>
  );
};

export default LeaveCalendar;
