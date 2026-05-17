const express = require('express');
const router = express.Router();
const queueSSEManager = require('../services/sse/queue.sse');

/**
 * SSE: Real-time queue position for a specific booking
 * GET /api/sse/queue/:doctorId/:bookingId
 */
router.get('/queue/:doctorId/:bookingId', (req, res) => {
  const { doctorId, bookingId } = req.params;
  queueSSEManager.addClient(doctorId, bookingId, res);
});

/**
 * SSE: Live queue overview for a doctor
 * GET /api/sse/overview/:doctorId
 */
router.get('/overview/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  queueSSEManager.addClient(doctorId, 'doctor', res);
});

module.exports = router;

