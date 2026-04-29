const User = require('../models/User');

/**
 * Upload doctor profile photo.
 * Expects multer to have already processed the file onto req.file.
 * Updates the user document with the relative profilePhoto path.
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
    user.profilePhoto = profilePhoto;
    await user.save();

    res.json({
      message: 'Profile photo uploaded successfully',
      profilePhoto,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadDoctorPhoto,
};
