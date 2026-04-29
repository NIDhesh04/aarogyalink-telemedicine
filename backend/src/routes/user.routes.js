const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { upload } = require('../middleware/upload');
const { uploadDoctorPhoto } = require('../controllers/user.controller');
const router = express.Router();

// Get all doctors (join User + Doctor for specialty & photo)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'name email phone')
      .select('userId specialty availableDays profilePhoto');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload doctor profile photo
router.post('/doctor/:id/photo', upload.single('photo'), uploadDoctorPhoto);

module.exports = router;
