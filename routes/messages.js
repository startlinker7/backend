const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Send a message
router.post("/", async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;

    const message = new Message({
      sender_id,
      receiver_id,
      content
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get all messages between two users
router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender_id: user1, receiver_id: user2 },
        { sender_id: user2, receiver_id: user1 }
      ]
    }).sort({ timestamp: 1 }); // Sort by oldest to newest

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
