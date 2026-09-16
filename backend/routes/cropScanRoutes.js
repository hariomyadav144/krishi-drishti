const express = require('express');
const router = express.Router();
const {
  createCropScan,
  getCropScans,
  getCropScanById,
  compareCropScans,
  getCropTimeline,
  deleteCropScan,
  getCropHistoryStats
} = require('../controllers/cropScanController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Preflight handler
router.options('*', (req, res) => res.sendStatus(204));

// Specific endpoints first
router.post('/', protect, upload.single('image'), createCropScan);
router.get('/', protect, getCropScans);
router.get('/stats', protect, getCropHistoryStats);
router.post('/compare', protect, compareCropScans);
router.get('/timeline/:cropName', protect, getCropTimeline);
router.delete('/:scanId', protect, deleteCropScan);
router.get('/detail/:scanId', protect, getCropScanById);

// Farmer-specific route signatures
router.get('/:farmerId', protect, getCropScans);
router.get('/:farmerId/:cropOrScanId', protect, (req, res, next) => {
  const param = req.params.cropOrScanId;
  if (/^[0-9a-fA-F]{24}$/.test(param) || param.startsWith('scan_')) {
    req.params.scanId = param;
    return getCropScanById(req, res, next);
  }
  req.params.cropName = param;
  return getCropScans(req, res, next);
});

module.exports = router;
