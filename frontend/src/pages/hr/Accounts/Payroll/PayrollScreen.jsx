import React, { useEffect, useState } from "react";
import API from "../../../../utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Eye, Edit, Mail, Trash2 } from "lucide-react";
import PayrollForm from "./PayrollForm";

export default function PayrollScreen() {
  const [payrolls, setPayrolls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  // Fetch all payrolls
  const fetchAll = async () => {
    try {
      const res = await API.get("/payroll/");
      setPayrolls(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🟢 Preview / Edit handler
  const handlePreview = async (id, editable = false) => {
    setLoading(true);
    setPreviewOpen(true);
    setEditMode(editable);

    try {
      const res = await API.get(`/payroll/${id}`);
      const data = res.data;
      data.earnings = data.earnings || {};
      data.deductions = data.deductions || {};
      data.employees = data.employees || [];
      setEditData(data);

      if (!editable) {
        const pdf = await API.get(`/payroll/preview/${id}`, {
          responseType: "blob",
        });
        const blob = new Blob([pdf.data], { type: "application/pdf" });
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load payroll preview");
    } finally {
      setLoading(false);
    }
  };

  // 📨 Send Email
  const handleSendEmail = async (id) => {
    setSendingId(id);
    try {
      const res = await API.post(`/payroll/send-email/${id}`);
      alert(res.data.message);
    } catch {
      alert("Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  // 🗑️ Delete Payroll
  const handleDelete = async (id) => {
    console.log("🧾 Delete ID received:", id); // Debug log

    if (!window.confirm("Are you sure you want to delete this payroll record?"))
      return;
    try {
      await API.delete(`/payroll/${id}`);
      alert("Payroll deleted successfully");
      setPayrolls((prev) => prev.filter((p) => p._id !== id));
      setPreviewOpen(false);
    } catch (err) {
      alert("Failed to delete payroll");
      console.error("Delete error:", err);
    }
  };

  // 🧮 Field Update & Auto-Recalc
  const updateField = (path, value) => {
    const keys = path.split(".");
    setEditData((prev) => {
      const copy = structuredClone(prev);
      let obj = copy;
      keys.slice(0, -1).forEach((k) => (obj = obj[k]));
      obj[keys[keys.length - 1]] = value;

      const totalEarnings = Object.values(copy.earnings || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
      const totalDeductions = Object.values(copy.deductions || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
      copy.netSalary = totalEarnings - totalDeductions;
      return copy;
    });
  };

  // 💾 Save Changes
  const saveChanges = async () => {
    try {
      await API.put(`/payroll/${editData._id}`, {
        payrollData: editData,
        month: editData.month,
        year: editData.year,
      });
      alert("✅ Payroll updated successfully!");
      setPreviewOpen(false);
      fetchAll();
    } catch (error) {
      alert("❌ Error saving payroll");
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#F9AC25] text-white hover:bg-amber-400">
          {showForm ? "Hide Form" : "Create Payroll"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && <PayrollForm onPayrollCreated={fetchAll} />}

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-2">Month</th>
                <th className="p-2">Employee(s)</th>
                <th className="p-2">Net Salary</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr
                  key={p._id}
                  className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-2">{p.month}</td>
                  <td className="p-2">
                    {p.employees.map((e) => e.name).join(", ")}
                  </td>
                  <td className="p-2 font-semibold text-green-700">
                    ₹{p.netSalary?.toLocaleString("en-IN")}
                  </td>
                  <td className="p-2 flex items-center justify-center gap-2">
                    {/* Preview Button */}
                    <Button
                      onClick={() => handlePreview(p._id, false)}
                      className="text-gray-500 bg-white border border-gray-500 hover:bg-gray-200 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>

                    {/* Send Email Button */}
                    <Button
                      disabled={sendingId === p._id}
                      onClick={() => handleSendEmail(p._id)}
                      className={`flex items-center gap-1 ${
                        sendingId === p._id
                          ? "bg-[#F9AC25] text-white"
                          : "bg-[#F9AC25] hover:bg-amber-400 text-white"
                      }`}>
                      {sendingId === p._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {sendingId === p._id ? "Sending..." : "Send Email"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editMode ? "Edit Payroll" : "Payroll Preview"}
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : editMode && editData ? (
            // 🟢 Edit Mode
            <div className="overflow-y-auto flex-1 space-y-4 p-6">
              <h3 className="font-semibold text-lg text-gray-700">
                Employee & Payroll Info
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {[
                  "month",
                  "year",
                  "totalDays",
                  "paidDays",
                  "panNo",
                  "uanNo",
                  "pfNo",
                ].map((key) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <Input
                      value={editData[key] || ""}
                      onChange={(e) => updateField(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4 w-full">
                {/* Earnings */}
                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">Earnings</h3>
                  <div className="overflow-auto max-h-[55vh] border rounded-lg">
                    <table className="w-full text-sm border-collapse table-fixed">
                      <tbody>
                        {Object.entries(editData.earnings)
                          .filter(
                            ([k]) => !["totalEarnings", "total"].includes(k)
                          )
                          .map(([k, v]) => (
                            <tr key={k} className="border-b hover:bg-gray-50">
                              <td className="p-2 w-1/2 break-words capitalize text-gray-700">
                                {k}
                              </td>
                              <td className="p-2 w-1/2">
                                <Input
                                  className="w-full text-right"
                                  value={v}
                                  onChange={(e) =>
                                    updateField(`earnings.${k}`, e.target.value)
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        <tr className="bg-gray-100 font-semibold text-blue-700">
                          <td className="p-2">Total Earnings</td>
                          <td className="p-2 text-right">
                            ₹
                            {Object.entries(editData.earnings)
                              .filter(
                                ([k]) => !["totalEarnings", "total"].includes(k)
                              )
                              .reduce((a, [, b]) => a + Number(b || 0), 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">
                    Deductions
                  </h3>
                  <div className="overflow-auto max-h-[55vh] border rounded-lg">
                    <table className="w-full text-sm border-collapse table-fixed">
                      <tbody>
                        {Object.entries(editData.deductions)
                          .filter(
                            ([k]) => !["totalDeductions", "total"].includes(k)
                          )
                          .map(([k, v]) => (
                            <tr key={k} className="border-b hover:bg-gray-50">
                              <td className="p-2 w-3/5 break-words capitalize text-gray-700">
                                {k}
                              </td>
                              <td className="p-2 w-2/5">
                                <Input
                                  className="w-full text-right"
                                  value={v}
                                  onChange={(e) =>
                                    updateField(
                                      `deductions.${k}`,
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        <tr className="bg-gray-100 font-semibold text-red-700">
                          <td className="p-2">Total Deductions</td>
                          <td className="p-2 text-right">
                            ₹
                            {Object.entries(editData.deductions)
                              .filter(
                                ([k]) =>
                                  !["totalDeductions", "total"].includes(k)
                              )
                              .reduce((a, [, b]) => a + Number(b || 0), 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="mt-6 text-right border-t pt-4">
                <p className="font-semibold text-green-700 text-xl">
                  Net Salary: ₹{editData.netSalary}
                </p>
              </div>
            </div>
          ) : (
            // 🟡 Preview Mode
            <div className="flex flex-col flex-1">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full flex-1 border rounded-md"
                  title="Payroll PDF Preview"
                />
              ) : (
                <p className="text-center text-gray-500 mt-10">
                  Preview not available.
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="pt-4 flex justify-between">
            {editMode ? (
              <Button
                onClick={saveChanges}
                className="bg-blue-500 text-white hover:bg-blue-400">
                Save Changes
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setEditMode(true);
                    handlePreview(editData?._id || "", true);
                  }}
                  className="bg-[#F9AC25] text-white hover:bg-amber-400">
                  Edit Payroll
                </Button>
                <Button
                  onClick={() => handleDelete(editData?._id)}
                  className="bg-red-500 text-white hover:bg-red-400">
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
