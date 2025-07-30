const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password_hash: { type: String, default: null },
    profile: {
      picture: { type: String, default: null },
    },
    preferences: {
      theme: { type: String, default: "light" },
      language: { type: String, default: "en" },
    },
    subscription: {
      plan: { type: String, default: "free" },
      status: { type: String, default: "inactive" },
    },

    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedProjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
