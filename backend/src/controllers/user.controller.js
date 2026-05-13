const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * Upload doctor profile photo.
 * Expects multer to have already processed the file onto req.file.
 * Updates the Doctor document with the relative profilePhoto path.
 *
 * POST /api/users/doctor/:id/photo
 */
const uploadDoctorPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({ error: 'Profile photo upload is only available for doctors' });
    }

    // Store relative path for portability (served via express.static)
    const profilePhoto = `/uploads/profiles/${req.file.filename}`;

    // Upsert the Doctor document with the new photo
    await Doctor.findOneAndUpdate(
      { userId: id },
      { profilePhoto },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Profile photo uploaded successfully',
      profilePhoto,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let profile = user.toObject();
    if (user.role === 'doctor') {
      const doctorDetails = await Doctor.findOne({ userId: user._id });
      if (doctorDetails) {
        profile.specialty = doctorDetails.specialty;
        profile.availableDays = doctorDetails.availableDays;
      }
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    await user.save();
    res.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadDoctorPhoto,
  getProfile,
  updateProfile,
};
