import mongoose from 'mongoose';

const PriceSchema = new mongoose.Schema({
    date: { type: String, required: true }, // e.g., "15-3-2025"
    price: { type: Number, required: true } // e.g., 3500
});
export default mongoose.model('price', PriceSchema);