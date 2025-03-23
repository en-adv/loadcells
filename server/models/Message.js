import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
    senderRole: String
});

const Message = mongoose.model("Message", messageSchema);
export default Message; // ✅ Use export default
