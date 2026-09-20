const express = require('express');
const router = express.Router();
const {
  getLatestObservation,
  triggerMonitoringRun,
  getFieldHistory,
  compareFieldObservations,
  uploadSoilTest,
  getMonitoringDashboardSummary,
  markAlertRead,
  getFieldActions,
  updateActionStatus,
  ingestFieldTelemetry
} = require('../controllers/fieldMonitoringController');
const { protect } = require('../middleware/auth');

// Preflight handler
router.options('*', (req, res) => res.sendStatus(204));

// Dashboard summary of all farmer fields
router.get('/dashboard-summary', protect, getMonitoringDashboardSummary);

// Latest monitoring observation for a field (runs automatically if none exists)
router.get('/latest/:fieldId', protect, getLatestObservation);

// Force refresh or run pipeline for a field
router.post('/run/:fieldId', protect, triggerMonitoringRun);

// Multi-temporal history for graphs
router.get('/history/:fieldId', protect, getFieldHistory);

// Comparison (Today vs 7d / 15d / 30d / previous)
router.get('/compare/:fieldId', protect, compareFieldObservations);

// Permanent soil test linkage
router.post('/soil-test/:fieldId', protect, uploadSoilTest);

// Alert acknowledge
router.put('/alert/:alertId/read', protect, markAlertRead);

// Field action loop: list actions and update status (completed/in_progress)
router.get('/actions/:fieldId?', protect, getFieldActions);
router.post('/action/:actionId/status', protect, updateActionStatus);

// Ingest IoT soil sensor & ambient telemetry
router.post('/telemetry/:fieldId', ingestFieldTelemetry);

module.exports = router;
