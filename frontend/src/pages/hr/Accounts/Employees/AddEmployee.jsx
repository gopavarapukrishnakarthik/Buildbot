import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import API from "../../../../utils/api";

const steps = ["Personal", "Job", "Documents", "Review"];

const AddEmployeeDialog = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState(1);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    location: "",
    department: "",
    role: "", // renamed from title
    employeeType: "Full-time",
    workMode: "Onsite",
    salary: "",
    manager: "",
    joinDate: "", // renamed from joiningDate
  });

  useEffect(() => {
    API.get("/employee/getEmployees").then((res) => setManagers(res.data));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

  // Validation per step
  const validateStep = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone)
        return false;
      if (!validateEmail(form.email)) {
        alert("Invalid email format");
        return false;
      }
      if (!validatePhone(form.phone)) {
        alert("Phone must be 10 digits");
        return false;
      }
      return true;
    }

    if (step === 2) {
      return form.department && form.role && form.employeeType && form.joinDate;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
    else alert("Please fill all required fields before proceeding.");
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/employee/createEmployee", form);
      alert("Employee created successfully!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error creating employee:", err);
      alert("Failed to add employee. Check console for details.");
    }
  };

  const progress = (step / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-gray-700">
          Add New Employee
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {steps.map((s, i) => (
            <span
              key={s}
              className={step === i + 1 ? "text-blue-600 font-semibold" : ""}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 min-h-[380px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              <h3 className="text-lg font-medium mb-3">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>DOB</Label>
                  <Input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              <h3 className="text-lg font-medium mb-3">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Input
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Employee Type *</Label>
                  <Select
                    value={form.employeeType}
                    onValueChange={(v) =>
                      setForm({ ...form, employeeType: v })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Work Mode</Label>
                  <Select
                    value={form.workMode}
                    onValueChange={(v) => setForm({ ...form, workMode: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onsite">Onsite</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Join Date *</Label>
                  <Input
                    type="date"
                    name="joinDate"
                    value={form.joinDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Salary</Label>
                  <Input
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Manager</Label>
                  <Select
                    value={form.manager}
                    onValueChange={(v) => setForm({ ...form, manager: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.firstName} {m.lastName} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              <h3 className="text-lg font-medium mb-3">
                Documents & Onboarding
              </h3>

              {/* Document Uploads */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Offer Letter</Label>
                  <Input type="file" />
                </div>
                <div>
                  <Label>NDA</Label>
                  <Input type="file" />
                </div>
                <div className="col-span-2">
                  <Label>ID Proof</Label>
                  <Input type="file" />
                </div>
              </div>

              {/* Onboarding Tasks */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">
                  Onboarding Tasks
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.onboardingTasks?.laptopAccess || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          onboardingTasks: {
                            ...form.onboardingTasks,
                            laptopAccess: e.target.checked,
                          },
                        })
                      }
                    />
                    Laptop Access
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.onboardingTasks?.hrOrientation || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          onboardingTasks: {
                            ...form.onboardingTasks,
                            hrOrientation: e.target.checked,
                          },
                        })
                      }
                    />
                    HR Orientation
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.onboardingTasks?.teamIntro || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          onboardingTasks: {
                            ...form.onboardingTasks,
                            teamIntro: e.target.checked,
                          },
                        })
                      }
                    />
                    Team Introduction
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              {" "}
              <h3 className="text-lg font-medium mb-3">
                Review Information
              </h3>{" "}
              <div className="text-sm text-gray-700 space-y-2 bg-gray-50 p-4 rounded-lg">
                {" "}
                <p>
                  {" "}
                  <b>Name:</b> {form.firstName} {form.lastName}{" "}
                </p>{" "}
                <p>
                  {" "}
                  <b>Email:</b> {form.email}{" "}
                </p>{" "}
                <p>
                  {" "}
                  <b>Department:</b> {form.department}{" "}
                </p>{" "}
                <p>
                  {" "}
                  <b>Role:</b> {form.role}{" "}
                </p>{" "}
                <p>
                  {" "}
                  <b>Joining Date:</b> {form.joinDate}{" "}
                </p>{" "}
              </div>{" "}
            </motion.div>
          )}
          {/* ... */}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-1" /> Create Employee
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddEmployeeDialog;
