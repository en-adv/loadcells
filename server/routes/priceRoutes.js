import express from "express";
import Price from "../models/Price.js";

const router = express.Router();

// Ambil harga terbaru berdasarkan operator
router.get("/:operator", async (req, res) => {
    try {
        const { operator } = req.params;
        const priceEntry = await Price.findOne({ operator }).sort({ _id: -1 })
        ;

        if (!priceEntry) return res.status(404).json({ message: "No price found" });

        res.json(priceEntry);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update harga tanpa authMiddleware
// Update harga tanpa authMiddleware
router.post("/", async (req, res) => {
    try {
        const { operator, price } = req.body;

        // Simpan harga ke database
        const newPrice = new Price({ operator, price });
        await newPrice.save();

        res.json({ message: "Price updated successfully", newPrice });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});


export default router;
