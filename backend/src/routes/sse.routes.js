const express = require('express');
const router = express.Router();
const { client } = require('../config/redis');

/**
 * SSE: Real-time queue position for a specific booking
 * GET /api/sse/queue/:doctorId/:bookingId
 *
 * Streams events every 5 seconds:
 * data: { position, patientsAhead, total }
 */
router.get('/queue/:doctorId/:bookingId', (req, res) => {
  const { doctorId, bookingId } = req.params;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const sendPosition = async () => {
    try {
      const queue = await client.zRange(`queue:${doctorId}`, 0, -1);
      const index = queue.findIndex(id => id === bookingId);

      if (index === -1) {
        // No longer in queue (completed or cancelled)
        res.write(`data: ${JSON.stringify({ position: 0, patientsAhead: 0, total: queue.length, done: true })}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }

      const payload = {
        position: index + 1,
        patientsAhead: index,
        total: queue.length,
        done: false,
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Could not fetch queue' })}\n\n`);
    }
  };

  // Send immediately + then every 5 seconds
  sendPosition();
  const interval = setInterval(sendPosition, 5000);

  // Clean up when client disconnects
  req.on('close', () => clearInterval(interval));
});

/**
 * SSE: Live queue overview for a doctor
 * GET /api/sse/overview/:doctorId
 *
 * Useful for Doctor Dashboard to see queue shrink in real-time
 */
router.get('/overview/:doctorId', (req, res) => {
  const { doctorId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendOverview = async () => {
    try {
      const queue = await client.zRange(`queue:${doctorId}`, 0, -1, { REV: false });
      res.write(`data: ${JSON.stringify({ total: queue.length, queue })}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Could not fetch overview' })}\n\n`);
    }
  };

  sendOverview();
  const interval = setInterval(sendOverview, 5000);
  req.on('close', () => clearInterval(interval));
});

module.exports = router;
