const express = require('express');
const cors = require('cors');
const connectDB = require("./config/db");
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();
connectDB();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Auth routes
app.use('/auth', authRoutes);

app.use("/api/projects", require("./routes/projects"));
app.use("/api/users", require("./routes/users"));
app.use("/api/connections", require("./routes/connections"));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));

app.use("/api/debug", require("./routes/debug"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});