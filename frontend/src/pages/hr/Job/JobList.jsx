import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import API from "../../../utils/api.js";
import { Checkbox } from "@/components/ui/checkbox.jsx";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkStatus, setBulkStatus] = useState(""); // for bulk status change

  const allSelected =
    selectedJobs.length === filteredJobs.length && filteredJobs.length > 0;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await API.get("/jobs/getJobs");
      const jobList = res.data;

      const jobsWithApplicants = await Promise.all(
        jobList.map(async (job) => {
          try {
            const applicantsRes = await API.get(
              `/jobs/getJobWithApplicants/${job._id}`
            );
            const applicantsCount = applicantsRes.data.applicants?.length || 0;
            return { ...job, applicants: applicantsCount };
          } catch {
            return { ...job, applicants: 0 };
          }
        })
      );

      setJobs(jobsWithApplicants);
      setFilteredJobs(jobsWithApplicants);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ Select All
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedJobs(filteredJobs.map((job) => job._id || job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  // ✅ Individual row select
  const handleSelectJob = (jobId, checked) => {
    if (checked) {
      setSelectedJobs((prev) => [...prev, jobId]);
    } else {
      setSelectedJobs((prev) => prev.filter((id) => id !== jobId));
    }
  };

  // ✅ Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedJobs.length) return;
    if (!window.confirm(`Delete ${selectedJobs.length} selected jobs?`)) return;

    try {
      await Promise.all(selectedJobs.map((id) => API.delete(`/jobs/${id}`)));
      alert(`${selectedJobs.length} job(s) deleted successfully`);
      setSelectedJobs([]);
      fetchJobs();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete jobs");
    }
  };

  // ✅ Bulk Status Update
  const handleBulkStatusChange = async (newStatus) => {
    if (!selectedJobs.length) return;
    try {
      await Promise.all(
        selectedJobs.map((id) =>
          API.patch(`/jobs/${id}`, { status: newStatus })
        )
      );
      alert(
        `Status updated to "${newStatus}" for ${selectedJobs.length} job(s)`
      );
      setBulkStatus("");
      setSelectedJobs([]);
      fetchJobs();
    } catch (err) {
      console.error("Bulk status update failed:", err);
      alert("Failed to update job status");
    }
  };

  // Apply filters
  useEffect(() => {
    let updatedJobs = [...jobs];

    if (searchTerm) {
      updatedJobs = updatedJobs.filter((job) =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== "All") {
      updatedJobs = updatedJobs.filter(
        (job) => job.department === departmentFilter
      );
    }

    if (locationFilter !== "All") {
      updatedJobs = updatedJobs.filter(
        (job) => job.location === locationFilter
      );
    }

    if (statusFilter !== "All") {
      updatedJobs = updatedJobs.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(updatedJobs);
  }, [searchTerm, departmentFilter, locationFilter, statusFilter, jobs]);

  const getBadgeColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-red-100 text-red-700";
      case "Paused":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <p>Loading jobs...</p>;
  if (!jobs.length) return <p>No jobs found.</p>;

  const departments = ["All", ...new Set(jobs.map((j) => j.department || "-"))];
  const locations = ["All", ...new Set(jobs.map((j) => j.location || "-"))];
  const statuses = ["All", "Open", "Paused", "Closed"];

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Postings</h2>
      </div>

      {/* ✅ Bulk Action Bar */}
      {selectedJobs.length > 0 && (
        <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center px-4 py-2 shadow-sm mb-3">
          <p className="text-sm font-medium text-blue-800">
            {selectedJobs.length} job(s) selected
          </p>

          <div className="flex items-center gap-3">
            <Select
              value={bulkStatus}
              onValueChange={(val) => {
                setBulkStatus(val);
                handleBulkStatusChange(val);
              }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white">
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="w-full p-5 bg-white rounded-2xl">
        <h2 className="text-xl font-semibold mb-3">Filter by jobs</h2>
        <div className="flex flex-wrap gap-5">
          {/* Search */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              Search Titles
            </label>
            <Input
              className="w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Department */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              Department
            </label>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              Location
            </label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
                <th className="text-left px-4 py-2 font-medium">Job Title</th>
                <th className="text-left px-4 py-2 font-medium">Department</th>
                <th className="text-left px-4 py-2 font-medium">Location</th>
                <th className="text-left px-4 py-2 font-medium">Applicants</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const jobId = job._id || job.id;
                const isChecked = selectedJobs.includes(jobId);

                return (
                  <tr
                    key={jobId}
                    className="border-b last:border-none hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleSelectJob(jobId, !!checked)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {job.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.role || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">{job.department || "-"}</td>
                    <td className="px-4 py-3">{job.location || "-"}</td>
                    <td className="px-4 py-3">{job.applicants || 0}</td>
                    <td className="px-4 py-3">
                      <Badge className={getBadgeColor(job.status || "Open")}>
                        {job.status || "Open"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
