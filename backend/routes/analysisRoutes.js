const express = require('express');
const router = express.Router();
const { scanCrop, getAnalysisHistory, getAnalysisById } = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/scan', protect, upload.single('image'), scanCrop);
router.get('/history', protect, getAnalysisHistory);
router.get('/:id', protect, getAnalysisById);

module.exports = router;
