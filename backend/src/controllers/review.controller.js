const Review = require('../models/Review');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

exports.createReview = async (req, res) => {
  try {
    const { bookingId, doctorId, rating, comment } = req.body;
    const patientId = req.user.id; // from auth middleware

    // Verify booking belongs to patient and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.patientId.toString() !== patientId) return res.status(403).json({ error: 'Not authorized' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed appointments' });

    // Check if review already exists
    const existing = await Review.findOne({ bookingId });
    if (existing) return res.status(400).json({ error: 'Review already submitted for this appointment' });

    const review = await Review.create({
      bookingId,
      doctorId,
      patientId,
      rating,
      comment
    });

    await AuditLog.create({
      action: 'review_submitted',
      performedBy: patientId,
      bookingId: bookingId,
      targetId: doctorId,
      metadata: { rating, comment }
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Get all reviews and populate patient name
    const reviews = await Review.find({ doctorId })
      .sort({ createdAt: -1 })
      .populate('patientId', 'name')
      .lean();

    // Calculate average
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.json({
      average: Number(average),
      count: reviews.length,
      reviews
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
