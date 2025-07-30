const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const nodemailer = require('nodemailer');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const User = require('../models/User');
const Project = require('../models/Project');

const router = express.Router();

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
  <style>
    body {
      background-color: #000;
      color: #f1f1f1;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      position: relative;
      max-width: 600px;
      margin: auto;
      background-color: #111827;
      border-radius: 12px;
      padding: 30px;
      overflow: hidden;
    }
    .glow {
      position: absolute;
      border-radius: 9999px;
      filter: blur(80px);
      opacity: 0.3;
      z-index: 0;
    }
    .glow-pink {
      width: 300px;
      height: 300px;
      top: -100px;
      left: -100px;
      background: #ff3d8b;
    }
    .glow-blue {
      width: 240px;
      height: 240px;
      bottom: -100px;
      right: -100px;
      background: #3079ff;
    }
    .content {
      position: relative;
      z-index: 10;
    }
    .code-box {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #fff;
      margin: 20px auto;
      padding: 16px 24px;
      border-radius: 8px;
      background: linear-gradient(to right, #FF8C42, #FF3D8B, #3079FF);
      display: inline-block;
    }
    .logo-title {
      background: linear-gradient(to right, #FF8C42, #FF3D8B, #3079FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 24px;
      margin: 10px 0;
    }
    a.button {
      background: linear-gradient(to right, #FF8C42, #FF3D8B, #3079FF);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      display: inline-block;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Glowing Highlights -->
    <div class="glow glow-pink"></div>
    <div class="glow glow-blue"></div>

    <!-- Main Content -->
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.ibb.co/PZNJZwhT/startlinker.png" alt="Startlinker Logo" style="height: 40px;" />
        <h1 class="logo-title">Startlinker</h1>
        <p style="color: #c0c0c0;">Let’s verify your email to get you started!</p>
      </div>

      <div style="text-align: center;">
        <p style="font-size: 16px; color: #d1d5db;">Your verification code:</p>
        <div class="code-box">{{code}}</div>
      </div>

      <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 30px;">
        This code will expire in 10 minutes. If you didn’t request this, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #374151; margin: 30px 0;" />

      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        Need help? Contact <a href="mailto:support@startlinker.com" style="color: #60a5fa; text-decoration: none;">support@startlinker.com</a>
      </p>

      <p style="font-size: 12px; color: #4b5563; text-align: center; margin-top: 20px;">
        © 2025 Startlinker, Inc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`

// Email verification code storage (in-memory, for demo)
const emailVerifications = {};

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  // Validate basic input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  emailVerifications[email] = {
    code,
    password,
    name: name || "New User",
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  // Send email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const personalizedHtml = htmlTemplate.replace('{{code}}', code);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'StartLinker Email Verification',
      html: personalizedHtml,
    });

    res.status(200).json({ message: 'Verification code sent' });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// Verify code and create user
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  const entry = emailVerifications[email];
  if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

    const hashedPassword = await bcrypt.hash(entry.password, 10);
    const newUser = new User({
    email,
    name: entry.name,
    password_hash: hashedPassword,
    profile: {},
    preferences: {},
    subscription: {}
  });
  await newUser.save();


  delete emailVerifications[email];

  const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
});

router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  const entry = emailVerifications[email];
  if (!entry) return res.status(400).json({ message: 'No verification in progress' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const personalizedHtml = htmlTemplate.replace('{{code}}', code);
  emailVerifications[email].code = code;
  emailVerifications[email].expiresAt = Date.now() + 10 * 60 * 1000;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: 'Your new StartLinker verification code',
    html: personalizedHtml,
  });

  res.status(200).json({ message: 'New verification code sent' });
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

router.post('/google', async (req, res) => {
  const { googleToken } = req.body;
  if (!googleToken) return res.status(400).json({ message: 'Google token missing' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
let user = await User.findOne({ email: payload.email });

    if (!user) {
  user = new User({
    email: payload.email,
    name: payload.name,
    password_hash: null,
    profile: { picture: payload.picture },
    preferences: {},
    subscription: {}
  });
  await user.save();
}

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profilePictureUrl: user.profilePictureUrl } });

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid Google token' });
  }
});

// Login manual
router.post('/login', async (req, res) => {
  const { email, password, googleToken } = req.body;
    // Manual login
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (!user.password_hash) return res.status(400).json({ message: 'Use Google login for this account' });
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, profilePictureUrl: user.profilePictureUrl } });
});

// Protected route
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user?.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePictureUrl: user.profile?.picture || null
    }
  });
});

module.exports = router;
