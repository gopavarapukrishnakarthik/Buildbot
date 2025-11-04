import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import API from "../../../utils/api.js";

export default function CandidateList() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [editCandidate, setEditCandidate] = useState(null);
  const [scoreEdit, setScoreEdit] = useState({});
  const [composeEmailCandidate, setComposeEmailCandidate] = useState(null);
  const [composeEmailBulk, setComposeEmailBulk] = useState(false);
  const [emailType, setEmailType] = useState("default");
  const [emailContent, setEmailContent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const fetchCandidates = async () => {
    try {
      const res = await API.get("/candidates/getCandidatesWithApplications");
      const data = res.data.map((c) => ({ ...c, active: c.active ?? true }));
      setCandidates(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleScoreChange = (id, value) => {
    setScoreEdit((prev) => ({ ...prev, [id]: value }));
  };

  const saveScore = async (id) => {
    try {
      await API.put(`/candidates/updateCandidate/${id}`, {
        score: scoreEdit[id],
      });
      alert("Score updated successfully");
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert("Failed to update score");
    }
  };

  const toggleActive = async (candidate) => {
    try {
      await API.put(`/candidates/updateCandidate/${candidate._id}`, {
        active: !candidate.active,
      });
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const openResume = (resumeUrl) => {
    if (resumeUrl) window.open(resumeUrl, "_blank");
    else alert("Resume not available");
  };

  const saveCandidateDetails = async () => {
    try {
      await API.put(`/candidates/updateCandidate/${editCandidate._id}`, {
        name: editCandidate.name,
        email: editCandidate.email,
        phone: editCandidate.phone,
        score: editCandidate.score,
        active: editCandidate.active,
      });
      alert("Candidate updated successfully");
      setEditCandidate(null);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert("Failed to update candidate");
    }
  };

  // ✅ Send email (single or bulk, personalized or default)
  const sendEmail = async () => {
    try {
      const recipients = composeEmailBulk
        ? candidates.filter((c) => selectedCandidates.includes(c._id))
        : [composeEmailCandidate];

      if (recipients.length === 0) {
        alert("No recipients selected");
        return;
      }

      await Promise.all(
        recipients.map((c) =>
          API.post("/candidates/sendStatusEmail", {
            email: c.email,
            name: c.name,
            status:
              emailType === "personalized"
                ? `Hi ${c.name},\n\n${emailContent}`
                : emailContent,
          })
        )
      );

      alert("Email(s) sent successfully!");

      setComposeEmailCandidate(null);
      setComposeEmailBulk(false);
      setSelectedCandidates([]);
      setEmailContent("");
    } catch (err) {
      console.error(err);
      alert("Failed to send email");
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedCandidates(filteredCandidates.map((c) => c._id));
    else setSelectedCandidates([]);
  };

  const toggleCandidateSelect = (id) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) return <p>Loading candidates...</p>;

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.applications?.[0]?.jobTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesActive = showActiveOnly ? c.active === true : true;
    return matchesSearch && matchesActive;
  });

  const allSelected =
    selectedCandidates.length === filteredCandidates.length &&
    filteredCandidates.length > 0;

  return (
    <Card className="p-5 rounded-2xl shadow-sm bg-white">
      {/* Filters & Bulk Email */}
      <div className="flex justify-between mb-5 flex-wrap gap-3">
        <div className="flex flex-wrap gap-5 items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-600">
              Search
            </label>
            <Input
              className="w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, job..."
            />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Switch
              checked={showActiveOnly}
              onCheckedChange={(val) => setShowActiveOnly(val)}
            />
            <span className="text-sm font-medium text-gray-700">
              Show Active Only
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => setComposeEmailBulk(true)}
          disabled={selectedCandidates.length === 0}>
          Compose Bulk Email
        </Button>
      </div>

      {/* Candidates Table */}
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </th>
              <th className="px-4 py-2 text-left">Candidate</th>
              <th className="px-4 py-2 text-left">Applied For</th>
              <th className="px-4 py-2 text-left">Stage</th>
              <th className="px-4 py-2 text-left">Score</th>
              <th className="px-4 py-2 text-left">Active</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((c) => (
              <tr
                key={c._id}
                className={`border-b last:border-none transition ${
                  !c.active ? "bg-red-50" : "hover:bg-gray-50"
                }`}>
                <td className="px-4 py-2">
                  <Checkbox
                    checked={selectedCandidates.includes(c._id)}
                    onCheckedChange={() => toggleCandidateSelect(c._id)}
                  />
                </td>
                <td className="px-4 py-2 flex flex-col">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-500">{c.email}</span>
                </td>
                <td className="px-4 py-2">
                  {c.applications?.[0]?.jobTitle || "—"}
                </td>
                <td className="px-4 py-2">
                  <Badge
                    className={
                      c.applications?.[0]?.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : c.applications?.[0]?.status === "Interviewed"
                        ? "bg-blue-100 text-blue-800"
                        : c.applications?.[0]?.status === "Hired"
                        ? "bg-green-100 text-green-800"
                        : c.applications?.[0]?.status === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }>
                    {c.applications?.[0]?.status || "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-16 border rounded px-2 py-1 text-sm"
                      value={scoreEdit[c._id] ?? c.score ?? ""}
                      onChange={(e) => handleScoreChange(c._id, e.target.value)}
                    />
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                      onClick={() => saveScore(c._id)}>
                      ✓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => toggleActive(c)}
                  />
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openResume(c.resume)}>
                    View Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditCandidate(c)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setComposeEmailCandidate(c)}>
                    Compose Email
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      {editCandidate && (
        <Dialog
          open={!!editCandidate}
          onOpenChange={() => setEditCandidate(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Candidate</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <Input
                placeholder="Name"
                value={editCandidate.name}
                onChange={(e) =>
                  setEditCandidate({ ...editCandidate, name: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={editCandidate.email}
                onChange={(e) =>
                  setEditCandidate({ ...editCandidate, email: e.target.value })
                }
              />
              <Input
                placeholder="Phone"
                value={editCandidate.phone || ""}
                onChange={(e) =>
                  setEditCandidate({ ...editCandidate, phone: e.target.value })
                }
              />
              <Input
                placeholder="Score"
                value={editCandidate.score || ""}
                onChange={(e) =>
                  setEditCandidate({ ...editCandidate, score: e.target.value })
                }
              />
              <div className="flex items-center gap-2 mt-2">
                <label>Active:</label>
                <Switch
                  checked={editCandidate.active}
                  onCheckedChange={(value) =>
                    setEditCandidate({ ...editCandidate, active: value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setEditCandidate(null)}>
                Cancel
              </Button>
              <Button variant="default" onClick={saveCandidateDetails}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Dialog */}
      {(composeEmailCandidate || composeEmailBulk) && (
        <Dialog
          open={!!composeEmailCandidate || composeEmailBulk}
          onOpenChange={() => {
            setComposeEmailCandidate(null);
            setComposeEmailBulk(false);
          }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Compose Email{" "}
                {composeEmailBulk
                  ? "(Bulk)"
                  : `to ${composeEmailCandidate?.name}`}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex gap-2">
                <Button
                  variant={emailType === "default" ? "secondary" : "outline"}
                  onClick={() => setEmailType("default")}>
                  Default
                </Button>
                <Button
                  variant={
                    emailType === "personalized" ? "secondary" : "outline"
                  }
                  onClick={() => setEmailType("personalized")}>
                  Personalized
                </Button>
              </div>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder={
                  emailType === "default"
                    ? "Default email content..."
                    : composeEmailCandidate
                    ? `Hi ${composeEmailCandidate.name},\n`
                    : "Personalized bulk email content..."
                }
              />

              {/* Preview for personalized bulk */}
              {emailType === "personalized" && composeEmailBulk && (
                <div className="mt-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
                  <h4 className="font-medium mb-1">Preview:</h4>
                  {selectedCandidates.map((id) => {
                    const c = candidates.find((cand) => cand._id === id);
                    return (
                      <div key={id} className="mb-1 text-sm">
                        <strong>{c.name}:</strong> Hi {c.name}, {emailContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setComposeEmailCandidate(null);
                  setComposeEmailBulk(false);
                }}>
                Cancel
              </Button>
              <Button variant="default" onClick={sendEmail}>
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
