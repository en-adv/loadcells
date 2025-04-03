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
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // One hour ago

        // Find the latest entry for the same plate number
        let vehicle = await Vehicle.findOne({ plateNumber }).sort({ date: -1 });

        if (vehicle) {
            const lastEntryTime = new Date(vehicle.date);

            if (type === "Bruto") {
                // Prevent updating Bruto if the last entry is within one hour
                if (lastEntryTime >= oneHourAgo) {
                    return res.status(400).json({ message: "Cannot update Bruto within one hour of the last entry." });
                }
                vehicle.bruto = weight;
            } else if (type === "Tar") {
                // Allow Tar update within one hour ONLY if Bruto exists but Tar is missing
                if (!vehicle.tar) {
                    vehicle.tar = weight;
                } else {
                    return res.status(400).json({ message: "Duplicate entry: Tar already exists." });
                }
            } else {
                return res.status(400).json({ message: "Invalid type. Use 'Bruto' or 'Tar'." });
            }
        } else {
            // Create a new entry if no record exists
            vehicle = new Vehicle({
                plateNumber,
                bruto: type === "Bruto" ? weight : null,
                tar: type === "Tar" ? weight : null,
                pricePerKg,
                discount,
                operator,
                date: now
            });
        }

        // Calculate Netto if both values exist
        const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
        vehicle.netto = netto;

        // Calculate final price with discount
        const totalPrice = netto * pricePerKg;
        const discountAmount = (totalPrice * discount) / 100;
        vehicle.totalPrice = totalPrice - discountAmount;

        // Save to database
        await vehicle.save();

        res.json({ message: "Vehicle saved successfully", vehicle });
    } catch (error) {
        console.error("Error saving vehicle:", error);
        res.status(500).json({ message: "Server error" });
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
