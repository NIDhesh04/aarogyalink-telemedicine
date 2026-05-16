const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { validateEnv } = require('./config/env');
validateEnv(); // Fail fast if env vars are missing or malformed

const express = require('express');
const cors = require('cors');
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
const { errorHandler } = require('./middleware/errorHandler');

// Middleware

// ── CORS must come FIRST (before helmet) so preflight OPTIONS get the right headers ──
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5005',
    process.env.FRONTEND_URL,                          // Set on Railway if needed
    'https://aarogyalink-telemedicine.vercel.app',     // Vercel production
].filter(Boolean); // Remove undefined entries

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Also allow any *.vercel.app preview deploys
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        callback(null, true); // Allow all for now — tighten in production if needed
    },
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },  // Allow cross-origin resource loading
    crossOriginEmbedderPolicy: false,                        // Don't block cross-origin embeds
}));
app.use(morgan('dev'));                      // HTTP request logging (colored status codes)
app.use(express.json());
app.use(cookieParser());                    // Parse cookies (needed for JWT refresh token)
app.use(express.static(path.join(__dirname, '../public'))); // Serve uploads & prescriptions

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.send('aarogyalink backend is running');
});

// Error Handling Middleware (Keep this at the bottom!)
app.use(errorHandler);

module.exports = app;