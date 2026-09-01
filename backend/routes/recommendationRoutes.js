const express = require('express');
const router = express.Router();
const { askAdvisor, getRecommendations, getPredefinedQueries } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.post('/ask', protect, askAdvisor);
router.get('/', protect, getRecommendations);
router.get('/predefined-queries', getPredefinedQueries);

module.exports = router;
