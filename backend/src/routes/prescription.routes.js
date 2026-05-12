const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { generatePrescription } = require('../controllers/prescription.controller');

/**
 * POST /api/prescriptions
 * Manually trigger PDF prescription generation for a completed booking.
 *
 * Body: { bookingId: "<ObjectId>" }
 * Response: 202 Accepted  →  PDF is generated in background via worker_threads
 *
 * Teammate 3 (Infrastructure)
 */
router.post('/', auth, checkRole(['doctor']), generatePrescription);

module.exports = router;
