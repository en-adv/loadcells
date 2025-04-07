import express from "express";
import Ps from "../models/ps.js";

const router = express.Router();

// GET all records
router.get("/", async (req, res) => {
    try {
        const records = await Ps.find().sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new record
router.post("/", async (req, res) => {
    try {
        const {
            plateNumber, bruto, tar, nettoGross,
            discount, nettoBersih, pricePerKg,
            bongkar, muat, pph, operator
        } = req.body;

        const total =
            (nettoBersih * pricePerKg) -
            (bongkar * 16) -
            (muat * 8) -
            pph;

        const newPs = new Ps({
            plateNumber,
            bruto,
            tar,
            nettoGross,
            discount,
            nettoBersih,
            pricePerKg,
            bongkar,
            muat,
            pph,
            total,
            operator
        });

        const saved = await newPs.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
