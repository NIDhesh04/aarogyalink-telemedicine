const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  markAllRead,
  markOneRead,
} = require('../controllers/notification.controller');

// GET    /api/notifications          — fetch paginated history
// PATCH  /api/notifications/read-all — mark all as read
// PATCH  /api/notifications/:id/read — mark one as read
router.get('/',           auth, getNotifications);
router.patch('/read-all', auth, markAllRead);
router.patch('/:id/read', auth, markOneRead);

module.exports = router;
