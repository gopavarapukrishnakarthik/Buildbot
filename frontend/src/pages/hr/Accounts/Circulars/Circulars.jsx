import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, Send, Save, Paperclip } from "lucide-react";
import API from "@/utils/api";

export default function CircularScreen() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
    effectiveDate: "",
    expiryDate: "",
    departments: [],
    employees: [],
  });

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [circulars, setCirculars] = useState([]);

  // 🔹 Get employees and departments
  useEffect(() => {
    const fetchEmployeesAndDepartments = async () => {
      try {
        const res = await API.get("/circulars/employees/list");
        setEmployees(res.data);
        const uniqueDepts = [
          ...new Set(res.data.map((emp) => emp.department).filter(Boolean)),
        ];
        setDepartments(uniqueDepts);
      } catch (err) {
        console.error("Failed to fetch employees/departments:", err);
      }
    };
    fetchEmployeesAndDepartments();
  }, []);

  // 🔹 Send Circular
  const handleSend = async () => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) data.append(key, JSON.stringify(value));
      else data.append(key, value);
    });
    attachments.forEach((file) => data.append("attachments", file));

    try {
      await API.post("/circulars/send", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Circular sent successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send circular");
    }
  };

  // 🔹 Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (type, value) => {
    setFormData((prev) => {
      const list = prev[type];
      return list.includes(value)
        ? { ...prev, [type]: list.filter((v) => v !== value) }
        : { ...prev, [type]: [...list, value] };
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const res = await API.get("/circulars"); // ✅ Your GET / route
        setCirculars(res.data);
      } catch (err) {
        console.error("Error fetching circulars:", err);
      }
    };

    fetchCirculars();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">📢 Circular Management</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Close Preview" : "Preview"}
            </Button>
          </div>
        </div>

        {!previewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Section */}
            <Card>
              <CardHeader>
                <CardTitle>Create Circular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter circular title"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., HR, Safety, Policy Update"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      name="effectiveDate"
                      value={formData.effectiveDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label>Content / Message</Label>
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Type your circular content here..."
                  />
                </div>

                <div>
                  <Label>Attachments</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" multiple onChange={handleFileChange} />
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                <h3 className="font-semibold text-gray-700 mb-1">
                  Departments
                </h3>
                <div className="grid grid-cols-2 gap-2 border p-2 rounded-lg">
                  {departments.map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.departments.includes(dept)}
                        onCheckedChange={() =>
                          handleCheckboxChange("departments", dept)
                        }
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
                </div>

                <h3 className="font-semibold text-gray-700 mt-4 mb-1">
                  Employees
                </h3>
                <div className="grid grid-cols-2 gap-2 border p-2 rounded-lg">
                  {employees.map((emp) => (
                    <label
                      key={emp._id}
                      className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.employees.includes(emp._id)}
                        onCheckedChange={() =>
                          handleCheckboxChange("employees", emp._id)
                        }
                      />
                      <span>{emp.firstName}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end mt-5">
                  <Button
                    onClick={handleSend}
                    className="bg-amber-500 hover:bg-amber-400 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Send Circular
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>📄 Circular Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <h2 className="text-xl font-bold">{formData.title}</h2>
              <p className="text-sm text-gray-600">{formData.category}</p>
              <p className="text-gray-800 mt-4 whitespace-pre-line">
                {formData.content || "No content provided."}
              </p>

              <div className="mt-4 border-t pt-2 text-sm text-gray-600">
                <p>
                  <strong>Effective:</strong> {formData.effectiveDate || "—"}
                </p>
                <p>
                  <strong>Expires:</strong> {formData.expiryDate || "—"}
                </p>
              </div>

              <div className="mt-4 border-t pt-2">
                <strong>Departments:</strong>{" "}
                {formData.departments.join(", ") || "None"}
                <br />
                <strong>Employees:</strong>{" "}
                {formData.employees.length
                  ? formData.employees.length + " selected"
                  : "None"}
              </div>

              {attachments.length > 0 && (
                <div className="mt-4">
                  <strong>Attachments:</strong>
                  <ul className="list-disc ml-6">
                    {attachments.map((file, i) => (
                      <li key={i}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <Card className="p-5 mt-4">
          <CardTitle className="text-2xl text-amber-300">
            Old Circulars
          </CardTitle>

          <CardContent>
            {circulars.length === 0 ? (
              <p className="text-sm text-gray-500">No circulars found.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3">
                {circulars.map((item) => (
                  <li
                    key={item._id}
                    className="border p-2 grid grid-rows-2 rounded-md bg-gray-50 hover:bg-gray-100 transition">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
