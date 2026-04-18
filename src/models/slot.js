const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  date: String,
  startTime: String,
  endTime: String,
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("Slot", slotSchema);