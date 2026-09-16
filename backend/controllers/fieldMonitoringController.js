const Field = require('../models/Field');
const FieldMonitoringObservation = require('../models/FieldMonitoringObservation');
const FieldAlert = require('../models/FieldAlert');
const { runFieldMonitoringPipeline } = require('../services/fieldMonitoringService');
const {
  isDbConnected,
  getStatelessFields,
  getStatelessLatestObservation,
  getStatelessFieldMonitoringSummary,
  getStatelessFieldHistory,
  getStatelessCompareObservations,
  addStatelessSoilTest
} = require('../utils/statelessStore');

/**
 * Krishi Drishti - Field Monitoring Controller
 * Handles continuous autonomous monitoring, historical comparison, soil test linkage,
 * and proactive multi-indicator summaries.
 */

// Helper to check field ownership
async function getFarmerField(fieldId, userId) {
  if (!isDbConnected()) {
    const fields = getStatelessFields(userId);
    return fields.find(f => f._id === fieldId || f.id === fieldId) || fields[0] || null;
  }
  const field = await Field.findOne({
    _id: fieldId,
    $or: [{ farmerId: userId }, { user: userId }]
  });
  return field;
}

// @desc    Get latest field monitoring observation (auto-runs if none exists)
// @route   GET /api/field-monitoring/latest/:fieldId
// @access  Private (Farmer)
exports.getLatestObservation = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isDbConnected()) {
      const obs = getStatelessLatestObservation(fieldId);
      return res.status(200).json(obs);
    }

    const field = await getFarmerField(fieldId, req.user._id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    // Try finding latest observation
    let observation = await FieldMonitoringObservation.findOne({ fieldId })
      .sort({ observationDate: -1 });

    // If no observation exists or older than 24 hours, run pipeline automatically
    const isStale = observation && (Date.now() - new Date(observation.observationDate).getTime() > 24 * 60 * 60 * 1000);
    if (!observation || isStale) {
      try {
        observation = await runFieldMonitoringPipeline(fieldId, req.user._id);
      } catch (pipelineErr) {
        console.error('[FieldMonitoringController] Automatic run error:', pipelineErr.message);
        // If pipeline error occurred but an older observation exists, fall back gracefully
        if (!observation) {
          return res.status(500).json({
            success: false,
            message: 'Unable to process field monitoring telemetry. Please try again shortly.',
            error: pipelineErr.message
          });
        }
      }
    }

    // Fetch unread field alerts
    const alerts = await FieldAlert.find({ fieldId, isRead: false }).sort({ createdAt: -1 }).limit(5);

    return res.status(200).json({
      success: true,
      field,
      data: observation,
      alerts
    });
  } catch (err) {
    console.error('[FieldMonitoringController] getLatestObservation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving field monitoring status.',
      error: err.message
    });
  }
};

// @desc    Manually trigger or force refresh field monitoring pipeline
// @route   POST /api/field-monitoring/run/:fieldId
// @access  Private (Farmer)
exports.triggerMonitoringRun = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isDbConnected()) {
      const obs = getStatelessLatestObservation(fieldId);
      return res.status(200).json({
        success: true,
        message: 'Field monitoring analysis updated successfully.',
        data: obs.data
      });
    }

    const field = await getFarmerField(fieldId, req.user._id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    const observation = await runFieldMonitoringPipeline(fieldId, req.user._id);

    // Recalculate real-time crop health in background
    try {
      const { calculateCropHealth } = require('../services/cropHealthEngine');
      calculateCropHealth({ farmerId: req.user._id, fieldId })
        .catch(e => console.warn('Crop health auto-update on monitoring run note:', e.message));
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Field monitoring analysis updated successfully.',
      data: observation
    });
  } catch (err) {
    console.error('[FieldMonitoringController] triggerMonitoringRun error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to run monitoring pipeline.',
      error: err.message
    });
  }
};

