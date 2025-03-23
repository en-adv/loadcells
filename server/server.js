import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js'; 
import priceRoutes from './routes/priceRoutes.js';
import diskonRoutes from './routes/diskonRoutes.js';
import messageRoutes from './routes/messageRoutes.js';


const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);  
app.use('/api/price', priceRoutes);
app.use("/api/discount", diskonRoutes);
app.use("/api", messageRoutes);
;

app.listen(5000, () => console.log('Server running on port 5000'));
