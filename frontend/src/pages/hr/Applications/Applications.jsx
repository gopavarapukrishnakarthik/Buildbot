import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API from "../../../utils/api.js";
import ScheduleInterviewDialog from "./ScheduleInterviewDialog";
import { Calendar1 } from "lucide-react";

export default function ApplicationsList({ refreshTrigger }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusNotes, setStatusNotes] = useState({});
  const [statusUpdates, setStatusUpdates] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/applications/getApplications");
      const data = res.data;

      const apps = data.map((app) => ({
        ...app,
        candidateName: app.candidateId?.name || "-",
        jobTitle: app.jobId?.title || "-",
      }));

      setApplications(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [refreshTrigger]);

  const handleStatusChange = (id, value) => {
    setStatusUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const handleNoteChange = (id, value) => {
    setStatusNotes((prev) => ({ ...prev, [id]: value }));
  };

  const updateStatus = async (id) => {
    const status = statusUpdates[id];
    const note = statusNotes[id];

    if (!status) return alert("Select a status before updating.");

    setUpdatingId(id);
    try {
      await API.patch(`/applications/${id}/status`, { status, note });
      await fetchApplications();
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors = {
    Pending: "bg-gray-100 text-gray-700",
    Reviewed: "bg-blue-100 text-blue-700",
    Interviewed: "bg-yellow-100 text-yellow-700",
    Hired: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  const statusOptions = [
    "Pending",
    "Reviewed",
    "Interviewed",
    "Hired",
    "Rejected",
  ];

  if (loading) return <p>Loading applications...</p>;
  if (!applications.length) return <p>No applications found.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Applications</h2>

      <Card className="p-0 overflow-hidden max-h-[70vh]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Candidate</th>
                <th className="px-4 py-2">Job</th>
                <th className="px-4 py-2">Interviewer</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Comment</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {app.interview?.interviewDate
                      ? new Date(app.interview.interviewDate).toLocaleString()
                      : app.latestDate
                      ? new Date(app.latestDate).toLocaleString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3">{app.candidateName}</td>
                  <td className="px-4 py-3">{app.jobTitle}</td>

                  <td className="px-4 py-3">
                    {app.interview?.interviewer
                      ? `${app.interview.interviewer.firstName} ${app.interview.interviewer.lastName}`
                      : "-"}
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-3">
                    <select
                      className={`border rounded p-1 text-sm ${
                        statusColors[app.latestStatus]
                      }`}
                      value={statusUpdates[app._id] || app.latestStatus}
                      onChange={(e) =>
                        handleStatusChange(app._id, e.target.value)
                      }>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      placeholder="Add note"
                      value={statusNotes[app._id] || ""}
                      onChange={(e) =>
                        handleNoteChange(app._id, e.target.value)
                      }
                    />
                  </td>

                  <td className="px-4 py-3 space-x-2">
                    <Button
                      size="sm"
                      className="bg-amber-500 text-white"
                      onClick={() => updateStatus(app._id)}
                      disabled={updatingId === app._id}>
                      {updatingId === app._id ? "Updating..." : "Update"}
                    </Button>

                    <Button
                      size="sm"
                      className="bg-blue-500 text-white"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDialog(true);
                      }}>
                      <Calendar1 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ✅ Updated dialog */}
      <ScheduleInterviewDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        application={selectedApp}
        onSuccess={() => fetchApplications()}
      />
    </div>
  );
}
