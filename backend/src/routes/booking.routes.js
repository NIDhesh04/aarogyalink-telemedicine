const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const {
  createBooking,
  getDoctorQueue,
  getPatientQueuePosition,
  completeBooking,
  getPatientBookings,
  getAIPrescriptionSuggestion,
  cancelBooking,
} = require('../controllers/booking.controller');

// ─── GET /api/bookings?patientId=xxx ─── Patient only ────────────────────────
router.get('/', auth, checkRole(['patient', 'asha', 'admin']), getPatientBookings);

// ─── POST /api/bookings ─── Patient or ASHA ───────────────────────────────────
router.post('/', auth, checkRole(['patient', 'asha']), createBooking);

// ─── POST /api/bookings/ai-suggest ─── Doctor only ───────────────────────────
router.post('/ai-suggest', auth, checkRole(['doctor']), getAIPrescriptionSuggestion);

// ─── GET /api/bookings/queue/:doctorId ─── Doctor or Admin ───────────────────
router.get('/queue/:doctorId', auth, checkRole(['doctor', 'admin']), getDoctorQueue);

// ─── GET /api/bookings/position/:doctorId/:bookingId ─── Patient or ASHA ─────
router.get('/position/:doctorId/:bookingId', auth, checkRole(['patient', 'asha']), getPatientQueuePosition);

// ─── POST /api/bookings/complete/:bookingId ─── Doctor only ──────────────────
router.post('/complete/:bookingId', auth, checkRole(['doctor']), completeBooking);

// ─── PATCH /api/bookings/:id/cancel ─── Patient, ASHA, or Admin ──────────────
router.patch('/:id/cancel', auth, checkRole(['patient', 'asha', 'admin', 'doctor']), cancelBooking);

module.exports = router;