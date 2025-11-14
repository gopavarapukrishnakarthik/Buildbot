import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowUpDown } from "lucide-react";
import API from "../../../../utils/api";
import AddEmployeeDialog from "./AddEmployee";
import EditEmployeeDialog from "./EditEmployee"; // <-- new dialog component
import { Card } from "@/components/ui/card";

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Probation: "bg-yellow-100 text-yellow-700",
  Inactive: "bg-red-100 text-red-700",
  Away: "bg-blue-100 text-blue-700",
};

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    department: "",
    role: "",
    status: "all",
    manager: "",
  });

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editData, setEditData] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "asc",
  });

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employee/getEmployees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter + sort
  useEffect(() => {
    const lower = (s) => s.toLowerCase();
    let result = employees.filter((e) => {
      const matchesName = (`${e.firstName} ${e.lastName}` || "")
        .toLowerCase()
        .includes(lower(filters.name));
      const matchesDept = (e.department || "")
        .toLowerCase()
        .includes(lower(filters.department));
      const matchesRole = (e.role || "")
        .toLowerCase()
        .includes(lower(filters.role));
      const matchesStatus =
        filters.status === "all" ||
        (e.status || "").toLowerCase() === lower(filters.status);
      const matchesManager =
        (e.manager &&
          `${e.manager.firstName} ${e.manager.lastName}`
            .toLowerCase()
            .includes(lower(filters.manager))) ||
        (!e.manager && filters.manager === "");
      return (
        matchesName &&
        matchesDept &&
        matchesRole &&
        matchesStatus &&
        matchesManager
      );
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(result);
    setPage(1);
  }, [filters, employees, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/employee/deleteEmployee/${id}`);
      alert("Employee deleted successfully!");
      setEmployees((prev) => prev.filter((e) => e._id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee.");
    }
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const visibleRows = filtered.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Employees</h1>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="bg-[#F9AC25] hover:bg-[#F9AC25]">
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-0">
            <AddEmployeeDialog
              onSuccess={() => {
                setOpenAdd(false);
                fetchEmployees();
              }}
              onClose={() => setOpenAdd(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card className="p-5">
        {/* Filters */}
        <div className="grid grid-cols-6 gap-3 mt-5 mb-4">
          <Input
            placeholder="Filter by Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <Input
            placeholder="Department"
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
          />
          <Input
            placeholder="Role"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          />
          <Input
            placeholder="Manager"
            value={filters.manager}
            onChange={(e) =>
              setFilters({ ...filters, manager: e.target.value })
            }
          />
          <Select
            onValueChange={(value) => setFilters({ ...filters, status: value })}
            value={filters.status}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Probation">Probation</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Away">Away</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                name: "",
                department: "",
                role: "",
                status: "all",
                manager: "",
              })
            }>
            Clear
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {[
                  { key: "firstName", label: "Name" },
                  { key: "department", label: "Department" },
                  { key: "role", label: "Role" },
                  { key: "manager", label: "Manager" },
                  { key: "status", label: "Status" },
                  { key: "joinDate", label: "Join Date" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="p-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                ))}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length > 0 ? (
                visibleRows.map((emp) => (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3">{emp.role}</td>
                    <td className="p-3">
                      {emp.manager
                        ? `${emp.manager.firstName} ${emp.manager.lastName}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={statusColors[emp.status] || "bg-gray-100"}>
                        {emp.status || "Unknown"}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(emp.joinDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditData(emp)}>
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#F9AC25] hover:bg-amber-300"
                        onClick={() => setConfirmDelete(emp._id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 p-4">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => setRowsPerPage(Number(v))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span>
              Page {page} of {totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        <Dialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this employee?
            </p>
            <div className="flex justify-end mt-4 gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(confirmDelete)}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editData && (
          <EditEmployeeDialog
            employee={editData}
            onClose={() => setEditData(null)}
            onSuccess={() => {
              setEditData(null);
              fetchEmployees();
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default EmployeeTable;