// @desc    Get historical time-series observations for charts
// @route   GET /api/field-monitoring/history/:fieldId
// @access  Private (Farmer)
exports.getFieldHistory = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isDbConnected()) {
      const hist = getStatelessFieldHistory(fieldId);
      return res.status(200).json(hist);
    }

    const limit = parseInt(req.query.limit, 10) || 30;

    const field = await getFarmerField(fieldId, req.user._id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    const observations = await FieldMonitoringObservation.find({ fieldId })
      .sort({ observationDate: 1 })
      .limit(limit);

    // Format metrics for graph presentation
    const chartData = observations.map(obs => ({
      date: obs.observationDate,
      ndvi: obs.satelliteData?.ndviMean || null,
      cloudCoverage: obs.satelliteData?.cloudCoverage || 0,
      satelliteStatus: obs.satelliteData?.status || 'Unavailable',
      moistureScore: obs.moistureStatus?.moistureScore || null,
      moistureStatus: obs.moistureStatus?.status || 'Unknown',
      rainfallMm: obs.weatherData?.precipitationMm || 0,
      temperatureC: obs.weatherData?.temperatureC || null,
      et0: obs.weatherData?.et0Fao || null,
      irrigationNeeded: obs.irrigationAdvisory?.actionRequired || false,
      diseaseRiskLevel: obs.diseaseRisk?.riskLevel || 'Low',
      healthScore: obs.satelliteData?.healthScore || 75
    }));

    return res.status(200).json({
      success: true,
      field,
      count: observations.length,
      history: observations,
      chartData
    });
  } catch (err) {
    console.error('[FieldMonitoringController] getFieldHistory error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving field history.',
      error: err.message
    });
  }
};

// @desc    Compare field observation: Today vs 7d / 15d / 30d / previous
// @route   GET /api/field-monitoring/compare/:fieldId
// @access  Private (Farmer)
exports.compareFieldObservations = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const period = req.query.period || '7d'; // '7d' | '15d' | '30d' | 'previous'

    if (!isDbConnected()) {
      const comp = getStatelessCompareObservations(fieldId, period);
      return res.status(200).json(comp);
    }

    const field = await getFarmerField(fieldId, req.user._id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    // Get current (latest)
    const latest = await FieldMonitoringObservation.findOne({ fieldId })
      .sort({ observationDate: -1 });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: 'No monitoring records available yet for this field.'
      });
    }

    let previous = null;
    const now = new Date(latest.observationDate).getTime();

    if (period === 'previous') {
      previous = await FieldMonitoringObservation.findOne({
        fieldId,
        _id: { $ne: latest._id }
      }).sort({ observationDate: -1 });
    } else {
      let days = 7;
      if (period === '15d') days = 15;
      if (period === '30d') days = 30;

      const targetTimestamp = now - (days * 24 * 60 * 60 * 1000);
      const targetDate = new Date(targetTimestamp);

      // Find the closest observation to targetDate
      previous = await FieldMonitoringObservation.findOne({
        fieldId,
        observationDate: { $lte: targetDate }
      }).sort({ observationDate: -1 });

      // If nothing older, pick the earliest available record
      if (!previous) {
        previous = await FieldMonitoringObservation.findOne({
          fieldId,
          _id: { $ne: latest._id }
        }).sort({ observationDate: 1 });
      }
    }

    if (!previous) {
      return res.status(200).json({
        success: true,
        canCompare: false,
        message: 'Insufficient historical observations for comparison. At least two observations are required.',
        current: latest
      });
    }

    // Calculate comparative deltas scientifically
    const daysApart = Math.max(1, Math.round(Math.abs(new Date(latest.observationDate) - new Date(previous.observationDate)) / (1000 * 60 * 60 * 24)));

    const currentNdvi = latest.satelliteData?.ndviMean;
    const prevNdvi = previous.satelliteData?.ndviMean;
    let ndviDelta = null;
    let ndviDeltaPercent = null;
    if (typeof currentNdvi === 'number' && typeof prevNdvi === 'number' && prevNdvi > 0) {
      ndviDelta = +(currentNdvi - prevNdvi).toFixed(3);
      ndviDeltaPercent = +((ndviDelta / prevNdvi) * 100).toFixed(1);
    }

    const currentMoisture = latest.moistureStatus?.moistureScore;
    const prevMoisture = previous.moistureStatus?.moistureScore;
    let moistureDelta = null;
    if (typeof currentMoisture === 'number' && typeof prevMoisture === 'number') {
      moistureDelta = +(currentMoisture - prevMoisture).toFixed(1);
    }

    const currentHealth = latest.satelliteData?.healthScore || 75;
    const prevHealth = previous.satelliteData?.healthScore || 75;
    const healthDelta = currentHealth - prevHealth;

    // Generate bilingual delta summary
    let comparisonNarrativeEn = '';
    let comparisonNarrativeHi = '';

    if (ndviDelta !== null && ndviDelta > 0.05) {
      comparisonNarrativeEn += `Vegetation vigor has improved by ${Math.abs(ndviDeltaPercent)}% over ${daysApart} days. `;
      comparisonNarrativeHi += `पिछले ${daysApart} दिनों में फसल हरियाली और स्वास्थ्य में ${Math.abs(ndviDeltaPercent)}% सुधार हुआ है। `;
    } else if (ndviDelta !== null && ndviDelta < -0.05) {
      comparisonNarrativeEn += `Vegetation vigor shows a decline of ${Math.abs(ndviDeltaPercent)}% over ${daysApart} days. `;
      comparisonNarrativeHi += `पिछले ${daysApart} दिनों में फसल हरियाली में ${Math.abs(ndviDeltaPercent)}% की गिरावट देखी गई है। `;
    } else {
      comparisonNarrativeEn += `Vegetation vigor has remained relatively stable over ${daysApart} days. `;
      comparisonNarrativeHi += `पिछले ${daysApart} दिनों में फसल की हरियाली सामान्य और स्थिर रही है। `;
    }

    if (moistureDelta !== null && moistureDelta < -10) {
      comparisonNarrativeEn += `Soil moisture reserves have dropped notably. `;
      comparisonNarrativeHi += `खेत की मिट्टी में नमी का स्तर काफी कम हुआ है। `;
    } else if (moistureDelta !== null && moistureDelta > 10) {
      comparisonNarrativeEn += `Soil moisture has replenished following irrigation or rainfall. `;
      comparisonNarrativeHi += `हालिया बारिश या सिंचाई के बाद मिट्टी की नमी बढ़ गई है। `;
    }

    return res.status(200).json({
      success: true,
      canCompare: true,
      field,
      period,
      daysApart,
      current: latest,
      previous,
      deltas: {
        ndviDelta,
        ndviDeltaPercent,
        moistureDelta,
        healthDelta,
        comparisonNarrativeEn,
        comparisonNarrativeHi
      }
    });
  } catch (err) {
    console.error('[FieldMonitoringController] compareFieldObservations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during field comparison.',
      error: err.message
    });
  }
};

