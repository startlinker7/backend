const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

router.post("/", async (req, res) => {
  const payment = new Payment(req.body);
  await payment.save();
  res.status(201).json(payment);
});

router.get("/user/:userId", async (req, res) => {
  const payments = await Payment.find({ userId: req.params.userId });
  res.json(payments);
});

module.exports = router;
