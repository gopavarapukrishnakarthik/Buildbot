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
  const [loading, setLoading] = useState(false);

  // Prefill candidate/interview info
  useEffect(() => {
    if (application) {
      setForm({
        interviewer: application.interview?.interviewer || "",
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
    if (!application?._id) {
      alert("Application not loaded properly");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(
        `/applications/${application._id}/scheduleInterview`,
        form
      );
      alert("Interview scheduled and email sent!");
      onSuccess?.(res.data.application);
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
              <strong>Email:</strong> {application.candidateId?.email}
            </p>
            <p>
              <strong>Phone:</strong> {application.candidateId?.phone || "-"}
            </p>
            <p>
              <strong>Job:</strong> {application.jobId?.title}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Interviewer</label>
            <Input
              name="interviewer"
              placeholder="Enter interviewer name(s)"
              value={form.interviewer}
              onChange={(e) =>
                setForm({ ...form, interviewer: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Interview Date & Time</label>
            <Input
              type="datetime-local"
              name="interviewDate"
              value={form.interviewDate}
              onChange={(e) =>
                setForm({ ...form, interviewDate: e.target.value })
              }
              required
            />
          </div>

          {/* <div>
            <label className="text-sm font-medium">Google Meet Link</label>
            <Input
              name="meetLink"
              placeholder="https://meet.google.com/..."
              value={form.meetLink}
              onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
              required
            />
          </div> */}

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              name="notes"
              placeholder="Add any details or instructions for the candidate..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !application?._id}
            className="w-full">
            {loading ? "Scheduling..." : "Send Invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewDialog;
