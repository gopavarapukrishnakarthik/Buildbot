import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function JobList() {
  const jobs = [
    {
      id: 1,
      title: "Frontend Developer",
      department: "Engineering",
      location: "Bangalore",
      openings: 3,
      status: "Active",
    },
    {
      id: 2,
      title: "QA Analyst",
      department: "Quality Assurance",
      location: "Hyderabad",
      openings: 2,
      status: "Closed",
    },
    {
      id: 3,
      title: "Backend Developer",
      department: "Engineering",
      location: "Pune",
      openings: 1,
      status: "Active",
    },
  ];

  const getBadgeColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Job Postings</h2>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-lg">{job.title}</h4>
                <p className="text-sm text-gray-500">
                  {job.department} • {job.location}
                </p>
                <p className="text-xs text-gray-400">
                  Openings: {job.openings}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={getBadgeColor(job.status)}>
                  {job.status}
                </Badge>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/career-dashboard/job-list/${job.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
