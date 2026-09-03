const express = require('express');
const router = express.Router();
const { scanCrop, getAnalysisHistory, getAnalysisById } = require('../controllers/analysisController');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.options('*', (req, res) => res.sendStatus(204));
router.post('/scan', optionalProtect, upload.single('image'), scanCrop);
router.get('/history', protect, getAnalysisHistory);
router.get('/:id', protect, getAnalysisById);

module.exports = router;
