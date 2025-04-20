import express from 'express';
import SP from '../models/SPModel.js';

const router = express.Router();

// Get all SP entries
router.get('/', async (req, res) => {
    try {
        const entries = await SP.find().sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single SP entry
router.get('/:id', async (req, res) => {
    try {
        const sp = await SP.findById(req.params.id);
        
        if (!sp) {
            return res.status(404).json({ message: 'SP entry not found' });
        }
        
        res.json(sp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new SP entry
router.post('/', async (req, res) => {
    try {
        const newSP = new SP({
            docReference: req.body.docReference,
            vehicleId: req.body.vehicleId,
            weightIn: req.body.weightIn,
            weightOut: req.body.weightOut,
            looseWeight: req.body.looseWeight || 0,
            penalty: req.body.penalty || 0,
            price: req.body.price || 0,
            komidel: req.body.komidel,
            fruitType: req.body.fruitType,
            rejectedBunches: req.body.rejectedBunches || 0,
            rejectedWeight: req.body.rejectedWeight || 0
        });

        const savedSP = await newSP.save();
        res.status(201).json(savedSP);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update SP entry
router.put('/:id', async (req, res) => {
    try {
        const updatedSP = await SP.findByIdAndUpdate(
            req.params.id,
            {
                docReference: req.body.docReference,
                vehicleId: req.body.vehicleId,
                weightIn: req.body.weightIn,
                weightOut: req.body.weightOut,
                looseWeight: req.body.looseWeight,
                penalty: req.body.penalty,
                price: req.body.price,
                komidel: req.body.komidel,
                fruitType: req.body.fruitType,
                rejectedBunches: req.body.rejectedBunches,
                rejectedWeight: req.body.rejectedWeight
            },
            { new: true, runValidators: true }
        );

        if (!updatedSP) {
            return res.status(404).json({ message: 'SP entry not found' });
        }

        res.json(updatedSP);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete SP entry
router.delete('/:id', async (req, res) => {
    try {
        const deletedSP = await SP.findByIdAndDelete(req.params.id);
        
        if (!deletedSP) {
            return res.status(404).json({ message: 'SP entry not found' });
        }

        res.json({ message: 'SP entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search SP entries
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const spEntries = await SP.find({
            $or: [
                { docReference: { $regex: query, $options: 'i' } },
                { vehicleId: { $regex: query, $options: 'i' } }
            ]
        }).sort({ date: -1 });
        res.json(spEntries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get SP entries by date range
router.get('/date-range/:start/:end', async (req, res) => {
    try {
        const startDate = new Date(req.params.start);
        const endDate = new Date(req.params.end);
        
        const spEntries = await SP.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: -1 });
        
        res.json(spEntries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get totals summary
router.get('/totals/summary', async (req, res) => {
    try {
        const totals = await SP.aggregate([
            {
                $group: {
                    _id: null,
                    totalNetWeight: { $sum: '$netWeight' },
                    totalRejectedWeight: { $sum: '$rejectedWeight' },
                    totalPph: { $sum: '$pph' },
                    totalAmount: { $sum: '$total' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalNetWeight: 1,
                    totalRejectedWeight: 1,
                    totalPph: 1,
                    totalAmount: 1
                }
            }
        ]);
        
        res.json(totals[0] || {
            totalNetWeight: 0,
            totalRejectedWeight: 0,
            totalPph: 0,
            totalAmount: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 