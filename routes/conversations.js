const express = require("express");
const router = express.Router();
const Conversation = require("../models/User");

router.post("/", async (req, res) => {
  const convo = new Conversation(req.body);
  await convo.save();
  res.status(201).json(convo);
});

router.get("/:userId", async (req, res) => {
  const convos = await Conversation.find({ participants: req.params.userId });
  res.json(convos);
});

module.exports = router;