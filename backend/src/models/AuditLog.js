const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['booking_created', 'booking_cancelled', 'booking_completed', 'slot_created', 'user_registered'],
    required: true,
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // bookingId, slotId, etc.
  metadata: { type: mongoose.Schema.Types.Mixed },    // any extra info
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
