import express from "express";
import Diskon from "../models/Diskon.js";

const router = express.Router();

// GET: Fetch discount for a specific operator
router.get("/:operator", async (req, res) => {
    try {
        const { operator } = req.params;
        console.log("Fetching discount for operator:", operator); // Debugging

        const diskon = await Diskon.findOne({ from: operator });

        if (!diskon) {
            console.log("No discount found, returning 0"); // Debugging
            return res.status(404).json({ discount: 0 });
        }

        console.log("Discount found:", diskon.discount); // Debugging
        res.json({ discount: diskon.discount });
    } catch (error) {
        console.error("Error fetching discount:", error);
        res.status(500).json({ message: error.message });
    }
});



// POST: Set discount for an operator
router.post("/", async (req, res) => {
    try {
        const { discount, from } = req.body;

        let diskon = await Diskon.findOne({ from });
        if (diskon) {
            diskon.discount = discount;
        } else {
            diskon = new Diskon({ discount, from });
        }

        await diskon.save();
        res.json({ message: "Diskon updated", diskon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
