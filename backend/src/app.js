const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const app = express();

const dbconnect = require('./config/db');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const sseRoutes = require('./routes/sse.routes');
const adminRoutes = require('./routes/admin.routes');

// Only connect to MongoDB for now
dbconnect();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('✅ AarogyaLink Backend Running (Redis Disabled Temporarily)');
});

// Error Handler
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;