import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logo from "../assets/logo.png";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/user/login", form);
      console.log("Login Response:", data);

      // ✅ Save token and user details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Extract roles safely
      const userRole = data.user.role || form.role;
      const userSubRole = data.user.subRole || form.subRole;

      // ✅ Update Auth Context
      login(data.user);

      // ✅ Navigate based on backend role
      if (userRole === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (userRole === "HR") {
        if (userSubRole === "CAREER") {
          navigate("/career-dashboard");
        } else if (userSubRole === "ACCOUNTS") {
          navigate("/accounts-dashboard");
        } else {
          alert("Please select a department");
        }
      } else {
        alert("Invalid role");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      alert(msg);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-cover bg-center bg-[#E6EEF9]">
      <div className="border-0 bg-white shadow-xl w-96 h-fit rounded-2xl">
        <form
          onSubmit={handleSubmit}
          className="p-6 max-w-md mx-auto text-center flex flex-col gap-4">
          <div className="flex flex-row items-center gap-3">
            <img
              src={logo} // make sure to import your logo at the top: import logo from "../assets/logo.png";
              alt="Company Logo"
              className="w-6 h-6 object-contain rounded-sm "
            />
            <h2 className="text-xl font-bold">Buildbot Management portal</h2>
          </div>
          <h2 className="text-2xl">Welcome back</h2>
          <p className="text-xs mb-4 text-gray-400">
            Sign in to manage postings, candidates, and applications.
          </p>

          <div className="flex flex-col gap-1">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative mt-1">
              <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="name"
                value={form.name}
                placeholder="Enter you name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={form.email}
                placeholder="Enter your email address"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className=" h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="flex justify-between relative gap-4">
            <div className="w-48">
              <Label htmlFor="role" className="mb-1">
                Role
              </Label>
              <Select
                onValueChange={(value) => setForm({ ...form, role: value })}
                value={form.role}
                required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Role" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="department" className="mb-1">
                Department
              </Label>
              <Select
                onValueChange={(value) => setForm({ ...form, subRole: value })}
                value={form.subRole}
                disabled={form.role !== "HR"} // 🔒 Disabled unless HR
                required={form.role === "HR"} // ✅ Required only for HR
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      form.role === "HR"
                        ? "Select Department"
                        : "Department (only for HR)"
                    }
                    className="truncate"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAREER">Career</SelectItem>
                  <SelectItem value="ACCOUNTS">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full cursor-pointer bg-[#F9AC25] hover:bg-[#F9AC25]">
            Sign In
          </Button>

          <p className="text-xs text-gray-600">
            By signing in you agree to our Terms and Privacy
          </p>
        </form>
      </div>
    </div>
  );
}
