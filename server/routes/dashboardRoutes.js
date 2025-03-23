import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Vehicle from "../models/Vehicle.js"; // Vehicle model

const router = express.Router();

// ✅ Admin Dashboard (Restricted)
router.get("/admin", authMiddleware, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });
    res.json({ message: "Welcome to Admin Dashboard" });
});

// ✅ Operator Dashboard (Restricted)
router.get("/operator", authMiddleware, (req, res) => {
    if (req.user.role !== "operator")
        return res.status(403).json({ message: "Access denied" });
    res.json({ message: "Welcome to Operator Dashboard" });
});

// ✅ Get all vehicles (Admin & Operator Access)
router.get("/vehicles", authMiddleware, async (req, res) => {
    if (!["admin", "operator"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/vehicles", authMiddleware, async (req, res) => {
    if (!["admin", "operator"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    // (rest of the code remains the same)
});

router.post("/vehicles", authMiddleware, async (req, res) => {
    const { plateNumber, bruto, tar } = req.body;

    try {
        let vehicle = await Vehicle.findOne({ plateNumber });

        if (vehicle) {
            // If vehicle exists, update weights accordingly
            if (bruto) vehicle.bruto = bruto;
            if (tar) vehicle.tar = tar;
        } else {
            // If new vehicle, save Bruto weight
            vehicle = new Vehicle({ plateNumber, bruto, tar: null, netto: null });
        }

        if (vehicle.bruto !== null && vehicle.tar !== null) {
            vehicle.netto = vehicle.bruto - vehicle.tar;
        }

        await vehicle.save();
        res.json({ message: "Vehicle data saved!", vehicle });
    } catch (error) {
        res.status(500).json({ error: "Error saving vehicle data" });
    }
});


export default router;
