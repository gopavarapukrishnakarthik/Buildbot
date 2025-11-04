import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import API from "../../../../utils/api";

export default function EditEmployeeDialog({ employee, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    status: "",
    manager: "",
    joinDate: "",
    active: true,
    onboardingTasks: [],
  });

  const [managers, setManagers] = useState([]);

  const onboardingOptions = [
    "Laptop Access",
    "HR Orientation",
    "Email Setup",
    "ID Card Issued",
    "Account Created",
  ];

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        department: employee.department || "",
        role: employee.role || "",
        status: employee.status || "Active",
        manager: employee.manager?._id || "",
        joinDate: employee.joinDate?.split("T")[0] || "",
        active: employee.status !== "Inactive",
        onboardingTasks: Array.isArray(employee.onboardingTasks)
          ? employee.onboardingTasks
          : [],
      });
    }
  }, [employee]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await API.get("/employee/getemployees");
        setManagers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch managers:", err);
      }
    };
    fetchManagers();
  }, []);

  const handleTaskToggle = (task) => {
    setForm((prev) => {
      const currentTasks = Array.isArray(prev.onboardingTasks)
        ? prev.onboardingTasks
        : [];
      const exists = currentTasks.includes(task);
      return {
        ...prev,
        onboardingTasks: exists
          ? currentTasks.filter((t) => t !== task)
          : [...currentTasks, task],
      };
    });
  };

  const handleSave = async () => {
    try {
      await API.put(`/employee/updateEmployee/${employee._id}`, form);
      alert("Employee updated successfully");
      onSuccess();
    } catch (err) {
      console.error("Failed to update employee:", err);
      alert("Update failed");
    }
  };

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>

          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />

          <Input
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />

          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Probation">Probation</SelectItem>
              <SelectItem value="Resigned">Resigned</SelectItem>
              <SelectItem value="Terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={form.manager}
            onValueChange={(v) => setForm({ ...form, manager: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.firstName} {m.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Active</label>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  active: checked,
                  status: checked ? "Active" : "Inactive",
                })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Join Date</label>
            <Input
              type="date"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </div>

          <div className="mt-3">
            <label className="text-sm font-semibold text-gray-700">
              Onboarding Tasks
            </label>
            <div className="flex flex-col gap-2 mt-2">
              {onboardingOptions.map((task) => (
                <div key={task} className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      Array.isArray(form.onboardingTasks) &&
                      form.onboardingTasks.includes(task)
                    }
                    onCheckedChange={() => handleTaskToggle(task)}
                    id={task}
                  />
                  <label
                    htmlFor={task}
                    className="text-sm text-gray-700 cursor-pointer">
                    {task}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#F9AC25] hover:bg-amber-300">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
