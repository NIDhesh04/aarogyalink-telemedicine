const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { validateEnv } = require('./config/env');
validateEnv(); // Fail fast if env vars are missing or malformed

const express = require('express');

const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();

// Route Imports
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sseRoutes = require('./routes/sse.routes');
const adminRoutes = require('./routes/admin.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const { errorHandler } = require('./middleware/errorHandler');

// Middleware

// ── Manual CORS middleware (Express 5 compatible — replaces cors npm package) ──
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://aarogyalink-telemedicine.vercel.app',
    'http://localhost:5173',
    'http://localhost:5005',
].filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin && origin.endsWith('.vercel.app')) {
        // Allow Vercel preview deployments
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Short-circuit preflight — respond immediately with 204 No Content
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.send('aarogyalink backend is running');
});

// Error Handling Middleware (Keep this at the bottom!)
app.use(errorHandler);

module.exports = app;