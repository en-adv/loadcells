import mongoose from 'mongoose';

const SPSchema = new mongoose.Schema({
    docReference: {
        type: String,
        required: true
    },
    vehicleId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    weightIn: {
        type: Number,
        required: true
    },
    weightOut: {
        type: Number,
        required: true
    },
    netGross: {
        type: Number,
        default: 0
    },
    looseWeight: {
        type: Number,
        default: 0
    },
    looseWeightPrice: {
        type: Number,
        default: 0
    },
    bunches: {
        type: Number,
        default: 0
    },
    penalty: {
        type: Number,
        default: 0
    },
    netWeight: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    komidel: {
        type: Number,
        required: true
    },
    fruitType: {
        type: String,
        required: true,
        enum: ['Buah Besar', 'Buah Kecil', 'Buah Super']
    },
    rejectedBunches: {
        type: Number,
        default: 0
    },
    rejectedWeight: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    }
});

// Calculate netGross, netWeight, and total before saving or updating
SPSchema.pre(['save', 'updateOne', 'findOneAndUpdate'], function(next) {
    // If this is an update operation, get the update object
    const update = this.getUpdate ? this.getUpdate() : this;
    
    // Calculate netGross = Weight In - Weight Out
    if (update.weightIn !== undefined && update.weightOut !== undefined) {
        update.netGross = update.weightIn - update.weightOut;
    }
    
    // Calculate netWeight = Net Gross - Penalty
    if (update.netGross !== undefined) {
        update.netWeight = update.netGross - (update.penalty || 0);
    }

    // Calculate total = (Net Weight × Price) + (Loose Weight × Loose Weight Price) - (Bunches × 16) - (Rejected Bunches × 8)
    const netWeightAmount = (update.netWeight || 0) * (update.price || 0);
    const looseWeightAmount = (update.looseWeight || 0) * (update.looseWeightPrice || 0);
    const bunchesAmount = (update.bunches || 0) * 16;
    const rejectedBunchesAmount = (update.rejectedBunches || 0) * 8;

    update.total = netWeightAmount + looseWeightAmount - bunchesAmount - rejectedBunchesAmount;
    
    next();
});

const SP = mongoose.model('SP', SPSchema);

export default SP; 