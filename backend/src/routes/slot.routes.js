const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

router.post('/', async (req, res) => {
  try {
    const slot = await Slot.create(req.body);
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const slots = await Slot.find({ doctorId, date, isBooked: false });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;