import mongoose from "mongoose";

const DiskonSchema = new mongoose.Schema({
    discount: { type: Number, required: true },
    from: { type: String, required: true, unique: true } // Unique for each operator
});

export default mongoose.model("Diskon", DiskonSchema);
