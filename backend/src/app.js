const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const dbconnect = require('./config/db');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');

// Database and Redis Connections
dbconnect();    
connectRedis();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
    res.send('aarogyalink backend is running')
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
