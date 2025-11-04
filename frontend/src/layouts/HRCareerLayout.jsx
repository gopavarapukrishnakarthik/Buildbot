import React from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import logo from "../assets/logo.png";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Briefcase,
  Users,
  Settings as SettingsIcon,
  LayoutDashboard,
  Inbox,
  Sparkles,
  ChartLine,
  ClipboardCheck,
} from "lucide-react";

import AddJob from "@/pages/hr/Job/AddJob";
import ApplyCandidate from "@/pages/hr/Candidates/Addcandidate";

const sidebarItems = [
  { name: "Dashboard", path: "/career-dashboard", icon: LayoutDashboard },
  { name: "Job Postings", path: "/career-dashboard/job-list", icon: Briefcase },
  { name: "Candidates", path: "/career-dashboard/candidates", icon: Users },
  {
    name: "Applications",
    path: "/career-dashboard/applications",
    icon: Inbox,
  },
  {
    name: "Recrutment",
    path: "/career-dashboard/recrutment",
    icon: ClipboardCheck,
  },

  { name: "Analytics", path: "/career-dashboard/analytics", icon: ChartLine },
  { name: "Settings", path: "/career-dashboard/settings", icon: SettingsIcon },
];

export default function HRCareerLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openAddJob, setOpenAddJob] = React.useState(false);
  const [openApplyCandidate, setopenApplyCandidate] = React.useState(false);

  const dynamicNames = {
    "job-list": "Job List",
    candidates: "Candidates",
    applications: "Applications",
  };

  const formatPart = (part) => {
    if (dynamicNames[part]) return dynamicNames[part];
    if (!part) return "";
    return part
      .split("=")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("-");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-fit bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col p-4 fixed inset-y-0">
        <div className="mb-8 m-4 flex flex-row gap-5">
          <img src={logo} alt="Logo" className="w-10 h-10 mb-2" />
          <h2 className="text-lg font-bold text-gray-800">HR Portal</h2>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#F9AC25] hover:text-white ${
                location.pathname === item.path
                  ? "bg-[#F9AC25] text-white"
                  : "text-gray-700"
              }`}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          onClick={logout}
          className="border-[#F9AC25] text-[#F9AC25] hover:bg-[#F9AC25] hover:text-white">
          Logout
        </Button>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col ml-64 bg-[#E5E7EB] min-h-screen overflow-auto">
        {/* HEADER: Breadcrumb + Search */}
        <header className="flex items-center justify-between bg-white border-b px-6 py-3 shadow-sm sticky top-0 z-10">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/career-dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {pathParts.length > 2 && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="size-4" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {pathParts.slice(1, -1).map((part, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={() =>
                              navigate(
                                `/${pathParts.slice(0, idx + 2).join("/")}`
                              )
                            }>
                            {formatPart(part)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </>
              )}

              {pathParts.length > 1 && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={`/${pathParts
                          .slice(0, pathParts.length)
                          .join("/")}`}>
                        {formatPart(pathParts[pathParts.length - 1])}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Right Side Search */}
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 border-gray-300 focus:ring-2 focus:ring-[#F9AC25]"
            />
          </div>
        </header>

        {/* Overview cards */}
        <div className="bg-white flex flex-row m-5 -mb-1 p-5 justify-between rounded-2xl">
          <div className="flex flex-row">
            <Sparkles className="w-8 h-8 m-2 text-yellow-500" />
            <div>
              <h1 className="text-xl font-semibold">Welcome back, HR</h1>
              <p className="text-gray-500 text-sm">
                Monitor postings, candidates, and pipeline at a glance.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="bg-gray-300 hover:bg-gray-500 text-white"
              onClick={() => setOpenAddJob(true)}>
              + New Job
            </Button>
            <Button
              className="bg-[#F9AC25] hover:bg-[#D97706] text-white"
              onClick={() => setopenApplyCandidate(true)}>
              Add Candidates
            </Button>
          </div>
        </div>

        {/* Add Job Modal */}
        <Dialog open={openAddJob} onOpenChange={setOpenAddJob}>
          <DialogContent className="max-w-xl h-fit">
            <AddJob onSuccess={() => setOpenAddJob(false)} />
          </DialogContent>
        </Dialog>

        {/* Add Candidate Modal */}
        <Dialog open={openApplyCandidate} onOpenChange={setopenApplyCandidate}>
          <DialogContent className="max-w-xl h-fit">
            <ApplyCandidate onSuccess={() => setopenApplyCandidate(false)} />
          </DialogContent>
        </Dialog>

        {/* Dynamic Page Content */}
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
