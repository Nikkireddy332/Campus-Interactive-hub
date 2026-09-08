const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// GET latest notifications
router.get("/", authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET unread count
router.get("/unread-count", authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            readBy: { $ne: req.user.id }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all as read for current user
router.post("/mark-read", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { readBy: { $ne: req.user.id } },
            { $push: { readBy: req.user.id } }
        );
        res.json({ message: "Notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
