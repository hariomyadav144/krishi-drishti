const express = require('express');
const router = express.Router();
const toolsController = require('../controllers/toolsController');

// Fertilizer Calculator API
router.post('/fertilizer-calc', toolsController.calculateFertilizer);

// Satellite NDVI Field Health Telemetry
router.get('/satellite-ndvi', toolsController.getSatelliteNDVI);

// Government Agricultural Schemes & Subsidies Registry
router.get('/schemes', toolsController.getGovtSchemes);

// Regional Pest Outbreak Radar
router.get('/outbreaks', toolsController.getOutbreakRadar);

module.exports = router;
