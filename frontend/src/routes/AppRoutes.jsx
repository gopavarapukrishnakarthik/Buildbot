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

import JobList from "@/pages/hr/Job/JobList";
import JobDetails from "@/pages/hr/Job/JobDetails";
import Candidates from "@/pages/hr/Candidates/CandidatesList";
import ApplicationsList from "@/pages/hr/Applications/Applications";
import CandidateDetails from "@/pages/hr/Candidates/CandidateDetails";

import EmployeeList from "@/pages/hr/Accounts/Employees/EmployeeList";
import PayrollScreen from "@/pages/hr/Accounts/Payroll/PayrollScreen";
import CircularsScreen from "@/pages/hr/Accounts/Circulars/Circulars";
import LeaveOverview from "@/pages/hr/Accounts/Leaves/LeaveOverview";

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
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

        {/* HR Dashboard nested pages - protected */}
        <Route
          path="/career-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HRCareerLayout />
            </ProtectedRoute>
          }>
          <Route index element={<CareerDashboard />} />
          <Route path="job-list" element={<JobList />} />
          <Route path="job-list/:id" element={<JobDetails />} />
          <Route path="candidates" element={<Candidates />} />

          <Route path="applications" element={<ApplicationsList />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />
        </Route>

        {/* HR Accounts Dashboard */}
        <Route
          path="/accounts-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HRAccountsLayout />
            </ProtectedRoute>
          }>
          <Route index element={<AccountsDashboard />} />
          <Route path="employees-list" element={<EmployeeList />} />
          <Route path="payroll" element={<PayrollScreen />} />
          <Route path="circular" element={<CircularsScreen />} />
          <Route path="Attendance" element={<LeaveOverview />} />

          {/* <Route path="job-list/:id" element={<JobDetails />} />
          <Route path="candidates" element={<Candidates />} />

          <Route path="applications" element={<ApplicationsList />} />
          <Route path="candidates/:id" element={<CandidateDetails />} /> */}
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
