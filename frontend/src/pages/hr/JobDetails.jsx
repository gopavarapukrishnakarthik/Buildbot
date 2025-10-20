import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";

const JobDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const job = location.state?.job; // passed from JobList

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {job?.title || `Job #${id}`}
      </h2>
      <p>Department: {job?.department}</p>
      <p>Location: {job?.location}</p>
      <p>Openings: {job?.openings}</p>
      <Link
        to="/career-dashboard/job-list"
        className="text-blue-600 underline mt-4 inline-block">
        ← Back to Job List
      </Link>
    </div>
  );
};

export default JobDetails;
