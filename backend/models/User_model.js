const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["HR", "ADMIN"], default: "ADMIN" },
  status: {
    type: String,
    enum: ["pending", "active", "rejected"],
    default: "pending",
  },
  approved: {
    type: Boolean,
    default: false, // new users are not approved by default
  },
});

module.exports = mongoose.model("User", userSchema);
