const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, markAllRead } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAlerts);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
