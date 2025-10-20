import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CareerDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Welcome, Career HR Team 👋
      </h2>
      <p className="text-gray-600">
        Manage candidates, job postings, and interviews here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Job Listings</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              View and manage all open job postings.
            </p>
            <Link to="job-list">
              <Button className="bg-[#2563EB] hover:bg-[#1E40AF] w-full">
                View Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Candidates</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              Track applications and candidate progress.
            </p>
            <Link to="candidates">
              <Button className="bg-[#2563EB] hover:bg-[#1E40AF] w-full">
                View Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <h3 className="text-lg font-semibold">Reports</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              Generate hiring stats and performance metrics.
            </p>
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] w-full">
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
