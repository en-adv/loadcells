import express from "express";
import Message from "../models/Message.js";

const router = express.Router();
router.post("/messages", async (req, res) => {
    try {
        const newMessage = new Message({ text: req.body.text });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ GET route to fetch messages
router.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router; // ✅ Use export default
