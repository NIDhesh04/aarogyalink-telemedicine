const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');

router.post('/', async (req, res) => {
  try {
    const { slotId, patientId } = req.body;

    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({ error: 'Invalid slotId. Expected a valid MongoDB ObjectId.' });
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Missing patientId in request body.' });
    }

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true, bookedBy: patientId },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ error: 'Slot not found or already booked' });
    }

    const booking = await Booking.create({
      slotId,
      patientId,
      doctorId: slot.doctorId,
      symptomBrief: "dummy symptoms" // later AI will replace
    });

    res.json({
      message: "Booking successful",
      booking
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;