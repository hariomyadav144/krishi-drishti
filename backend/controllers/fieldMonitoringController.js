const Field = require('../models/Field');
const FieldMonitoringObservation = require('../models/FieldMonitoringObservation');
const FieldAlert = require('../models/FieldAlert');
const FieldActionItem = require('../models/FieldActionItem');
const { runFieldMonitoringPipeline, scanLandParcelSatellite } = require('../services/fieldMonitoringService');
const {
  isDbConnected,
  getStatelessFields,
  getStatelessLatestObservation,
  getStatelessFieldMonitoringSummary,
  getStatelessFieldHistory,
  getStatelessCompareObservations,
  addStatelessSoilTest,
  getStatelessFieldActions,
  updateStatelessActionStatus,
  addStatelessTelemetry
} = require('../utils/statelessStore');

/**
 * Fasal Drishti - Field Monitoring Controller
 * Handles continuous autonomous monitoring, historical comparison, soil test linkage,
 * and proactive multi-indicator summaries.
 */

// Helper to check field ownership
async function getFarmerField(fieldId, userId) {
  if (!isDbConnected()) {
    const fields = getStatelessFields(userId);
    return fields.find(f => f._id === fieldId || f.id === fieldId) || null;
  }
  const field = await Field.findOne({
    _id: fieldId,
    $or: [{ farmerId: userId }, { user: userId }]
  });
  return field;
}

// @desc    Real-time satellite scan of GPS land parcel to detect crop vs bare/fallow land
// @route   POST /api/field-monitoring/scan-land
// @access  Public / Private
exports.scanLand = async (req, res) => {
  try {
    const { center, points, crop, areaAcres, fieldName } = req.body || {};
    let lat = center?.lat;
    let lng = center?.lng;

    if ((!lat || !lng) && Array.isArray(points) && points.length > 0) {
      const validPoints = points.filter(p => p && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
      if (validPoints.length > 0) {
        lat = validPoints.reduce((sum, p) => sum + Number(p.lat), 0) / validPoints.length;
        lng = validPoints.reduce((sum, p) => sum + Number(p.lng), 0) / validPoints.length;
      }
    }

    if (!lat || !lng) {
      lat = 26.76;
      lng = 83.37;
    }

    const scanResult = await scanLandParcelSatellite({
      lat: Number(lat),
      lng: Number(lng),
      polygon: points,
      crop,
      areaAcres,
      fieldName
    });

    return res.status(200).json({
      success: true,
      data: scanResult
    });
  } catch (err) {
    console.error('[FieldMonitoringController] scanLand error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to complete satellite land scan.',
      error: err.message
    });
  }
};

