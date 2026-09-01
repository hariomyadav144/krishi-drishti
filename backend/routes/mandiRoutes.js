const express = require('express');
const router = express.Router();
const mandiController = require('../controllers/mandiController');

// Public route to view live APMC mandi prices
router.get('/prices', mandiController.getAllMandiPrices);
router.get('/prices/:id', mandiController.getMandiPriceById);

module.exports = router;
