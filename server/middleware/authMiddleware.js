import jwt from "jsonwebtoken";

export default (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.status(403).json({ message: "Access denied" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Verified JWT payload:", verified); // ✅ Debugging line
        req.user = verified; // ✅ Now includes username
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token" });
    }
};
