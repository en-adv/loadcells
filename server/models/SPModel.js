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
    },
    pph: {
        type: Number,
        default: 0
    }
});

// Updated calculation logic to match Pabrik Dashboard
SPSchema.pre(['save', 'updateOne', 'findOneAndUpdate'], function(next) {
    const update = this.getUpdate ? this.getUpdate() : this;
    
    // Calculate netGross = Weight In - Weight Out
    if (update.weightIn !== undefined && update.weightOut !== undefined) {
        update.netGross = update.weightIn - update.weightOut;
    }
    
    // Calculate netWeight = Net Gross - Penalty
    if (update.netGross !== undefined) {
        update.netWeight = update.netGross - (update.penalty || 0);
    }

    // Calculate PPH (0.25% of net amount)
    const netAmount = (update.netWeight || 0) * (update.price || 0);
    update.pph = netAmount * 0.0025;

    // Calculate total = (Net Weight × Price) - (Rejected Weight × 8) - (Net Gross × 16) - PPH (0.25%)
    const rejectedDeduction = (update.rejectedWeight || 0) * 8;
    const netGrossDeduction = (update.netGross || 0) * 16;

    update.total = netAmount - rejectedDeduction - netGrossDeduction - update.pph;
    
    next();
});

const SP = mongoose.model('SP', SPSchema);

export default SP; 