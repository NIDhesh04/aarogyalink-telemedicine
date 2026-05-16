const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const { client } = require('../config/redis');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { isSlotInPast } = require('../utils/helpers');


// Create a slot — Doctor or Admin only
router.post('/', auth, checkRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { date, startTime } = req.body;

    // Reject slots whose date+time has already passed
    if (isSlotInPast(date, startTime)) {
      return res.status(400).json({
        error: 'Cannot create a slot for a time that has already passed.'
      });
    }

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
      // Filter out past-time slots from cached results
      const parsed = JSON.parse(cachedSlots).filter(
        s => !isSlotInPast(s.date, s.startTime)
      );
      return res.json(parsed);
    }

    const filter = { isBooked: false };
    if (doctorId) filter.doctorId = doctorId;
    if (date) filter.date = date;
    
    // 2. Fetch from DB
    const slots = await Slot.find(filter).populate('doctorId', 'name specialty');
    
    // 3. Save to Redis (expire in 5 minutes)
    await client.set(cacheKey, JSON.stringify(slots), { EX: 300 });
    
    // 4. Filter out slots whose time has already passed before responding
    const activeSlots = slots.filter(s => !isSlotInPast(s.date, s.startTime));
    
    res.json(activeSlots);
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