import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../../../utils/api.js";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  source: z
    .enum(["Reference", "Portal", "Indeed", "Naukri", "LinkedIn", "Other"])
    .default("Portal"),
  resume: z
    .any()
    .optional()
    .refine(
      (file) => !file || ["application/pdf"].includes(file?.[0]?.type),
      "Only PDF files are allowed"
    ),
  jobId: z.string().min(1, "Job is required"),
});

export default function ApplyCandidate({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { source: "Portal", jobId: undefined, resume: null },
  });

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await API.get("/jobs/getJobs");
        setJobs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch candidates
  const fetchCandidates = async () => {
    try {
      const res = await API.get("/candidates/getCandidates");
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchCandidates();
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.notes) formData.append("notes", data.notes);
      formData.append("source", data.source);
      formData.append("jobId", data.jobId);

      if (data.resume && data.resume.length > 0) {
        formData.append("resume", data.resume[0]);
      }

      await API.post("/candidates/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Candidate applied successfully!");
      reset();
      fetchCandidates();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to apply candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      {/* Apply Form */}
      <Card className="shadow-md border rounded-2xl">
        <CardContent>
          <CardTitle className="text-center">Add Candidate</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Name</Label>
                  <Input {...field} placeholder="Full Name" />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Email</Label>
                  <Input {...field} placeholder="example@email.com" />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Phone</Label>
                  <Input {...field} placeholder="+91 9876543210" />
                </div>
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    {...field}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              )}
            />

            {/* Source */}
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Source</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reference">Reference</SelectItem>
                      <SelectItem value="Portal">Portal</SelectItem>
                      <SelectItem value="Indeed">Indeed</SelectItem>
                      <SelectItem value="Naukri">Naukri</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {/* Job */}
            <Controller
              name="jobId"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Job</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job._id} value={job._id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jobId && (
                    <p className="text-sm text-red-500">
                      {errors.jobId.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Resume */}
            <Controller
              name="resume"
              control={control}
              render={({ field }) => (
                <div>
                  <Label>Resume (PDF)</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                  {errors.resume && (
                    <p className="text-sm text-red-500">
                      {errors.resume.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Add Candidate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
