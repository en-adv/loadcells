import mongoose from "mongoose";

const psSchema = new mongoose.Schema({
    plateNumber: { type: String, required: true },
    bruto: { type: Number, required: true },
    tar: { type: Number, required: true },
    nettoGross: { type: Number, required: true },
    discount: { type: Number, required: true },
    nettoBersih: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    bongkar: { type: Number, required: true },
    muat: { type: Number, required: true },
    pph: { type: Number, required: true },
    total: { type: Number, required: true },
    operator: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

export default mongoose.model("Ps", psSchema);