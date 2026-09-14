const express = require('express');
const router = express.Router();
const { completeOnboarding, getFarmerDashboard, getFarmInsights, getFields, saveField, deleteField } = require('../controllers/farmerController');
const { protect } = require('../middleware/auth');

router.post('/onboarding', protect, completeOnboarding);
router.get('/dashboard', protect, getFarmerDashboard);
router.get('/insights', protect, getFarmInsights);
router.get('/fields', protect, getFields);
router.post('/fields', protect, saveField);
router.delete('/fields/:id', protect, deleteField);

module.exports = router;
