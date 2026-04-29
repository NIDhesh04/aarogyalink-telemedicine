const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  specialty: { type: String, required: true },
  availableDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: [],
  },
  profilePhoto: { type: String, default: null },
}, { timestamps: true });

doctorSchema.index({ userId: 1 }, { unique: true });
doctorSchema.index({ specialty: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
