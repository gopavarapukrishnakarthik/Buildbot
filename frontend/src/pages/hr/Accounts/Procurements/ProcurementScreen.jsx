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

export default function ProcurementScreen() {
  const [rows, setRows] = useState([]);
  const [widgets, setWidgets] = useState({
    totalCost: 0,
    items: 0,
    delivered: 0,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    category: "Consumable",
    quantity: 1,
    cost: "",
    supplier: "",
    date: "",
    addedBy: "",
    billUrl: "",
    status: "Ordered",
  });

  const load = async () => {
    const res = await API.get("/procurement", {
      params: { search, category, status, from, to, page, pageSize },
    });
    setRows(res.data.data);
    setTotal(res.data.total);
    setWidgets(res.data.widgets);
  };
  useEffect(() => {
    load();
  }, [search, category, status, from, to, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const create = async () => {
    await API.post("/procurement/create", {
      ...form,
      quantity: Number(form.quantity),
      cost: Number(form.cost),
      date: form.date || new Date(),
    });
    setOpen(false);
    setForm({
      itemName: "",
      category: "Consumable",
      quantity: 1,
      cost: "",
      supplier: "",
      date: "",
      addedBy: "",
      billUrl: "",
      status: "Ordered",
    });
    load();
  };

  const convert = async (id) => {
    await API.post(`/procurement/${id}/convert-to-inventory`);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete procurement?")) return;
    await API.delete(`/procurement/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Widgets */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Cost",
            value: `₹${widgets.totalCost?.toLocaleString("en-IN")}`,
          },
          { label: "Items Purchased", value: widgets.items },
          { label: "Delivered", value: widgets.delivered },
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
            placeholder="Search item/supplier"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {["all", "Consumable", "Device", "Furniture", "Service"].map(
                (c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All" : c}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["all", "Ordered", "Delivered", "Cancelled"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
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
              {[5, 10, 15, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="col-span-2 flex justify-end">
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
          <CardTitle>Procurements</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Category</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Supplier</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="p-2">{r.itemName}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2">{r.quantity}</td>
                  <td className="p-2">
                    ₹{(r.cost || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2">{r.supplier || "-"}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2 text-right space-x-2">
                    {r.category !== "Consumable" && !r.inventoryAdded && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convert(r._id)}>
                        To Inventory
                      </Button>
                    )}
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
                  <td colSpan={7} className="p-4 text-center text-gray-400">
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
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= Math.ceil(total / pageSize)}
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
            <DialogTitle>Create Procurement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Item Name"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            />
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Consumable", "Device", "Furniture", "Service"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              placeholder="Cost"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
            <Input
              placeholder="Supplier"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
            <Input
              placeholder="Added By (employeeId)"
              value={form.addedBy}
              onChange={(e) => setForm({ ...form, addedBy: e.target.value })}
            />
            <Input
              placeholder="Bill URL (optional)"
              value={form.billUrl}
              onChange={(e) => setForm({ ...form, billUrl: e.target.value })}
            />
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Ordered", "Delivered", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
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
