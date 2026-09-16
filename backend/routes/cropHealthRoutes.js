const express = require('express');
const router = express.Router();
const {
  getLatestCropHealth,
  getCropHealthSummary,
  getCropHealthHistory,
  recalculateCropHealth
} = require('../controllers/cropHealthController');
const { protect } = require('../middleware/auth');

// Multi-field summary
router.get('/summary', protect, getCropHealthSummary);

// Time-series history
router.get('/history/:fieldId', protect, getCropHealthHistory);

// Recalculate
router.post('/recalculate/:fieldId?', protect, recalculateCropHealth);

// Latest snapshot (supports /latest or /latest/:fieldId)
router.get('/latest/:fieldId?', protect, getLatestCropHealth);
router.get('/:fieldId?', protect, getLatestCropHealth);

module.exports = router;
