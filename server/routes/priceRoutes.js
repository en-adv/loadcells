import express from 'express';
import Price from '../models/Price.js'; 

const router = express.Router();

// Get Latest Price
router.get("/", async (req, res) => {
    try {
        const latestPrice = await Price.find().sort({ _id: -1 }).limit(1);
        res.json(latestPrice);
    } catch (error) {
        res.status(500).json({ message: "Error fetching price", error });
    }
});

router.get("/history", async (req, res) => {
    try {
        const allPrices = await Price.find().sort({ date: 1 }); // Oldest to Newest
        res.json(allPrices);
    } catch (error) {
        res.status(500).json({ message: "Error fetching price history", error });
    }
});

// Add a New Price Entry (Do NOT update, just add)
router.post("/", async (req, res) => {
    try {
        const { price } = req.body;

        // Always create a new price entry
        const newPrice = new Price({
            date: new Date(),
            price
        });

        await newPrice.save();
        res.status(201).json({ message: "New price added successfully", newPrice });
    } catch (error) {
        res.status(500).json({ message: "Error saving price", error });
    }
});

export default router;
