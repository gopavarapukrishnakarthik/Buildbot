import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "@/utils/api.js";
import { Button } from "@/components/ui/button";

export default function CandidateDetails() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/candidates/getCandidates/${id}`);
        // API already returns candidate + applications formatted
        setCandidate(res.data);
        setApplications(res.data.applications || []);
      } catch (err) {
        console.error("Failed to fetch candidate", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  if (loading) return <p className="p-6">Loading candidate details...</p>;
  if (!candidate) return <p className="p-6">Candidate not found</p>;

  return (
    <div className="p-6 bg-white shadow rounded-md">
      {/* Candidate Info */}
      <h2 className="text-xl font-semibold mb-2">{candidate.name}</h2>
      <p>
        <strong>Email:</strong> {candidate.email}
      </p>
      <p>
        <strong>Phone:</strong> {candidate.phone || "-"}
      </p>
      <p>
        <strong>Source:</strong> {candidate.source || "-"}
      </p>

      {/* Applications */}
      <h3 className="mt-6 text-lg font-semibold">Applications</h3>
      {applications.length === 0 ? (
        <p className="mt-2 text-gray-500">No applications found.</p>
      ) : (
        <table className="w-full mt-2 border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Job Title</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Comment / Note</th>
              <th className="px-4 py-2 text-left">Applied At</th>
              <th className="px-4 py-2 text-left">Resume</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr
                key={idx}
                className="border-b last:border-none hover:bg-gray-50">
                <td className="px-4 py-2">{app.jobTitle || "-"}</td>
                <td className="px-4 py-2">
                  {app.latestStatus || app.status || "-"}
                </td>
                <td className="px-4 py-2">{app.latestStatusNote || "-"}</td>
                <td className="px-4 py-2">
                  {app.appliedAt
                    ? new Date(app.appliedAt).toLocaleString()
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  {app.resume ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(app.resume, "_blank")}>
                      View Resume
                    </Button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
