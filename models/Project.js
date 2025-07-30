const mongoose = require("mongoose");

const PositionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["Paid", "Unpaid", "Equity"], default: "Paid" },
  skills: [String],
  isOpen: { type: Boolean, default: true },
  salaryRange: { type: String },
  equityOffered: { type: String } 
});

const ProjectSchema = new mongoose.Schema({
  founder_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  founder_name: { type: String, required: true },
  title: { type: String, required: true },
  tagline: { type: String },
  description: { type: String, default: "" },
  tags: [String],
  stage: { type: String, default: "Idea Stage" },
  websiteUrl: { type: String },
  contactEmail: { type: String },
  location: { type: String },
  targetDate: { type: Date },
  teamSize: { type: Number },
  imageDataUrl: { type: String }, // base64 or store in S3 and save URL
  positions: [PositionSchema],
  team_members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, default: "active" },
  analytics: { type: Object, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", ProjectSchema);
