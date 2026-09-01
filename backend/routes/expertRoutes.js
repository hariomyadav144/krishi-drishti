const express = require('express');
const router = express.Router();
const { getExpertCases, submitPrescription } = require('../controllers/expertController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('expert', 'admin'));

router.get('/cases', getExpertCases);
router.post('/prescribe', submitPrescription);

module.exports = router;
