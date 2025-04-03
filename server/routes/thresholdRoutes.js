import express from "express";
import Threshold from "../models/Threshold.js"; // Import the model

const router = express.Router();

// Get today's threshold for an operator
router.get("/:operator", async (req, res) => {
    try {
        const { operator } = req.params;
        const today = new Date().toISOString().split("T")[0];

        const threshold = await Threshold.findOne({ operator, date: today });

        res.json(threshold || { operator, date: today, lastThreshold: 0 });
    } catch (err) {
        console.error("Error fetching threshold:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update threshold when notification is triggered
router.post("/", async (req, res) => {
    try {
        const { operator, lastThreshold } = req.body;
        const today = new Date().toISOString().split("T")[0];

        let threshold = await Threshold.findOne({ operator, date: today });

        if (threshold) {
            threshold.lastThreshold = lastThreshold;
            await threshold.save();
        } else {
            threshold = new Threshold({ operator, date: today, lastThreshold });
            await threshold.save();
        }

        res.json({ message: "Threshold updated successfully", threshold });
    } catch (err) {
        console.error("Error updating threshold:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
