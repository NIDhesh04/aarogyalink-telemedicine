const express = require('express');
const router = express.Router();
const {
  createBooking,
  getDoctorQueue,
  getPatientQueuePosition,
  completeBooking,
} = require('../controllers/booking.controller');

// ─── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', createBooking);

// ─── GET /api/bookings/queue/:doctorId ────────────────────────────────────────
router.get('/queue/:doctorId', getDoctorQueue);

// ─── GET /api/bookings/position/:doctorId/:bookingId ─────────────────────────
router.get('/position/:doctorId/:bookingId', getPatientQueuePosition);

// ─── POST /api/bookings/complete/:bookingId ──────────────────────────────────
router.post('/complete/:bookingId', completeBooking);

module.exports = router;