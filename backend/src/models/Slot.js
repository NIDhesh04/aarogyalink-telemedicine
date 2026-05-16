const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },  // Store as 'YYYY-MM-DD' for easy querying
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  time: { type: String }, // Display string e.g. "10:00 AM"
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

slotSchema.index({ doctorId: 1, date: 1, isBooked: 1 });

module.exports = mongoose.model("Slot", slotSchema);