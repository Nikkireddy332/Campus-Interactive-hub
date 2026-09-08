const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department, studyYear } = req.body;

    if (!email.endsWith("@srecnandyal.edu.in")) {
      return res.status(400).json({ message: "Use college email only" });
    }

    // 🔥 RESTRICT ADMIN REGISTRATION
    if (role === 'admin') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(403).json({ message: "Admin registration is restricted. Only one admin allowed." });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      password, // Model handles hashing
      role: role || 'student',
      department,
      studyYear
    });

    await newUser.save();
    res.status(201).json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ONLY: GET ALL USERS
router.get("/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    const users = await User.find({}, 'name email role createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ONLY: DELETE USER
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;