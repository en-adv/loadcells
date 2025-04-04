import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now }, // ⏰ Gunakan tipe Date
    price: { type: Number, required: true },
    operator: { type: String, required: true } 
});

export default mongoose.model("Price", PriceSchema);