// @desc    Get latest field monitoring observation (auto-runs if none exists)
// @route   GET /api/field-monitoring/latest/:fieldId
// @access  Private (Farmer)
exports.getLatestObservation = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?._id;

    let field = await getFarmerField(fieldId, userId);
    if (!field) {
      const fields = getStatelessFields(userId);
      field = fields.find(f => f._id === fieldId || f.id === fieldId);
    }

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or access denied.'
      });
    }

    // Try finding latest observation
    let observation = null;
    if (isDbConnected()) {
      observation = await FieldMonitoringObservation.findOne({ fieldId })
        .sort({ observationDate: -1 });
    }

    // If no observation exists or older than 24 hours, run pipeline automatically
    const isStale = observation && (Date.now() - new Date(observation.observationDate).getTime() > 24 * 60 * 60 * 1000);
    if (!observation || isStale) {
      try {
        observation = await runFieldMonitoringPipeline(fieldId, userId);
      } catch (pipelineErr) {
        console.error('[FieldMonitoringController] Automatic run error:', pipelineErr.message);
      }
    }

    // Fetch unread field alerts
    let alerts = [];
    if (isDbConnected()) {
      alerts = await FieldAlert.find({ fieldId, isRead: false }).sort({ createdAt: -1 }).limit(5);
    }

    return res.status(200).json({
      success: true,
      field,
      data: observation || (getStatelessLatestObservation(fieldId)?.data),
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
    let targetDays = 7;

    if (period === 'previous') {
      previous = await FieldMonitoringObservation.findOne({
        fieldId,
        observationDate: { $lt: latest.observationDate }
      }).sort({ observationDate: -1 });
    } else {
      let minDays = 5;
      let maxDays = 9;
      targetDays = 7;

      if (period === '15d') {
        minDays = 12;
        maxDays = 18;
        targetDays = 15;
      } else if (period === '30d') {
        minDays = 24;
        maxDays = 36;
        targetDays = 30;
      }

      const minTimestamp = now - (maxDays * 86400000);
      const maxTimestamp = now - (minDays * 86400000);
      const targetTimestamp = now - (targetDays * 86400000);

      // Find all observations within tolerance window
      const candidates = await FieldMonitoringObservation.find({
        fieldId,
        observationDate: {
          $gte: new Date(minTimestamp),
          $lte: new Date(maxTimestamp)
        }
      });

      if (candidates && candidates.length > 0) {
        // Pick candidate closest to target timestamp
        candidates.sort((a, b) => {
          const diffA = Math.abs(new Date(a.observationDate).getTime() - targetTimestamp);
          const diffB = Math.abs(new Date(b.observationDate).getTime() - targetTimestamp);
          return diffA - diffB;
        });
        previous = candidates[0];
      }
    }

    if (!previous) {
      return res.status(200).json({
        success: true,
        canCompare: false,
        period,
        message: period === '30d'
          ? 'No real observation available for 30-day comparison.'
          : 'No real observation available for this period.',
        current: latest
      });
    }

    // Calculate real days apart and nearest date notice
    const daysApart = Math.max(1, Math.round(Math.abs(now - new Date(previous.observationDate).getTime()) / 86400000));
    const isExactTarget = (period === '7d' && daysApart === 7) || (period === '15d' && daysApart === 15) || (period === '30d' && daysApart === 30);
    const nearestDateNotice = isExactTarget ? null : `Nearest available observation: ${new Date(previous.observationDate).toLocaleDateString('en-GB')}`;

    // Calculate comparative deltas scientifically from real stored values
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

    const currentHealth = latest.satelliteData?.healthScore;
    const prevHealth = previous.satelliteData?.healthScore;
    let healthDelta = null;
    if (typeof currentHealth === 'number' && typeof prevHealth === 'number') {
      healthDelta = currentHealth - prevHealth;
    }

    // Generate bilingual narrative based strictly on actual observations
    let comparisonNarrativeEn = '';
    let comparisonNarrativeHi = '';
    const prevDateStr = new Date(previous.observationDate).toLocaleDateString('en-GB');
    const latestDateStr = new Date(latest.observationDate).toLocaleDateString('en-GB');

    if (ndviDelta !== null) {
      const dir = ndviDelta > 0 ? 'increased' : (ndviDelta < 0 ? 'decreased' : 'remained stable');
      const dirHi = ndviDelta > 0 ? 'सुधार' : (ndviDelta < 0 ? 'गिरावट' : 'स्थिर');
      comparisonNarrativeEn = `NDVI ${dir} from ${prevNdvi} to ${currentNdvi} between ${prevDateStr} and ${latestDateStr}.`;
      comparisonNarrativeHi = `${prevDateStr} और ${latestDateStr} के बीच NDVI ${prevNdvi} से ${currentNdvi} (${dirHi}) दर्ज किया गया।`;
    } else {
      comparisonNarrativeEn = `Observation recorded on ${prevDateStr} compared with current observation (${latestDateStr}).`;
      comparisonNarrativeHi = `${prevDateStr} का अवलोकन वर्तमान (${latestDateStr}) के साथ तुलना में उपलब्ध है।`;
    }

    return res.status(200).json({
      success: true,
      canCompare: true,
      field,
      period,
      daysApart,
      nearestDateNotice,
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

// @desc    Get action items for a field (pending, in_progress, resolved) or all fields
// @route   GET /api/field-monitoring/actions/:fieldId?
// @access  Private (Farmer)
exports.getFieldActions = async (req, res) => {
  try {
    const { fieldId } = req.params;
    if (!isDbConnected()) {
      const actions = getStatelessFieldActions(fieldId || 'all');
      return res.status(200).json({
        success: true,
        data: actions
      });
    }

    const query = { farmerId: req.user._id };
    if (fieldId && fieldId !== 'all') {
      query.fieldId = fieldId;
    }

    const actions = await FieldActionItem.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: actions
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update action item status (e.g. mark done, in progress) and trigger verification
// @route   POST /api/field-monitoring/action/:actionId/status
// @access  Private (Farmer)
exports.updateActionStatus = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status, completedNotes } = req.body;

    if (!isDbConnected()) {
      const updated = updateStatelessActionStatus(actionId, status);
      return res.status(200).json({
        success: true,
        message: 'Action status updated (stateless mode).',
        data: updated
      });
    }

    const action = await FieldActionItem.findOne({
      _id: actionId,
      farmerId: req.user._id
    });

    if (!action) {
      return res.status(404).json({ success: false, message: 'Action item not found.' });
    }

    action.status = status || action.status;
    if (status === 'completed') {
      action.actionTakenAt = new Date();
      action.resolutionStatus = 'verifying';
    }
    if (completedNotes) {
      action.completedNotes = completedNotes;
    }
    await action.save();

    // Trigger an immediate monitoring run to evaluate if condition has improved
    let runResult = null;
    try {
      runResult = await runFieldMonitoringPipeline(action.fieldId, req.user._id);
    } catch (recheckErr) {
      console.warn('[FieldMonitoring] Post-action recheck warning:', recheckErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Action status updated and verification cycle completed.',
      data: action,
      recheckResult: runResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Ingest IoT / sensor telemetry for a field
// @route   POST /api/field-monitoring/telemetry/:fieldId
// @access  Private (Farmer or Sensor Device)
exports.ingestFieldTelemetry = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const {
      soilMoisturePercent,
      soilTemperatureC,
      ambientHumidityPercent,
      ambientTemperatureC,
      batteryLevelPercent,
      sensorId
    } = req.body;

    if (!isDbConnected()) {
      addStatelessTelemetry(fieldId, req.body);
      return res.status(200).json({ success: true, message: 'Telemetry received (stateless mode).' });
    }

    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found.' });
    }

    if (!Array.isArray(field.sensorData)) {
      field.sensorData = [];
    }

    const reading = {
      timestamp: new Date(),
      soilMoisturePercent: Number(soilMoisturePercent),
      soilTemperatureC: Number(soilTemperatureC),
      ambientHumidityPercent: Number(ambientHumidityPercent),
      ambientTemperatureC: Number(ambientTemperatureC),
      batteryLevelPercent: Number(batteryLevelPercent),
      sensorId: sensorId || 'sensor_default'
    };

    field.sensorData.unshift(reading);
    if (field.sensorData.length > 200) {
      field.sensorData = field.sensorData.slice(0, 200);
    }
    await field.save();

    return res.status(200).json({
      success: true,
      message: 'Sensor telemetry ingested successfully.',
      reading
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

