const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const { client } = require('../config/redis');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');


// Create a slot — Doctor or Admin only
router.post('/', auth, checkRole(['doctor', 'admin']), async (req, res) => {
  try {
    const slot = await Slot.create(req.body);
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available slots filtered by date (and optionally doctorId)
router.get('/', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const cacheKey = `slots:${doctorId || 'all'}:${date || 'any'}`;

    // 1. Check Redis Cache
    const cachedSlots = await client.get(cacheKey);
    if (cachedSlots) {
      console.log('Serving slots from Redis cache');
      return res.json(JSON.parse(cachedSlots));
    }

    const filter = { isBooked: false };
    if (doctorId) filter.doctorId = doctorId;
    if (date) filter.date = date;
    
    // 2. Fetch from DB
    const slots = await Slot.find(filter).populate('doctorId', 'name specialty');
    
    // 3. Save to Redis (expire in 5 minutes)
    await client.set(cacheKey, JSON.stringify(slots), { EX: 300 });
    
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all slots for a doctor (their schedule)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctorId: req.params.doctorId };
    if (date) filter.date = date;
    const slots = await Slot.find(filter)
      .populate('doctorId', 'name specialty')
      .populate('bookedBy', 'name')
      .sort({ startTime: 1 })
      .lean();
      
    // Attach booking data so doctor sees AI brief and can complete the session
    const Booking = require('../models/Booking');
    for (let slot of slots) {
      if (slot.isBooked) {
        const booking = await Booking.findOne({ slotId: slot._id }).sort({ createdAt: -1 });
        if (booking) {
          slot.bookingId = booking._id;
          slot.symptomBrief = booking.symptomBrief;
          slot.bookingStatus = booking.status; // 'booked', 'completed'
        }
      }
    }
    
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;