import React, { useEffect, useState } from "react";
import API from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const LeaveList = ({ employeeId }) => {
  const [leaves, setLeaves] = useState([]);

  const fetchLeaves = async () => {
    const res = await API.get(`/leaves/employee/${employeeId}`);
    setLeaves(res.data);
  };

  useEffect(() => {
    fetchLeaves();
  }, [employeeId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave?")) return;

    try {
      await API.delete(`/leaves/${id}`);
      fetchLeaves(); // refresh list
    } catch (error) {
      console.error(error);
      alert("Failed to delete leave");
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-lg font-semibold">Leave History</h3>

        {leaves.map((l) => (
          <div
            key={l._id}
            className="border p-3 rounded-lg bg-gray-50 text-sm flex justify-between items-start">
            <div>
              <p>
                <b>Type:</b> {l.leaveType}
              </p>
              <p>
                <b>From:</b> {new Date(l.startDate).toLocaleDateString()}
              </p>
              <p>
                <b>To:</b> {new Date(l.endDate).toLocaleDateString()}
              </p>
              {l.reason && (
                <p>
                  <b>Reason:</b> {l.reason}
                </p>
              )}
            </div>

            {/* ✅ Delete Button */}
            <Button
              variant="destructive"
              onClick={() => handleDelete(l._id)}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        ))}

        {leaves.length === 0 && (
          <p className="text-gray-400">No leaves applied yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveList;
