import React, { useEffect, useState } from "react";
import API from "@/utils/api";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function MaintenanceCreateDialog({ open, onClose, onCreated }) {
  const [employees, setEmployees] = useState([]);
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

  useEffect(() => {
    if (open) loadEmployees();
  }, [open]);

  const loadEmployees = async () => {
    const res = await API.get("/employee/getEmployees");
    setEmployees(res.data);
  };

  const save = async () => {
    await API.post("/maintenance/create", form);
    onCreated();
    onClose();
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
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Maintenance Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-2">
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

          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

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

          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <select
            className="border p-2 rounded-md w-full"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Assign To</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp.employeeId}>
                {emp.firstName} {emp.lastName} ({emp.employeeId})
              </option>
            ))}
          </select>

          <Input
            placeholder="Cost"
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
          />

          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            placeholder="Due Date"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-amber-500 text-white" onClick={save}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
