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
            looseWeight: req.body.looseWeight,
            looseWeightPrice: req.body.looseWeightPrice,
            bunches: req.body.bunches,
            penalty: req.body.penalty,
            price: req.body.price,
            komidel: req.body.komidel,
            fruitType: req.body.fruitType,
            rejectedBunches: req.body.rejectedBunches,
            rejectedWeight: req.body.rejectedWeight
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
                looseWeightPrice: req.body.looseWeightPrice,
                bunches: req.body.bunches,
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

// Get totals by fruit type
router.get('/totals/by-fruit-type', async (req, res) => {
    try {
        const totals = await SP.aggregate([
            {
                $group: {
                    _id: '$fruitType',
                    totalNetWeight: { $sum: '$netWeight' },
                    totalNetWeightAmount: {
                        $sum: {
                            $multiply: ['$netWeight', '$netWeightPrice']
                        }
                    },
                    totalBunches: { $sum: '$bunches' },
                    totalRejectedBunches: { $sum: '$rejectedBunches' },
                    totalLooseWeight: { $sum: '$looseWeight' },
                    totalLooseWeightAmount: { 
                        $sum: { 
                            $multiply: ['$looseWeight', '$looseWeightPrice'] 
                        } 
                    },
                    totalRejectedWeight: { $sum: '$rejectedWeight' },
                    totalRejectedWeightAmount: {
                        $sum: {
                            $multiply: ['$rejectedWeight', '$rejectedWeightPrice']
                        }
                    }
                }
            }
        ]);
        
        res.json(totals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get total amounts
router.get('/totals/amounts', async (req, res) => {
    try {
        const totals = await SP.aggregate([
            {
                $group: {
                    _id: null,
                    totalNetWeightAmount: {
                        $sum: { $multiply: ['$netWeight', '$netWeightPrice'] }
                    },
                    totalLooseWeightAmount: {
                        $sum: { $multiply: ['$looseWeight', '$looseWeightPrice'] }
                    },
                    totalRejectedWeightAmount: {
                        $sum: { $multiply: ['$rejectedWeight', '$rejectedWeightPrice'] }
                    },
                    totalBunchesAmount: {
                        $sum: { $multiply: ['$bunches', '$komidel'] }
                    },
                    totalRejectedBunchesAmount: {
                        $sum: { $multiply: ['$rejectedBunches', '$komidel'] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalNetWeightAmount: 1,
                    totalLooseWeightAmount: 1,
                    totalRejectedWeightAmount: 1,
                    totalBunchesAmount: 1,
                    totalRejectedBunchesAmount: 1,
                    grandTotal: {
                        $subtract: [
                            {
                                $add: [
                                    '$totalNetWeightAmount',
                                    '$totalLooseWeightAmount',
                                    '$totalRejectedWeightAmount'
                                ]
                            },
                            {
                                $add: [
                                    '$totalBunchesAmount',
                                    '$totalRejectedBunchesAmount'
                                ]
                            }
                        ]
                    }
                }
            }
        ]);
        
        res.json(totals[0] || {
            totalNetWeightAmount: 0,
            totalLooseWeightAmount: 0,
            totalRejectedWeightAmount: 0,
            totalBunchesAmount: 0,
            totalRejectedBunchesAmount: 0,
            grandTotal: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get totals
router.get('/totals/summary', async (req, res) => {
    try {
        const totals = await SP.aggregate([
            {
                $group: {
                    _id: null,
                    totalNetWeight: { $sum: '$netWeight' },
                    totalLooseWeight: { $sum: '$looseWeight' },
                    totalBunches: { $sum: '$bunches' },
                    totalRejectedBunches: { $sum: '$rejectedBunches' },
                    totalRejectedWeight: { $sum: '$rejectedWeight' },
                    totalAmount: { $sum: '$total' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalNetWeight: 1,
                    totalLooseWeight: 1,
                    totalBunches: 1,
                    totalRejectedBunches: 1,
                    totalRejectedWeight: 1,
                    totalAmount: 1
                }
            }
        ]);
        
        res.json(totals[0] || {
            totalNetWeight: 0,
            totalLooseWeight: 0,
            totalBunches: 0,
            totalRejectedBunches: 0,
            totalRejectedWeight: 0,
            totalAmount: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 