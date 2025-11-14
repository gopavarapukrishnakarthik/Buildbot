import React, { useEffect, useMemo, useState } from "react";
import API from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const pageSizes = [5, 10, 15, 20];

export default function InventoryScreen() {
  const [rows, setRows] = useState([]);
  const [widgets, setWidgets] = useState({
    totalItems: 0,
    assignedCount: 0,
    unassignedCount: 0,
    warrantyExpiring30: 0,
  });

  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState("");
  const [condition, setCondition] = useState("");
  const [assigned, setAssigned] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    assetType: "Laptop",
    name: "",
    serialNumber: "",
    quantity: 1,
    assignedTo: "",
    condition: "Good",
    purchaseDate: "",
    warrantyExpiry: "",
    addedBy: "",
    notes: "",
  });

  const load = async () => {
    const res = await API.get("/inventory", {
      params: { search, assetType, condition, assigned, page, pageSize },
    });
    setRows(res.data.data);
    setTotal(res.data.total);
    setWidgets(res.data.widgets);
  };
  useEffect(() => {
    load();
  }, [search, assetType, condition, assigned, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const create = async () => {
    await API.post("/inventory/create", {
      ...form,
      quantity: Number(form.quantity),
      purchaseDate: form.purchaseDate || null,
      warrantyExpiry: form.warrantyExpiry || null,
    });
    setOpen(false);
    setForm({
      assetType: "Laptop",
      name: "",
      serialNumber: "",
      quantity: 1,
      assignedTo: "",
      condition: "Good",
      purchaseDate: "",
      warrantyExpiry: "",
      addedBy: "",
      notes: "",
    });
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete inventory item?")) return;
    await API.delete(`/inventory/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Widgets */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Qty", value: widgets.totalItems },
          { label: "Assigned", value: widgets.assignedCount },
          { label: "Unassigned", value: widgets.unassignedCount },
          { label: "Warranty ≤ 30 days", value: widgets.warrantyExpiring30 },
        ].map((w) => (
          <Card key={w.label}>
            <CardHeader>
              <CardTitle className="text-sm">{w.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {w.value}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Create */}
      <Card>
        <CardContent className="p-4 grid md:grid-cols-8 gap-3">
          <Input
            placeholder="Search name/serial/notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={assetType} onValueChange={setAssetType}>
            <SelectTrigger>
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              {[
                "all",
                "Laptop",
                "AC",
                "Chair",
                "Printer",
                "Furniture",
                "Device",
                "Other",
              ].map((a) => (
                <SelectItem key={a || "all"} value={a}>
                  {a || "All"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              {["all", "Good", "Repair", "Broken"].map((c) => (
                <SelectItem key={c || "all"} value={c}>
                  {c || "All"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigned} onValueChange={setAssigned}>
            <SelectTrigger>
              <SelectValue placeholder="Assignment" />
            </SelectTrigger>
            <SelectContent>
              {["all", "assigned", "unassigned"].map((s) => (
                <SelectItem key={s || "all"} value={s}>
                  {s || "All"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="col-span-3 flex justify-end">
            <Button
              className="bg-amber-500 text-white"
              onClick={() => setOpen(true)}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Asset</th>
                <th className="p-2">Name</th>
                <th className="p-2">Serial</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Assigned To</th>
                <th className="p-2">Condition</th>
                <th className="p-2">Warranty</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="p-2">{r.assetType}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.serialNumber || "-"}</td>
                  <td className="p-2">{r.quantity}</td>
                  <td className="p-2">{r.assignedTo || "-"}</td>
                  <td className="p-2">{r.condition}</td>
                  <td className="p-2">
                    {r.warrantyExpiry
                      ? new Date(r.warrantyExpiry).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => del(r._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-400">
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500">Total: {total}</div>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Asset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Select
              value={form.assetType}
              onValueChange={(v) => setForm({ ...form, assetType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Laptop",
                  "AC",
                  "Chair",
                  "Printer",
                  "Furniture",
                  "Device",
                  "Other",
                ].map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Name / Model"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Serial Number (optional)"
              value={form.serialNumber}
              onChange={(e) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
            />
            <Input
              placeholder="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              placeholder="Assign To (employeeId - optional)"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            />
            <Select
              value={form.condition}
              onValueChange={(v) => setForm({ ...form, condition: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Good", "Repair", "Broken"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm({ ...form, purchaseDate: e.target.value })
              }
            />
            <Input
              type="date"
              value={form.warrantyExpiry}
              onChange={(e) =>
                setForm({ ...form, warrantyExpiry: e.target.value })
              }
            />
            <Input
              placeholder="Added By (employeeId)"
              value={form.addedBy}
              onChange={(e) => setForm({ ...form, addedBy: e.target.value })}
            />
            <Input
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={create} className="bg-amber-500 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
