const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Slot"
  },
  patientId: String,
  doctorId: String,
  status: {
    type: String,
    default: "booked"
  },
  symptomBrief: String,
  prescriptionUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);