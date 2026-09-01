const express = require('express');
const router = express.Router();
const { completeOnboarding, getFarmerDashboard, getFarmInsights } = require('../controllers/farmerController');
const { protect } = require('../middleware/auth');

router.post('/onboarding', protect, completeOnboarding);
router.get('/dashboard', protect, getFarmerDashboard);
router.get('/insights', protect, getFarmInsights);

module.exports = router;
