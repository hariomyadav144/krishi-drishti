const express = require('express');
const router = express.Router();
const { getCrops, addCrop, updateCrop, setActiveCrop, deleteCrop } = require('../controllers/cropController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCrops);
router.post('/', protect, addCrop);
router.put('/:id', protect, updateCrop);
router.put('/:id/set-active', protect, setActiveCrop);
router.delete('/:id', protect, deleteCrop);

module.exports = router;
