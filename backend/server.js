const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const userRoutes = require("./routes/User_route");
const jobRoutes = require("./routes/Job_route");
const candidateRoutes = require("./routes/Candidate_route");
const applicationRoutes = require("./routes/Application_routes");
const employeeRoutes = require("./routes/Accounts/Employee_route");
const payrollRoutes = require("./routes/Accounts/Payroll_route");
const circularRoutes = require("./routes/Accounts/Circular_route");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("🚀 MERN Server is running successfully!");
});

app.use("/api/user", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/circulars", circularRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
