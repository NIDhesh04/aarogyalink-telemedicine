const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const {
  createBooking,
  getDoctorQueue,
  getPatientQueuePosition,
  completeBooking,
} = require('../controllers/booking.controller');

// ─── POST /api/bookings ───────────────────────────────────────────────────────
// Only patients and ASHA workers can create bookings
router.post('/', auth, checkRole(['patient', 'asha']), createBooking);

// ─── GET /api/bookings/queue/:doctorId ────────────────────────────────────────
// Only doctors and admins can view the full queue
router.get('/queue/:doctorId', auth, checkRole(['doctor', 'admin']), getDoctorQueue);

// ─── GET /api/bookings/position/:doctorId/:bookingId ─────────────────────────
// Any authenticated user can check a queue position
router.get('/position/:doctorId/:bookingId', auth, getPatientQueuePosition);

// ─── POST /api/bookings/complete/:bookingId ──────────────────────────────────
// Only doctors can complete a booking (triggers PDF generation)
router.post('/complete/:bookingId', auth, checkRole(['doctor']), completeBooking);

module.exports = router;