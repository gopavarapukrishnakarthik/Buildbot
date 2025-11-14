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

export default function BudgetScreen() {
  const [rows, setRows] = useState([]);
  const [widgets, setWidgets] = useState({
    allocated: 0,
    spent: 0,
    remaining: 0,
    billsCount: 0,
  });
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    month: "",
    year: "",
    allocatedAmount: "",
    managers: "",
    notes: "",
  });

  const [spendOpen, setSpendOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [spendForm, setSpendForm] = useState({
    title: "",
    amount: "",
    category: "General",
    addedBy: "",
    billUrl: "",
    date: "",
  });

  const load = async () => {
    const res = await API.get("/budget", {
      params: { search, month, year, page, pageSize },
    });
    setRows(res.data.data);
    setTotal(res.data.total);
    setWidgets(res.data.widgets);
  };

  useEffect(() => {
    load();
  }, [search, month, year, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const createBudget = async () => {
    await API.post("/budget/create", {
      month: createForm.month,
      year: Number(createForm.year),
      allocatedAmount: Number(createForm.allocatedAmount),
      managers: createForm.managers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: createForm.notes,
    });
    setDialogOpen(false);
    setCreateForm({
      month: "",
      year: "",
      allocatedAmount: "",
      managers: "",
      notes: "",
    });
    load();
  };

  const openSpend = (b) => {
    setSelectedBudget(b);
    setSpendForm({
      title: "",
      amount: "",
      category: "General",
      addedBy: "",
      billUrl: "",
      date: "",
    });
    setSpendOpen(true);
  };

  const addSpend = async () => {
    await API.post(`/budget/${selectedBudget._id}/add-spend`, {
      ...spendForm,
      amount: Number(spendForm.amount),
      date: spendForm.date || new Date(),
    });
    setSpendOpen(false);
    load();
  };

  const deleteBudget = async (id) => {
    if (!confirm("Delete this monthly budget?")) return;
    await API.delete(`/budget/${id}`);
    load();
  };

  const deleteItem = async (bid, itemId) => {
    if (!confirm("Delete this spend item?")) return;
    await API.delete(`/budget/${bid}/items/${itemId}`);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Widgets */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            label: "Allocated",
            value: `₹${widgets.allocated?.toLocaleString("en-IN")}`,
          },
          {
            label: "Spent",
            value: `₹${widgets.spent?.toLocaleString("en-IN")}`,
          },
          {
            label: "Remaining",
            value: `₹${widgets.remaining?.toLocaleString("en-IN")}`,
          },
          { label: "Bills", value: widgets.billsCount },
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
        <CardContent className="p-4 grid md:grid-cols-6 gap-3">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            placeholder="Month (e.g. November)"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Input
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
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
              {pageSizes.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="col-span-2 flex justify-end">
            <Button
              className="bg-amber-500 text-white"
              onClick={() => setDialogOpen(true)}>
              Create Monthly Budget
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Month</th>
                <th className="p-2">Allocated</th>
                <th className="p-2">Spent</th>
                <th className="p-2">Remaining</th>
                <th className="p-2">Managers</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b._id} className="border-b align-top">
                  <td className="p-2">
                    {b.month} {b.year}
                  </td>
                  <td className="p-2">
                    ₹{(b.allocatedAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2">
                    ₹{(b.spentAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2">
                    ₹
                    {(
                      (b.allocatedAmount || 0) - (b.spentAmount || 0)
                    ).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2">{(b.managers || []).join(", ")}</td>
                  <td className="p-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSpend(b)}>
                      Add Spend
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBudget(b._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-400" colSpan={6}>
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Monthly Budget</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Month (e.g. November)"
              value={createForm.month}
              onChange={(e) =>
                setCreateForm({ ...createForm, month: e.target.value })
              }
            />
            <Input
              placeholder="Year"
              value={createForm.year}
              onChange={(e) =>
                setCreateForm({ ...createForm, year: e.target.value })
              }
            />
            <Input
              placeholder="Allocated Amount"
              type="number"
              value={createForm.allocatedAmount}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  allocatedAmount: e.target.value,
                })
              }
            />
            <Input
              placeholder="Managers (employeeIds, comma-separated)"
              value={createForm.managers}
              onChange={(e) =>
                setCreateForm({ ...createForm, managers: e.target.value })
              }
            />
            <Input
              placeholder="Notes (optional)"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={createBudget} className="bg-amber-500 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Spend Dialog */}
      <Dialog open={spendOpen} onOpenChange={setSpendOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Spend</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Title"
              value={spendForm.title}
              onChange={(e) =>
                setSpendForm({ ...spendForm, title: e.target.value })
              }
            />
            <Input
              placeholder="Amount"
              type="number"
              value={spendForm.amount}
              onChange={(e) =>
                setSpendForm({ ...spendForm, amount: e.target.value })
              }
            />
            <Input
              placeholder="Category (e.g. Snacks)"
              value={spendForm.category}
              onChange={(e) =>
                setSpendForm({ ...spendForm, category: e.target.value })
              }
            />
            <Input
              placeholder="Added By (employeeId)"
              value={spendForm.addedBy}
              onChange={(e) =>
                setSpendForm({ ...spendForm, addedBy: e.target.value })
              }
            />
            <Input
              placeholder="Bill URL (optional)"
              value={spendForm.billUrl}
              onChange={(e) =>
                setSpendForm({ ...spendForm, billUrl: e.target.value })
              }
            />
            <Input
              placeholder="Date (optional)"
              type="date"
              value={spendForm.date}
              onChange={(e) =>
                setSpendForm({ ...spendForm, date: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={addSpend} className="bg-amber-500 text-white">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
