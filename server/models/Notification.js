const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    type: { type: String, enum: ["event", "announcement"] },
    relatedId: mongoose.Schema.Types.ObjectId,
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
