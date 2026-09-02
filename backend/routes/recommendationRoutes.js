const express = require('express');
const router = express.Router();
const { askAdvisor, getRecommendations, getPredefinedQueries } = require('../controllers/recommendationController');
const { protect, optionalProtect } = require('../middleware/auth');

router.post('/ask', optionalProtect, askAdvisor);
router.get('/', protect, getRecommendations);
router.get('/predefined-queries', getPredefinedQueries);

module.exports = router;
