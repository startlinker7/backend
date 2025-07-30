const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

router.get("/:userId", async (req, res) => {
  const notifs = await Notification.find({ userId: req.params.userId });
  res.json(notifs);
});

router.post("/", async (req, res) => {
  const notif = new Notification(req.body);
  await notif.save();
  res.status(201).json(notif);
});

module.exports = router;