const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

// Create a slot (doctor/admin use)
router.post('/', async (req, res) => {
  try {
    const slot = await Slot.create(req.body);
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available slots filtered by date (and optionally doctorId)
router.get('/', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const filter = { isBooked: false };
    if (doctorId) filter.doctorId = doctorId;
    if (date) filter.date = date;
    const slots = await Slot.find(filter).populate('doctorId', 'name specialty');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all slots for a doctor (their schedule)
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctorId: req.params.doctorId };
    if (date) filter.date = date;
    const slots = await Slot.find(filter)
      .populate('doctorId', 'name specialty')
      .populate('bookedBy', 'name')
      .sort({ startTime: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;