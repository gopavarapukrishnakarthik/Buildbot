import React from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const sidebarItems = [
  { name: "Dashboard", path: "/career-dashboard" },
  { name: "Job Postings", path: "/career-dashboard/job-list" },
  { name: "Candidates", path: "/career-dashboard/candidates" },
  { name: "Applications", path: "/career-dashboard/applications" },
  { name: "Analytics", path: "/career-dashboard/analytics" },
  { name: "Settings", path: "/career-dashboard/settings" },
];

export default function HRCareerLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const params = useParams();
  const pathParts = location.pathname.split("/").filter(Boolean);

  const dynamicNames = {
    "job-list": "Job List",
    candidates: "Candidates",
  };

  // If we are on job detail page, show the job title instead of ID
  if (params.id && pathParts.includes("job-list")) {
    // In a real app, you’d fetch the job title from context or API
    dynamicNames[params.id] = `Job #${params.id}`; // temporary placeholder
  }

  const formatPart = (part) => {
    if (dynamicNames[part]) return dynamicNames[part];
    if (!part) return ""; // fallback to empty string
    return part
      .split("=")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col p-4 fixed inset-y-0">
        <div className="mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-2" />
          <h2 className="text-lg font-bold text-gray-800">HR Portal</h2>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-lg hover:bg-[#F9AC25] hover:text-white ${
                location.pathname === item.path
                  ? "bg-[#F9AC25] text-white"
                  : "text-gray-700"
              }`}>
              {item.name}
            </Link>
          ))}
        </nav>

        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col ml-64 bg-[#E5E7EB] min-h-screen overflow-auto">
        {/* HEADER: Breadcrumb + Search + Logout */}
        <header className="flex items-center justify-between bg-white border-b px-6 py-3 shadow-sm sticky top-0 z-10">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/career-dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {pathParts.slice(1).map((part, idx) => (
              <React.Fragment key={idx}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/${pathParts.slice(0, idx + 2).join("/")}`}>
                      {formatPart(part)}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </Breadcrumb>

          {/* Right Side: Search + Logout */}
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 border-gray-300 focus:ring-2 focus:ring-[#F9AC25]"
            />
            <Button
              variant="outline"
              onClick={logout}
              className="border-[#F9AC25] text-[#F9AC25] hover:bg-[#F9AC25] hover:text-white">
              Logout
            </Button>
          </div>
        </header>

        {/* Overview cards */}
        <div className="bg-white flex flex-row m-3 p-5 justify-between">
          <div>
            <h1 className="text-xl font-semibold">Welcome back, HR</h1>
            <p className="text-gray-500 text-sm">
              Monitor postings, candidates, and pipeline at a glance.
            </p>
          </div>

          <div className="flex gap-3">
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white">
              + New Job
            </Button>
            <Button className="bg-[#F9AC25] hover:bg-[#D97706] text-white">
              Import Candidates
            </Button>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
