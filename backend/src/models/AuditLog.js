const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['booking_created', 'booking_cancelled', 'booking_completed', 'slot_created', 'user_registered'],
    required: true,
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // the booking this event relates to
  targetId:    { type: mongoose.Schema.Types.ObjectId },  // generic target (slot, user, etc.)
  metadata:    { type: mongoose.Schema.Types.Mixed },     // any extra info (doctorId, position, etc.)
  createdAt:   { type: Date, default: Date.now },
}, {
  // Audit logs are append-only — never updated. Disable versionKey.
  versionKey: false,
});

// Compound indexes — verified with explain() in explain_results.md
auditLogSchema.index({ bookingId: 1, createdAt: -1 });  // audit trail for a specific booking
auditLogSchema.index({ action: 1, createdAt: -1 });     // admin action-type filter
auditLogSchema.index({ performedBy: 1 });               // audit trail for a specific user

module.exports = mongoose.model('AuditLog', auditLogSchema);

