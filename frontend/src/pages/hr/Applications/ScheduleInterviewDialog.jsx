import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import API from "../../../utils/api";

const ScheduleInterviewDialog = ({ open, onClose, application, onSuccess }) => {
  const [form, setForm] = useState({
    interviewer: "",
    interviewDate: "",
    meetLink: "",
    notes: "",
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load employee list
  const loadEmployees = async () => {
    try {
      const res = await API.get("/employee/getEmployees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    if (open) loadEmployees();
  }, [open]);

  // ✅ Prefill form when editing existing interview
  useEffect(() => {
    if (application) {
      setForm({
        interviewer: application.interview?.interviewer?._id || "",
        interviewDate: application.interview?.interviewDate
          ? new Date(application.interview.interviewDate)
              .toISOString()
              .slice(0, 16)
          : "",
        meetLink: application.interview?.meetLink || "",
        notes: application.interview?.notes || "",
      });
    }
  }, [application]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post(
        `/applications/${application._id}/scheduleInterview`,
        form
      );

      alert("Interview scheduled!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>

        {application && (
          <div className="text-sm mb-4">
            <p>
              <strong>Candidate:</strong> {application.candidateId?.name}
            </p>
            <p>
              <strong>Job:</strong> {application.jobId?.title}
            </p>
            <p>
              <strong>Email:</strong> {application.candidateId?.email}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ Employee Select */}
          <div>
            <label className="text-sm font-medium">Interviewer</label>
            <select
              className="border rounded p-2 w-full"
              value={form.interviewer}
              onChange={(e) =>
                setForm({ ...form, interviewer: e.target.value })
              }
              required>
              <option value="">Select interviewer</option>

              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Interview Date & Time</label>
            <Input
              type="datetime-local"
              value={form.interviewDate}
              onChange={(e) =>
                setForm({ ...form, interviewDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Google Meet Link</label>
            <Input
              placeholder="https://meet.google.com/..."
              value={form.meetLink}
              onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewDialog;
