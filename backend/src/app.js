const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { validateEnv } = require('./config/env');
validateEnv(); // Fail fast if env vars are missing or malformed

const express = require('express');
const cors = require('cors');
const app = express();

// Route Imports
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sseRoutes = require('./routes/sse.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler } = require('./middleware/errorHandler');

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve uploads & prescriptions

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('aarogyalink backend is running');
});

// Error Handling Middleware (Keep this at the bottom!)
app.use(errorHandler);

module.exports = app;