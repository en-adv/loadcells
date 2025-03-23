import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ User Login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role }, // ✅ Add `username`
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ (Optional) Register a new user
router.post("/register", async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();

        res.json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
