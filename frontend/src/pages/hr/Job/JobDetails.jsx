import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../../utils/api.js";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const fetchJob = async () => {
    try {
      const res = await API.get(`/jobs/getJob/${id}`);
      setJob(res.data);
      setEditData(res.data);
    } catch (error) {
      console.error("Failed to fetch job:", error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData({
      ...editData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      const res = await API.put(`/jobs/updateJob/${id}`, editData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setJob(res.data.job);
      setIsEditing(false);
      alert("Job updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update job.");
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 mt-10">Loading job details...</p>
    );
  if (!job)
    return <p className="text-center text-red-500 mt-10">Job not found.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-md rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={editData.title || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring focus:ring-blue-100 focus:border-blue-500"
            />
          ) : (
            job.title
          )}
        </h2>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isEditing
              ? "bg-gray-500 text-white hover:bg-gray-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}>
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          "department",
          "location",
          "employeeType",
          "seniority",
          "onsitePolicy",
          "salaryRange",
          "targetStartDate",
        ].map((field) => (
          <div key={field}>
            <label className="block text-sm font-semibold text-gray-600 capitalize">
              {field.replace(/([A-Z])/g, " $1")}
            </label>
            {isEditing ? (
              <input
                type="text"
                name={field}
                value={editData[field] || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring focus:ring-blue-100 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-800">{job[field] || "N/A"}</p>
            )}
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-600">
          Required Skills
        </label>
        {isEditing ? (
          <input
            type="text"
            name="requiredSkills"
            value={editData.requiredSkills?.join(", ") || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                requiredSkills: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring focus:ring-blue-100 focus:border-blue-500"
          />
        ) : (
          <p className="text-gray-800 mt-1">
            {job.requiredSkills?.join(", ") || "None"}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-600">
          Nice to Have Skills
        </label>
        {isEditing ? (
          <input
            type="text"
            name="niceToHaveSkills"
            value={editData.niceToHaveSkills?.join(", ") || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                niceToHaveSkills: e.target.value
                  .split(",")
                  .map((s) => s.trim()),
              })
            }
            className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring focus:ring-blue-100 focus:border-blue-500"
          />
        ) : (
          <p className="text-gray-800 mt-1">
            {job.niceToHaveSkills?.join(", ") || "None"}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-600">
          Description
        </label>
        {isEditing ? (
          <textarea
            name="description"
            value={editData.description || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring focus:ring-blue-100 focus:border-blue-500"
            rows={4}
          />
        ) : (
          <p className="text-gray-800 mt-1 whitespace-pre-line">
            {job.description || "No description"}
          </p>
        )}
      </div>

      {/* Status and Joiner */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600">
            Status
          </label>
          {isEditing ? (
            <select
              name="status"
              value={editData.status || "Active"}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring focus:ring-blue-100 focus:border-blue-500">
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Paused">Paused</option>
            </select>
          ) : (
            <p className="text-gray-800">{job.status || "Active"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">
            Immediate Joiner
          </label>
          {isEditing ? (
            <div className="flex items-center mt-1">
              <input
                type="checkbox"
                name="immediateJoiner"
                checked={editData.immediateJoiner || false}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Yes</span>
            </div>
          ) : (
            <p className="text-gray-800">
              {job.immediateJoiner ? "Yes" : "No"}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition">
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition">
            Cancel
          </button>
        </div>
      )}

      <div className="mt-8 text-right">
        <Link
          to="/career-dashboard/job-list"
          className="text-blue-600 hover:underline font-medium">
          ← Back to Job List
        </Link>
      </div>
    </div>
  );
};

export default JobDetails;
