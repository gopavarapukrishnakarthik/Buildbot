import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import API from "../../../utils/api.js";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import axios from "axios";

const formSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  department: z.string().min(2, "Department is required"),
  employeeType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]),
  seniority: z.enum(["Entry", "Mid", "Senior", "Lead", "Manager"]),
  location: z.string().min(2, "Location is required"),
  onsitePolicy: z.enum(["Onsite", "Remote", "Hybrid"]),
  salaryRange: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requiredSkills: z.string().optional(),
  niceToHaveSkills: z.string().optional(),
  targetStartDate: z.string().optional(),
  immediateJoiner: z.boolean().default(false),
});

export default function AddJob({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeType: "Full-time",
      seniority: "Entry",
      onsitePolicy: "Onsite",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Convert comma-separated skill strings into arrays
      data.requiredSkills = data.requiredSkills
        ? data.requiredSkills.split(",").map((s) => s.trim())
        : [];
      data.niceToHaveSkills = data.niceToHaveSkills
        ? data.niceToHaveSkills.split(",").map((s) => s.trim())
        : [];

      await API.post("/jobs/createjob", data);
      alert("Job added successfully!");
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to add job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-fit h-max">
      <Card className="border-white">
        <CardTitle className="text-center -m-2">Create New Job</CardTitle>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Job Title */}
            <div>
              <Label>Job Title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Software Engineer"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input {...register("location")} placeholder="e.g. Bangalore" />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  {...register("department")}
                  placeholder="e.g. Engineering"
                />
                {errors.department && (
                  <p className="text-sm text-red-500">
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            {/* Employee Type & Seniority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Employee Type</Label>
                <Select
                  onValueChange={(v) => setValue("employeeType", v)}
                  defaultValue="Full-time">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Seniority</Label>
                <Select
                  onValueChange={(v) => setValue("seniority", v)}
                  defaultValue="Entry">
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry">Entry</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Onsite Policy</Label>
                <Select
                  onValueChange={(v) => setValue("onsitePolicy", v)}
                  defaultValue="Onsite">
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary & Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Salary Range</Label>
                <Input
                  {...register("salaryRange")}
                  placeholder="e.g. ₹6L - ₹10L"
                />
              </div>
              <div>
                <Label>Target Start Date</Label>
                <Input type="date" {...register("targetStartDate")} />
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <Label>Required Skills</Label>
              <Input
                {...register("requiredSkills")}
                placeholder="e.g. React, Node.js, MongoDB"
              />
            </div>

            {/* Nice to Have Skills */}
            <div>
              <Label>Nice to Have Skills</Label>
              <Input
                {...register("niceToHaveSkills")}
                placeholder="e.g. AWS, Docker"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Describe job responsibilities, requirements..."
                rows={5}
              />
            </div>

            {/* Immediate Joiner */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="immediateJoiner"
                onCheckedChange={(checked) =>
                  setValue("immediateJoiner", !!checked)
                }
              />
              <Label htmlFor="immediateJoiner">
                Immediate Joiner Preferred
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Add Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
