const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const reviewController = require('../controllers/review.controller');

// Only patients can submit reviews
router.post('/', auth, checkRole(['patient']), reviewController.createReview);

// Anyone logged in can see a doctor's reviews
router.get('/doctor/:doctorId', auth, reviewController.getDoctorReviews);

module.exports = router;
