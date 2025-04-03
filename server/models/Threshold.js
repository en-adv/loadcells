import mongoose from "mongoose";

const thresholdSchema = new mongoose.Schema({
    operator: { type: String, required: true },
    date: { type: String, required: true }, // Store as YYYY-MM-DD
    lastThreshold: { type: Number, required: true }
});

const Threshold = mongoose.model("Threshold", thresholdSchema);
export default Threshold;
