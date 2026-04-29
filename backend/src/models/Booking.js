const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["booked", "completed", "cancelled"], default: "booked" },
  symptomBrief: String,
  prescription: String,
  prescriptionUrl: String
}, { timestamps: true });

// Compound indexes for query performance
bookingSchema.index({ patientId: 1, createdAt: -1 }); // Patient booking history
bookingSchema.index({ doctorId: 1, status: 1 });       // Doctor's pending consultation list

module.exports = mongoose.model("Booking", bookingSchema);