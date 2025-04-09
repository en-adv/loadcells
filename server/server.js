import 'dotenv/config';
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js'; 
import priceRoutes from './routes/priceRoutes.js';
import diskonRoutes from './routes/diskonRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import thresholdRoutes from './routes/thresholdRoutes.js';
import psRoutes from './routes/psRoutes.js';
import spRoutes from './routes/spRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);  
app.use('/api/price', priceRoutes);
app.use("/api/discount", diskonRoutes);
app.use("/api", messageRoutes);
app.use("/api/threshold", thresholdRoutes);
app.use("/api/ps", psRoutes);
app.use('/api/sp', spRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB URI: ${process.env.MONGO_URI}`);
});
