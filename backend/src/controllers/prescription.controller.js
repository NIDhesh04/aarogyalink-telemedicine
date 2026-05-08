const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { addPDFJob } = require('../services/queue/pdf.queue');

/**
 * POST /api/prescriptions
 * Manually triggers PDF generation for a completed booking.
 * Returns 202 Accepted — the PDF is generated asynchronously
 * by the worker_threads pipeline (pdf.worker.js → pdf.thread.js).
 *
 * Teammate 3 (Infrastructure)
 */
const generatePrescription = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // ── Validate input ─────────────────────────────────────────
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'A valid bookingId is required.' });
    }

    // ── Fetch booking with populated refs ───────────────────────
    const booking = await Booking.findById(bookingId)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // ── Only completed consultations can have prescriptions ────
    if (booking.status !== 'completed') {
      return res.status(400).json({
        error: `Booking status is "${booking.status}". Only completed bookings can generate a prescription PDF.`,
      });
    }

    if (!booking.prescription) {
      return res.status(400).json({
        error: 'No prescription text found on this booking. The doctor must write a prescription first.',
      });
    }

    // ── Queue the PDF job (BullMQ → worker_threads) ────────────
    await addPDFJob({
      bookingId: booking._id,
      patientName: booking.patientId?.name || 'Patient',
      doctorName: booking.doctorId?.name || 'Doctor',
      symptomBrief: booking.symptomBrief || '',
      prescription: booking.prescription,
    });

    // 202 = "I accepted your request; the work happens in the background"
    res.status(202).json({
      message: 'PDF generation has been queued.',
      bookingId: booking._id,
    });
  } catch (err) {
    console.error('Prescription Controller Error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  generatePrescription,
};
