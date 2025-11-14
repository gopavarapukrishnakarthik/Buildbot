// src/pages/hr/Accounts/Maintenance/MaintenanceList.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

const statusColors = {
  Open: "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const formatCurrency = (n) =>
  isNaN(Number(n))
    ? "-"
    : Number(n).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });

export default function MaintenanceList() {
  // Data
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters (Option A – compact toolbar)
  const [q, setQ] = useState("");
  const [assetType, setAssetType] = useState("All");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [assignedTo, setAssignedTo] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Create/Edit dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

  // Create form
  const [form, setForm] = useState({
    assetType: "Laptop",
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    status: "Open",
    cost: "",
    dueDate: "",
  });

  // Edit form (status/notes)
  const [editForm, setEditForm] = useState({
    status: "Open",
    notes: "",
  });

  // Loaders
  const loadEmployees = async () => {
    const res = await API.get("/employee/getEmployees");
    setEmployees(res.data || []);
  };

  const load = async () => {
    const res = await API.get("/maintenance");
    setItems(res.data || []);
  };

  useEffect(() => {
    load();
    loadEmployees();
  }, []);

  // Derived: widgets
  const widgets = useMemo(() => {
    const total = items.length;
    const open = items.filter((i) => i.status === "Open").length;
    const inProg = items.filter((i) => i.status === "In Progress").length;
    const completed = items.filter((i) => i.status === "Completed").length;
    const overdue = items.filter(
      (i) =>
        i.dueDate &&
        new Date(i.dueDate).setHours(0, 0, 0, 0) <
          new Date().setHours(0, 0, 0, 0) &&
        i.status !== "Completed"
    ).length;
    const totalCost = items.reduce((a, b) => a + (Number(b.cost) || 0), 0);

    return { total, open, inProg, completed, overdue, totalCost };
  }, [items]);

  const getEmpName = (empId) => {
    const e = employees.find((x) => x.employeeId === empId);
    return e ? `${e.firstName} ${e.lastName}` : empId || "-";
  };

  // Filtering (client-side for simplicity)
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const byQ =
        !q ||
        [it.title, it.description, it.assetType, it.priority, it.status]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q.toLowerCase())) ||
        (getEmpName(it.assignedTo) || "")
          .toLowerCase()
          .includes(q.toLowerCase());

      const byAsset = assetType === "All" || it.assetType === assetType;
      const byStatus = status === "All" || it.status === status;
      const byPriority = priority === "All" || it.priority === priority;
      const byAssignee = assignedTo === "All" || it.assignedTo === assignedTo;

      return byQ && byAsset && byStatus && byPriority && byAssignee;
    });
  }, [items, q, assetType, status, priority, assignedTo]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const sliceStart = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(sliceStart, sliceStart + pageSize);

  useEffect(() => {
    // reset to page 1 whenever filters/pageSize change
    setPage(1);
  }, [q, assetType, status, priority, assignedTo, pageSize]);

  // Actions
  const save = async () => {
    const payload = {
      ...form,
      cost: form.cost ? Number(form.cost) : undefined,
      dueDate: form.dueDate || null,
    };
    await API.post("/maintenance/create", payload);
    setOpenCreate(false);
    setForm({
      assetType: "Laptop",
      title: "",
      description: "",
      assignedTo: "",
      priority: "Medium",
      status: "Open",
      cost: "",
      dueDate: "",
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this record?")) return;
    await API.delete(`/maintenance/${id}`);
    load();
  };

  const openEditDialog = (row) => {
    setEditing(row);
    setEditForm({
      status: row.status || "Open",
      notes: row.notes || "",
    });
    setOpenEdit(true);
  };

  const update = async () => {
    if (!editing?._id) return;
    const payload = {
      status: editForm.status,
      notes: editForm.notes,
    };
    await API.put(`/maintenance/${editing._id}`, payload);
    setOpenEdit(false);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {widgets.total}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {widgets.open}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {widgets.inProg}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">
            {widgets.overdue}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {formatCurrency(widgets.totalCost)}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Filter A (compact) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Maintenance</CardTitle>
            <Button
              className="bg-amber-500 text-white"
              onClick={() => setOpenCreate(true)}>
              + Create
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Search title/description/assignee…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="md:col-span-2"
          />

          <Select value={assetType} onValueChange={setAssetType}>
            <SelectTrigger>
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              {[
                "All",
                "Laptop",
                "Chair",
                "AC",
                "Printer",
                "Furniture",
                "Other",
              ].map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Open", "In Progress", "Completed", "Cancelled"].map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Low", "Medium", "High"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp.employeeId}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* List + Pagination */}
      <Card>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b">
                  <th className="p-2">Asset</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Assigned To</th>
                  <th className="p-2">Due</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Cost</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((m) => {
                  const dueStr = m.dueDate
                    ? new Date(m.dueDate).toLocaleDateString()
                    : "-";
                  const color =
                    statusColors[m.status] || "bg-gray-100 text-gray-700";
                  return (
                    <tr key={m._id} className="border-b">
                      <td className="p-2">{m.assetType}</td>
                      <td className="p-2 max-w-[340px]">
                        <div className="font-medium">{m.title}</div>
                        {m.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {m.description}
                          </div>
                        )}
                      </td>
                      <td className="p-2">{m.priority}</td>
                      <td className="p-2">{getEmpName(m.assignedTo)}</td>
                      <td className="p-2">{dueStr}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${color}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(m.cost || 0)}
                      </td>
                      <td className="p-2 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(m)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(m._id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {pageData.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={8}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              {filtered.length === 0
                ? "0 of 0"
                : `${sliceStart + 1}-${Math.min(
                    sliceStart + pageSize,
                    filtered.length
                  )} of ${filtered.length}`}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}>
                ⏮
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}>
                ◀
              </Button>
              <span className="text-sm">
                Page {currentPage} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}>
                ▶
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageCount)}
                disabled={currentPage === pageCount}>
                ⏭
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Maintenance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={form.assetType}
              onValueChange={(v) => setForm({ ...form, assetType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                {["Laptop", "Chair", "AC", "Printer", "Furniture", "Other"].map(
                  (a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {["Low", "Medium", "High"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="md:col-span-2"
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="md:col-span-2"
            />

            <Select
              value={form.assignedTo || ""}
              onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Cost (₹)"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />

            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button className="bg-amber-500 text-white" onClick={save}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold">{editing?.title}</div>
              <div className="text-gray-500">
                {editing?.assetType} • {editing?.priority}
              </div>
              <div className="text-gray-500">
                Assigned: {getEmpName(editing?.assignedTo)}
              </div>
            </div>

            <Select
              value={editForm.status}
              onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["Open", "In Progress", "Completed", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Notes / Resolution details"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Close
            </Button>
            <Button onClick={update}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
