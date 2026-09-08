const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// POST new event (Faculty/Admin Only)
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role === "student") {
    return res.status(403).json({ message: "Only Faculty/Admin can post events" });
  }

  try {
    const event = await Event.create({
      title: req.body.title,
      description: req.body.description,
      postedBy: req.user.id
    });

    // Create Notification
    await Notification.create({
      title: "New Event Added",
      message: `A new event "${req.body.title}" has been posted by ${req.user.name}.`,
      type: "event",
      relatedId: event._id
    });

    res.json({ message: "Event Created Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ONLY: DELETE EVENT
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;