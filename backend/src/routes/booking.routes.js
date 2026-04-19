const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { client } = require('../config/redis');

router.post('/', async (req, res) => {
  try {
    const { slotId, patientId } = req.body;
    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId))
      return res.status(400).json({ error: 'Invalid slotId' });
    if (!patientId)
      return res.status(400).json({ error: 'Missing patientId' });

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true, bookedBy: patientId },
      { new: true }
    );
    if (!slot) return res.status(400).json({ error: 'Slot already booked' });

    const booking = await Booking.create({
      slotId, patientId, doctorId: slot.doctorId,
      symptomBrief: req.body.symptomBrief || ""
    });

    await client.zAdd(`queue:${slot.doctorId}`, {
      score: Date.now(), value: booking._id.toString()
    });

    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/queue/:doctorId', async (req, res) => {
  try {
    const queue = await client.zRange(`queue:${req.params.doctorId}`, 0, -1);
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/position/:doctorId/:bookingId', async (req, res) => {
  try {
    const { doctorId, bookingId } = req.params;
    const queue = await client.zRange(`queue:${doctorId}`, 0, -1);
    const position = queue.findIndex(id => id === bookingId);
    if (position === -1) return res.status(404).json({ message: "Not found in queue" });
    res.json({ patientsAhead: position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;