import express from 'express';
import Vehicle from '../models/Vehicle.js';

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

router.post("/", async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        const { plateNumber, bruto, tar, pricePerKg, discount, operator} = req.body;
        const now = new Date();

        // Handle input bersamaan dari Pabrik
        if (operator === "Pabrik" && bruto && tar) {
            const netto = bruto - tar;
            const potongannetto = (netto * discount) / 100;
            const nettobersih = Math.round(netto - potongannetto);
            const totalPrice = nettobersih * pricePerKg;

            const vehicle = new Vehicle({
                plateNumber,
                bruto,
                tar,
                netto,
                nettobersih,
                totalPrice,
                pricePerKg,
                discount,
                operator,
                date: now,
            });

            await vehicle.save();
            return res.json({ message: "Data kendaraan berhasil disimpan (Pabrik mode)", vehicle });
        }

        // --------- Logika lama ---------
        const { weight, type } = req.body;
        const oneHourAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        let vehicle = await Vehicle.findOne({ plateNumber }).sort({ date: -1 });

        if (vehicle) {
            const lastEntryTime = new Date(vehicle.date);

            if (type === "Bruto") {
                if (lastEntryTime >= oneHourAgo) {
                    return res.status(400).json({ message: "Tidak bisa mengupdate Bruto dalam 1 jam terakhir." });
                }
                vehicle.bruto = weight;
            } else if (type === "Tar") {
                if (!vehicle.tar) {
                    vehicle.tar = weight;
                } else {
                    return res.status(400).json({ message: "Tar sudah ada, tidak bisa diupdate lagi." });
                }
            } else {
                return res.status(400).json({ message: "Tipe tidak valid. Gunakan 'Bruto' atau 'Tar'." });
            }
        } else {
            // Jika belum ada kendaraan, buat baru
            vehicle = new Vehicle({
                plateNumber,
                bruto: type === "Bruto" ? weight : null,
                tar: type === "Tar" ? weight : null,
                pricePerKg,
                discount,
                operator,
                date: now,
            });
        }

        // Hitung jika kedua nilai sudah ada
        const netto = vehicle.bruto && vehicle.tar ? vehicle.bruto - vehicle.tar : 0;
        const potongannetto = (netto * vehicle.discount) / 100;
        const nettobersih = Math.round(netto - potongannetto);
        
        vehicle.netto = netto;
        vehicle.nettobersih = nettobersih;
        vehicle.totalPrice = vehicle.nettobersih * vehicle.pricePerKg;


        await vehicle.save();
        res.json({ message: "Data kendaraan berhasil disimpan", vehicle });

    } catch (error) {
        console.error("Error saving vehicle:", error);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// Update a vehicle by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // supaya hasilnya adalah data yang sudah diperbarui
        });

        if (!updatedVehicle) {
            return res.status(404).json({ error: "Kendaraan tidak ditemukan" });
        }

        res.json(updatedVehicle);
    } catch (error) {
        console.error("Error saat update kendaraan:", error);
        res.status(500).json({ error: "Server error saat update kendaraan" });
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

router.delete("/", async (req, res) => {
    try {
        await Vehicle.deleteMany({}); // Deletes all documents in the vehicles collection
        res.json({ message: "Semua data kendaraan berhasil dihapus!" });
    } catch (err) {
        res.status(500).json({ error: "Terjadi kesalahan saat menghapus data." });
    }
});



export default router;
