const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// GET all announcements
router.get("/", authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new announcement (Faculty Only)
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "faculty") {
    return res.status(403).json({ message: "Only faculty can post" });
  }

  try {
    const title = req.body.title;
    const description = req.body.description;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and Description required" });
    }

    const newAnnouncement = new Announcement({
      title,
      description,
      postedBy: req.user.id
    });

    await newAnnouncement.save();

    // Create Notification
    await Notification.create({
      title: "New Announcement Added",
      message: `A new announcement "${title}" has been posted by ${req.user.name}.`,
      type: "announcement",
      relatedId: newAnnouncement._id
    });

    res.status(201).json({ message: "Posted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ONLY: DELETE ANNOUNCEMENT
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;