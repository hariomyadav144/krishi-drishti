const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackStats } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

router.post('/', protect, submitFeedback);
router.get('/stats', getFeedbackStats);

module.exports = router;
