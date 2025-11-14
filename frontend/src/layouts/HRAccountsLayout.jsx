import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Megaphone,
  Wrench,
  IdCard,
  Wallet,
  Truck,
  Boxes,
  Settings as SettingsIcon,
  WalletCards,
  Building2,
  ShoppingCart,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", path: "/accounts-dashboard", icon: LayoutDashboard },
  {
    name: "Employees",
    path: "/accounts-dashboard/employees-list",
    icon: IdCard,
  },
  { name: "Payroll", path: "/accounts-dashboard/payroll", icon: Wallet },
  { name: "Circulars", path: "/accounts-dashboard/circular", icon: Megaphone },
  {
    name: "Attendance",
    path: "/accounts-dashboard/Attendance",
    icon: CalendarDays,
  },
  {
    name: "Maintenance",
    path: "/accounts-dashboard/maintenance",
    icon: Wrench,
  },
  {
    name: "Office Budget",
    path: "/accounts-dashboard/office-budget",
    icon: WalletCards,
  },
  {
    name: "Inventory & Stocks",
    path: "/accounts-dashboard/inventory-stock",
    icon: Boxes,
  },
  {
    name: "Capacity Building",
    path: "/accounts-dashboard/capacity-building",
    icon: Building2,
  },

  {
    name: "Procurement",
    path: "/accounts-dashboard/procurement",
    icon: ShoppingCart,
  },

  {
    name: "Settings",
    path: "/accounts-dashboard/settings",
    icon: SettingsIcon,
  },
];

export default function HRAccountsLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = () => {
    const part = location.pathname.split("/").pop();
    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col p-4 fixed inset-y-0 z-20">
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <h2 className="text-lg font-bold text-gray-800">HR Accounts</h2>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                location.pathname === item.path
                  ? "bg-[#F9AC25] text-white"
                  : "text-gray-700 hover:bg-[#F9AC25] hover:text-white"
              }`}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          onClick={logout}
          className="mt-4 border-[#F9AC25] text-[#F9AC25] hover:bg-[#F9AC25] hover:text-white">
          Logout
        </Button>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b px-6 py-3 sticky top-0 z-10 shadow-sm">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/accounts-dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{getCurrentPage()}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Search employees, stocks, etc..."
              className="w-64 border-gray-300 focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </header>

        {/* Overview Cards */}
        <section className="flex justify-between items-center bg-white m-4 px-5 py-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-xl font-semibold">Welcome, HR Manager</h1>
            <p className="text-gray-500 text-sm">
              Manage employees, recruitment, payroll and stocks at a glance.
            </p>
          </div>

          {/* <div className="flex gap-3">
            <Button
              onClick={() => setOpenAddEmployee(true)}
              className="bg-[#2563EB] text-white hover:bg-[#1E40AF] flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Add Employee
            </Button>
            <Button
              onClick={() => setOpenAddStock(true)}
              className="bg-[#F59E0B] text-white hover:bg-[#D97706] flex items-center gap-2">
              <Package className="w-4 h-4" /> Add Stock
            </Button>
            <Button
              onClick={() => setOpenAddPayroll(true)}
              className="bg-[#16A34A] text-white hover:bg-[#15803D] flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Add Payroll
            </Button>
          </div> */}
        </section>

        {/* Dynamic Page */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>

        {/* Add Employee Dialog */}
        {/* <Dialog open={openAddEmployee} onOpenChange={setOpenAddEmployee}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <AddEmployee onClose={() => setOpenAddEmployee(false)} />
          </DialogContent>
        </Dialog> */}

        {/* Add Stock Dialog */}
        {/* <Dialog open={openAddStock} onOpenChange={setOpenAddStock}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
            </DialogHeader>
            <AddStock onClose={() => setOpenAddStock(false)} />
          </DialogContent>
        </Dialog> */}

        {/* Add Payroll Dialog */}
        {/* <Dialog open={openAddPayroll} onOpenChange={setOpenAddPayroll}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Payroll</DialogTitle>
            </DialogHeader>
            <AddPayroll onClose={() => setOpenAddPayroll(false)} />
          </DialogContent>
        </Dialog> */}
      </div>
    </div>
  );
}
