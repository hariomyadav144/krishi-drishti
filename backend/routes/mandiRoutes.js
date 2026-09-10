const express = require('express');
const router = express.Router();
const mandiController = require('../controllers/mandiController');

// Official Mandi Rates routes (supports both /api/mandi-rates and /api/mandi)
router.get('/', mandiController.getMandiRates);
router.get('/prices', mandiController.getAllMandiPrices);
router.get('/nearby', mandiController.getNearbyRates);
router.get('/master', mandiController.getMasterMandiData);
router.get('/prices/:id', mandiController.getMandiPriceById);

module.exports = router;
