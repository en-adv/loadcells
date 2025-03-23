import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Price from '../models/Price.js';
import Diskon from '../models/Diskon.js'; // Import discount model

const router = express.Router();

// Get all vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Store or update vehicle data
router.post("/", async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        const { plateNumber, weight, type, pricePerKg, discount, operator } = req.body;

        let vehicle = await Vehicle.findOne({ plateNumber });

        if (vehicle) {
            if (type === "Bruto") {
                vehicle.bruto = weight;
            } else if (type === "Tar") {
                vehicle.tar = weight;
            }
            vehicle.discount = discount;
            vehicle.date = new Date(); // ✅ Update date whenever a record is modified
        } else {
            vehicle = new Vehicle({
                plateNumber,
                bruto: type === "Bruto" ? weight : null,
                tar: type === "Tar" ? weight : null,
                pricePerKg,
                discount,
                operator,
                date: new Date() // ✅ Ensure new records get a timestamp
            });
        }

        const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
        vehicle.netto = netto;

        const totalPrice = netto * pricePerKg;
        const discountAmount = (totalPrice * discount) / 100;
        const finalPrice = totalPrice - discountAmount;

        vehicle.totalPrice = finalPrice;
        await vehicle.save();

        res.json({ message: "Vehicle saved successfully", vehicle });
    } catch (error) {
        console.error("Error saving vehicle:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Update a vehicle by ID
router.put("/:id", async (req, res) => {
    try {
        const { plateNumber, bruto, tar, pricePerKg, discount } = req.body;
        const netto = bruto - tar;
        const totalPrice = netto * pricePerKg * ((100 - discount) / 100); // Apply discount

        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { plateNumber, bruto, tar, pricePerKg, discount, totalPrice },
            { new: true }
        );

        res.json(updatedVehicle);
    } catch (err) {
        res.status(500).json({ error: "Failed to update vehicle" });
    }
});

// ✅ Delete a vehicle by ID
router.delete("/:id", async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: "Vehicle deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete vehicle" });
    }
});



export default router;