// @desc    Upload soil test report linked to field_id
// @route   POST /api/field-monitoring/soil-test/:fieldId
// @access  Private (Farmer)
exports.uploadSoilTest = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isDbConnected()) {
      addStatelessSoilTest(fieldId, req.body);
      const obs = getStatelessLatestObservation(fieldId);
      return res.status(200).json({
        success: true,
        message: 'Soil test report successfully saved and linked to field.',
        observation: obs.data
      });
    }

    const field = await getFarmerField(fieldId, req.user._id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    const {
      testDate,
      ph,
      nitrogen,
      phosphorus,
      potassium,
      organicCarbon,
      electricalConductivity,
      labReportUrl,
      notes
    } = req.body;

    const report = {
      testDate: testDate ? new Date(testDate) : new Date(),
      ph: ph ? parseFloat(ph) : undefined,
      nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
      phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
      potassium: potassium ? parseFloat(potassium) : undefined,
      organicCarbon: organicCarbon ? parseFloat(organicCarbon) : undefined,
      electricalConductivity: electricalConductivity ? parseFloat(electricalConductivity) : undefined,
      labReportUrl,
      notes
    };

    field.soilTestReports.push(report);
    await field.save();

    // Trigger an immediate monitoring run to incorporate new soil test
    let updatedObservation = null;
    try {
      updatedObservation = await runFieldMonitoringPipeline(fieldId, req.user._id);
    } catch (runErr) {
      console.warn('[FieldMonitoringController] Post-soil-test monitoring run warning:', runErr.message);
    }

    // Recalculate real-time crop health in background
    try {
      const { calculateCropHealth } = require('../services/cropHealthEngine');
      calculateCropHealth({ farmerId: req.user._id, fieldId })
        .catch(e => console.warn('Crop health auto-update on soil test note:', e.message));
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Soil test report successfully saved and linked to field.',
      soilTestReports: field.soilTestReports,
      observation: updatedObservation
    });
  } catch (err) {
    console.error('[FieldMonitoringController] uploadSoilTest error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error saving soil test report.',
      error: err.message
    });
  }
};

