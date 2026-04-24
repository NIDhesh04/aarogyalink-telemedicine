const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const { client } = require('../config/redis');

// ─── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { slotId, patientId, symptomBrief } = req.body;
    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId))
      return res.status(400).json({ error: 'Invalid slotId' });
    if (!patientId)
      return res.status(400).json({ error: 'Missing patientId' });

    // Atomic: mark slot as booked only if it's still available (race-condition safe)
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true, bookedBy: patientId },
      { new: true }
    );
    if (!slot) return res.status(400).json({ error: 'Slot already booked or not found' });

    const booking = await Booking.create({
      slotId, patientId, doctorId: slot.doctorId,
      symptomBrief: symptomBrief || '',
    });

    // Add to Redis sorted queue (score = timestamp for FIFO order)
    await client.zAdd(`queue:${slot.doctorId}`, {
      score: Date.now(),
      value: booking._id.toString(),
    });

    // Get queue position immediately
    const queue = await client.zRange(`queue:${slot.doctorId}`, 0, -1);
    const position = queue.findIndex(id => id === booking._id.toString()) + 1;

    // Write audit log
    await AuditLog.create({
      action: 'booking_created',
      performedBy: patientId,
      targetId: booking._id,
      metadata: { doctorId: slot.doctorId, slotId, position },
    });

    res.status(201).json({ message: 'Booking successful', booking, queuePos: position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/bookings/queue/:doctorId ────────────────────────────────────────
router.get('/queue/:doctorId', async (req, res) => {
  try {
    const queue = await client.zRange(`queue:${req.params.doctorId}`, 0, -1);
    res.json({ queue, total: queue.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/bookings/position/:doctorId/:bookingId ─────────────────────────
router.get('/position/:doctorId/:bookingId', async (req, res) => {
  try {
    const { doctorId, bookingId } = req.params;
    const queue = await client.zRange(`queue:${doctorId}`, 0, -1);
    const index = queue.findIndex(id => id === bookingId);
    if (index === -1) return res.status(404).json({ message: 'Not found in queue' });
    res.json({ position: index + 1, patientsAhead: index, total: queue.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;