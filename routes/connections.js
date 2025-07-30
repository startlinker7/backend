const express = require("express");
const router = express.Router();
const User = require("../models/User");

const authMiddleware = require('../middleware/authMiddleware');



// Get all pending connection requests received by the logged-in user
router.get('/pending/received', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('pendingRequests', 'name email profile');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.pendingRequests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending received requests' });
  }
});

// Get all pending connection requests sent by the logged-in user
router.get('/pending/sent', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('sentRequests', 'name email profile');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.sentRequests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending sent requests' });
  }
});

// Get all connections for the logged-in user
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('connections', 'name email profile');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.connections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});


// 🔹 Send connection request
router.post("/request/:toId", authMiddleware, async (req, res) => {
  const userId = req.user.id; // sender
  const { toId } = req.params; // receiver

  try {
    if (userId === toId) return res.status(400).json({ error: "Cannot connect to yourself" });
    const sender = await User.findById(userId);
    const receiver = await User.findById(toId);

    if (!sender || !receiver) return res.status(404).json({ error: "User not found" });

    // Check if already requested or connected
    const alreadyRequested =
      sender.sentRequests.includes(toId) ||
      receiver.pendingRequests.includes(userId);
    const alreadyConnected =
      sender.connections.includes(toId) ||
      receiver.connections.includes(userId);

    if (alreadyRequested || alreadyConnected)
      return res.status(400).json({ error: "Already requested or connected" });

    sender.sentRequests.push(toId);
    receiver.pendingRequests.push(userId);

    await sender.save();
    await receiver.save();

    res.json({ message: "Connection request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send connection request" });
  }
});

// 🔹 Accept connection request
router.post("/accept/:fromId", authMiddleware, async (req, res) => {
  const userId = req.user.id; // receiver
  const { fromId } = req.params; // sender

  try {
    const sender = await User.findById(fromId);
    const receiver = await User.findById(userId);

    if (!sender || !receiver) return res.status(404).json({ error: "User not found" });

    // Remove from request lists
    receiver.pendingRequests = receiver.pendingRequests.filter(
      (id) => id.toString() !== fromId
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== userId
    );

    // Add to connections
    sender.connections.push(userId);
    receiver.connections.push(fromId);

    await sender.save();
    await receiver.save();

    res.json({ message: "Connection accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to accept connection" });
  }
});

// 🔹 Reject connection request
router.post("/reject/:fromId", authMiddleware, async (req, res) => {
  const userId = req.user.id; // receiver
  const { fromId } = req.params; // sender

  try {
    const sender = await User.findById(fromId);
    const receiver = await User.findById(userId);

    if (!sender || !receiver) return res.status(404).json({ error: "User not found" });

    // Remove from request lists only (no connection)
    receiver.pendingRequests = receiver.pendingRequests.filter(
      (id) => id.toString() !== fromId.toString()
    );
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== userId.toString()
    );

    await sender.save();
    await receiver.save();

    res.json({ message: "Connection request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject connection" });
  }
});

// 🔹 Remove connection
router.post("/remove/:targetId", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { targetId } = req.params;
  try {
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target) return res.status(404).json({ error: "User not found" });
    user.connections = user.connections.filter(id => id.toString() !== targetId);
    target.connections = target.connections.filter(id => id.toString() !== userId);
    await user.save();
    await target.save();
    res.json({ message: "Connection removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove connection" });
  }
});

module.exports = router;
