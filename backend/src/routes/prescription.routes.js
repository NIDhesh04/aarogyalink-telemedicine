const express = require('express');
const router = express.Router();
const { generatePrescription } = require('../controllers/prescription.controller');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

/**
 * POST /api/prescriptions
 * Manually trigger PDF prescription generation for a completed booking.
 * Doctor only — requires valid JWT with role 'doctor'.
 *
 * Body: { bookingId: "<ObjectId>" }
 * Response: 202 Accepted  →  PDF is generated in background via worker_threads
 */
router.post('/', auth, checkRole(['doctor', 'admin']), generatePrescription);

module.exports = router;
