import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import AdminLayout from "../layouts/AdminLayout";
import HRAccountsLayout from "../layouts/HRAccountsLayout";
import HRCareerLayout from "../layouts/HRCareerLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import CareerDashboard from "../pages/hr/CareerDashboard";
import AccountsDashboard from "../pages/hr/AccountsDashboard";
import Login from "../pages/login.jsx";

import JobList from "@/pages/hr/jobList";
import JobDetails from "@/pages/hr/JobDetails"; // ✅ import added
import Candidates from "@/pages/hr/Candidate";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>; // ✅ wrap children
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* HR Career Dashboard */}
        <Route
          path="/career-dashboard"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HRCareerLayout />
            </ProtectedRoute>
          }>
          {/* Nested pages inside <Outlet /> */}
          <Route index element={<CareerDashboard />} />
          <Route path="job-list" element={<JobList />} />
          <Route path="job-list/:id" element={<JobDetails />} />
          <Route path="candidates" element={<Candidates />} />
        </Route>

        {/* HR Accounts Dashboard */}
        <Route
          path="/accounts-dashboard"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HRAccountsLayout>
                <AccountsDashboard />
              </HRAccountsLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
