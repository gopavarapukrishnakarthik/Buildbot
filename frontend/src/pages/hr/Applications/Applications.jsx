import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import API from "../../../utils/api.js";

export default function ApplicationsList({ refreshTrigger }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusNotes, setStatusNotes] = useState({});
  const [statusUpdates, setStatusUpdates] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await API.get("/applications/getApplications");
      const data = res.data;

      const appsWithDetails = data.map((app) => {
        const latest =
          app.statusHistory?.length > 0
            ? app.statusHistory[app.statusHistory.length - 1]
            : {
                status: app.status || "Pending",
                note: "",
                changedAt: app.appliedAt,
              };

        return {
          ...app,
          candidateName: app.candidateId?.name || "-",
          jobTitle: app.jobId?.title || "-",
          latestStatus: latest.status,
          latestStatusNote: latest.note,
          latestStatusDate: latest.changedAt,
        };
      });

      setApplications(appsWithDetails);
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

      <Card className="p-0 overflow-hidden  max-h-[70vh]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Time</th>
                <th className="text-left px-4 py-2 font-medium">Candidate</th>
                <th className="text-left px-4 py-2 font-medium">Job</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Comment</th>
                <th className="text-left px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app._id}
                  className="border-b last:border-none hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {app.latestStatusDate
                      ? new Date(app.latestStatusDate).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{app.candidateName}</td>
                  <td className="px-4 py-3">{app.jobTitle}</td>

                  {/* Status dropdown */}
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
                      className="w-full"
                    />
                  </td>

                  <td className="px-4 py-3 space-x-2 ">
                    <Button
                      size="sm"
                      className="bg-[#F9AC25] hover:bg-[#F9AC25]"
                      onClick={() => updateStatus(app._id)}
                      disabled={updatingId === app._id}>
                      {updatingId === app._id ? "Updating..." : "Update"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApp(app)}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Review candidate info and resume
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-3 mt-4 text-sm">
              <p>
                <strong>Name:</strong> {selectedApp.candidateId?.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedApp.candidateId?.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedApp.candidateId?.phone || "-"}
              </p>
              <p>
                <strong>Job:</strong> {selectedApp.jobId?.title}
              </p>
              <p>
                <strong>Status:</strong> {selectedApp.latestStatus}
              </p>
              <p>
                <strong>Comment:</strong> {selectedApp.latestStatusNote || "-"}
              </p>
              {selectedApp.candidateId?.resume ? (
                <Button
                  onClick={() =>
                    window.open(selectedApp.candidateId.resume, "_blank")
                  }
                  className="w-full">
                  View Resume
                </Button>
              ) : (
                <p className="text-gray-500 italic">No resume uploaded</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
