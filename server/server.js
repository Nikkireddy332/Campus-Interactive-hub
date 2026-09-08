const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 ROUTES
const authRoutes = require("./routes/authRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve frontend AFTER routes
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server running on port 5000"));
console.log("AuthRoutes:", typeof authRoutes);
console.log("AnnouncementRoutes:", typeof announcementRoutes);