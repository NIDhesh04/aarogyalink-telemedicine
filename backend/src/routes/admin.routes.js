const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// Apply auth + admin role to ALL routes in this file
router.use(auth, checkRole(['admin']));

/**
 * GET /api/admin/analytics
 * Weekly booking counts using MongoDB aggregation pipeline
 */
router.get('/analytics', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Fill in missing days with 0
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const found = weeklyBookings.find(b => b.date === d);
      result.push({ date: d, day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d).getDay()], count: found?.count ?? 0 });
    }

    res.json({ weeklyBookings: result, total: result.reduce((a, b) => a + b.count, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/schedule/:doctorId
 * Daily schedule report using aggregation (slots + bookings joined)
 */
router.get('/schedule/:doctorId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const report = await Booking.aggregate([
      {
        $lookup: {
          from: 'slots',
          localField: 'slotId',
          foreignField: '_id',
          as: 'slot',
        }
      },
      { $unwind: '$slot' },
      { $match: { 'slot.doctorId': require('mongoose').Types.ObjectId.createFromHexString(req.params.doctorId), 'slot.date': today } },
      {
        $lookup: {
          from: 'users',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient',
        }
      },
      { $unwind: '$patient' },
      {
        $project: {
          slotTime: '$slot.time',
          patientName: '$patient.name',
          symptomBrief: 1,
          status: 1,
          createdAt: 1,
        }
      },
      { $sort: { slotTime: 1 } },
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/audit-log
 * Recent audit log entries
 */
router.get('/audit-log', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/stats
 * High-level platform stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalDoctors, totalBookings, completedToday] = await Promise.all([
      User.countDocuments({ role: 'doctor' }),
      Booking.countDocuments(),
      Booking.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: 'completed',
      }),
    ]);
    res.json({ totalDoctors, totalBookings, completedToday });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
