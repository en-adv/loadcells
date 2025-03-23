import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    plateNumber: { type: String, required: true, unique: true },
    bruto: { type: Number, default: null },
    tar: { type: Number, default: null },
    netto: { type: Number, default: null },
    pricePerKg: { type: Number, required: true, default: 0 },  
    totalPrice: { type: Number, default: 0 },  
    discount: { type: Number, default: 0 },
    operator: { type: String, required: true },
    date: { type: Date, default: Date.now } // ✅ Add date field with default value
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
