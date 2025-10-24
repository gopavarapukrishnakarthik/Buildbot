import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import API from "../../utils/api.js";

export default function CareerDashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
    pending: 0,
    interview: 0,
    hired: 0,
    recentApplications: [],
  });

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      // Fetch data from APIs
      const [applicationsRes, jobsRes, candidatesRes] = await Promise.all([
        API.get("/applications/getApplications"),
        API.get("/jobs/getJobs"),
        API.get("/candidates/getCandidatesWithApplications"),
      ]);

      const applications = applicationsRes.data;
      const jobs = jobsRes.data;
      const candidates = candidatesRes.data;

      let pending = 0,
        interview = 0,
        hired = 0;

      // Map applications with candidate & job info and latest status
      const appsWithDetails = applications.map((app) => {
        const latest =
          app.statusHistory?.length > 0
            ? app.statusHistory[app.statusHistory.length - 1]
            : {
                status: app.status || "Pending",
                note: "",
                changedAt: app.appliedAt || app.createdAt,
              };

        // Count statuses
        if (latest.status === "Pending") pending++;
        if (latest.status === "Interviewed") interview++;
        if (latest.status === "Hired") hired++;

        return {
          _id: app._id,
          candidateId: app.candidateId?._id,
          candidateName: app.candidateId?.name || "-",
          candidateEmail: app.candidateId?.email || "-",
          jobId: app.jobId?._id,
          jobTitle: app.jobId?.title || "-",
          appliedAt: app.appliedAt || app.createdAt,
          latestStatus: latest.status,
          latestStatusNote: latest.note,
          latestStatusDate: latest.changedAt,
        };
      });

      // Sort and keep top 5
      const recentApplications = appsWithDetails
        .sort(
          (a, b) =>
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        )
        .slice(0, 5);

      setStats({
        totalJobs: jobs.length,
        totalCandidates: candidates.length,
        totalApplications: applications.length,
        pending,
        interview,
        hired,
        recentApplications,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statusColors = {
    Pending: "text-amber-600 bg-amber-100",
    Reviewed: "text-blue-600 bg-blue-100",
    Interviewed: "text-indigo-600 bg-indigo-100",
    Hired: "text-green-700 bg-green-100",
    Rejected: "text-red-700 bg-red-100",
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card
          className="shadow-sm border cursor-pointer"
          onClick={() => navigate("/career-dashboard/job-list")}>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Jobs</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalJobs}</p>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border cursor-pointer"
          onClick={() => navigate("/career-dashboard/candidates")}>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Candidates</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCandidates}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Applications</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalApplications}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Pending</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Interviewed</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.interview}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Hired</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{stats.hired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications Table */}
      <Card className="shadow-sm border mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Applications</h3>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {stats.recentApplications.length ? (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">
                    Applied At
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Candidate</th>
                  <th className="text-left px-4 py-2 font-medium">Job</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Note</th>
                  <th className="text-left px-4 py-2 font-medium">
                    Status Updated At
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentApplications.map((app) => (
                  <tr
                    key={app._id}
                    className="border-b last:border-none hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">{app.candidateName}</td>
                    <td className="px-4 py-2">{app.jobTitle}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[app.latestStatus] ||
                          "bg-gray-100 text-gray-600"
                        }`}>
                        {app.latestStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">{app.latestStatusNote || "-"}</td>
                    <td className="px-4 py-2">
                      {app.latestStatusDate
                        ? new Date(app.latestStatusDate).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/career-dashboard/candidates/${app.candidateId}`
                          )
                        }>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No recent applications</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