// @desc    Get dashboard monitoring summary for all farmer fields
// @route   GET /api/field-monitoring/dashboard-summary
// @access  Private (Farmer)
exports.getMonitoringDashboardSummary = async (req, res) => {
  try {
    const farmerId = req.user._id;

    if (!isDbConnected()) {
      const summaryList = getStatelessFieldMonitoringSummary(farmerId);
      return res.status(200).json({
        success: true,
        count: summaryList.length,
        data: summaryList
      });
    }

    const fields = await Field.find({
      $or: [{ farmerId: farmerId }, { user: farmerId }]
    }).sort({ createdAt: -1 });

    const summaryList = [];

    for (const field of fields) {
      let observation = await FieldMonitoringObservation.findOne({ fieldId: field._id })
        .sort({ observationDate: -1 });

      // If no observation exists, create one in the background or immediately
      if (!observation) {
        try {
          observation = await runFieldMonitoringPipeline(field._id, farmerId);
        } catch (e) {
          console.warn(`[Summary] Pipeline warning for field ${field._id}:`, e.message);
        }
      }

      summaryList.push({
        fieldId: field._id,
        fieldName: field.fieldName || field.name || 'Field',
        area: field.area,
        areaUnit: field.areaUnit || 'Acres',
        crop: field.crop,
        cropVariety: field.cropVariety || 'Standard',
        cropStage: field.cropStage || 'Vegetative Stage',
        soilType: field.soilType || 'Alluvial',
        irrigationMethod: field.irrigationMethod || 'Flood / Furrow',
        location: field.location,
        lastMonitoringTimestamp: field.lastMonitoringTimestamp,
        // The 6 Primary Autonomous Indicators
        cropHealth: observation?.satelliteData?.healthCategory || 'Adequate',
        healthScore: observation?.satelliteData?.healthScore || 75,
        moistureStatus: observation?.moistureStatus?.status || 'Adequate Moisture',
        moistureStatusHi: observation?.moistureStatus?.statusHi || 'पर्याप्त नमी',
        moistureScore: observation?.moistureStatus?.moistureScore || 65,
        rainForecast: observation?.weatherData?.precipitationForecast24h || 0,
        rainProbability: observation?.weatherData?.precipitationProbability || 0,
        irrigationRecommendation: observation?.irrigationAdvisory?.actionRequired ? 'Recommended' : 'Not Required Today',
        irrigationMessageEn: observation?.irrigationAdvisory?.messageEn || 'Adequate moisture present.',
        irrigationMessageHi: observation?.irrigationAdvisory?.messageHi || 'खेत में पर्याप्त नमी है।',
        nutrientStatus: observation?.nutrientAdvisory?.recommendationEn?.split('.')[0] || 'Review at current stage',
        nutrientStatusHi: observation?.nutrientAdvisory?.recommendationHi?.split('.')[0] || 'पोषक तत्व समीक्षा करें',
        diseaseRisk: observation?.diseaseRisk?.riskLevel || 'Low',
        lastSatelliteObservation: observation?.satelliteData?.lastObservationDate || null,
        satelliteStatus: observation?.satelliteData?.status || 'Unavailable',
        ndviMean: observation?.satelliteData?.ndviMean || null,
        whatShouldIDoToday: observation?.whatShouldIDoToday || [],
        aiSummary: observation?.aiSummary,
        aiSummaryHi: observation?.aiSummaryHi
      });
    }

    return res.status(200).json({
      success: true,
      count: summaryList.length,
      data: summaryList
    });
  } catch (err) {
    console.error('[FieldMonitoringController] getMonitoringDashboardSummary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving monitoring dashboard summary.',
      error: err.message
    });
  }
};

// @desc    Acknowledge or mark field alert as read
// @route   PUT /api/field-monitoring/alert/:alertId/read
// @access  Private (Farmer)
exports.markAlertRead = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!isDbConnected()) {
      return res.status(200).json({ success: true, message: 'Alert acknowledged' });
    }

    const alert = await FieldAlert.findOneAndUpdate(
      { _id: alertId, farmerId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    return res.status(200).json({ success: true, alert });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
