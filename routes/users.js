// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Get all users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get single user by ID
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// Save a project to user's savedProjectIds
router.post("/:id/save/:projectId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.savedProjectIds.includes(req.params.projectId)) {
      user.savedProjectIds.push(req.params.projectId);
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: "Error saving project" });
  }
});

// Unsave a project from user's savedProjectIds
router.post("/:id/unsave/:projectId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.savedProjectIds = user.savedProjectIds.filter(
      pid => pid.toString() !== req.params.projectId
    );
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: "Error unsaving project" });
  }
});

module.exports = router;
