const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();
const dbconnect = require('./config/db');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');

// Database and Redis Connections
dbconnect();    
connectRedis();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL for Vite
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
    res.send('aarogyalink backend is running')
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
