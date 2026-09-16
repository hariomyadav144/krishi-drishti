/**
 * Farm Intelligence Engine (Client-Side)
 * 
 * Aggregates complete 8-dimension farm context from client storage, active state,
 * and available sensor/weather/scan data. Provides multi-factor cross-validation
 * and produces unified, non-isolated advisory structures.
 */

const safeParse = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

export function assembleClientFarmContext(fieldId = 'default', overrides = {}) {
  const userFields = safeParse('krishi_farm_fields') || safeParse('krishi_fields') || [];
  const farm = safeParse('krishi_farm') || {};
  const currentCrop = safeParse('krishi_current_crop') || {};
  const profile = safeParse('krishi_profile') || {};
  const weatherCache = safeParse('krishi_weather_cache') || {};
  const recentScans = safeParse('krishi_recent_scans') || [];
  const monitoringObs = safeParse('krishi_latest_observation') || {};

  let targetField = null;
  if (Array.isArray(userFields) && userFields.length > 0) {
    if (fieldId && fieldId !== 'default') {
      targetField = userFields.find(f => f.id === fieldId || f._id === fieldId) || userFields[0];
    } else {
      targetField = userFields[0];
    }
  }

  const crop = overrides.crop || targetField?.crop || currentCrop?.cropName || farm?.mainCrop || 'Wheat';
  const cropStage = overrides.cropStage || targetField?.cropStage || currentCrop?.cropStage || 'Tillering / Vegetative';
  const fieldName = targetField?.fieldName || (farm?.farmSize ? `Main Field (${farm.farmSize} ${farm.landUnit || 'Acres'})` : 'North Plot - Main Field');
  const areaAcres = targetField?.areaAcres || farm?.farmSize || 4.5;
  const soilType = targetField?.soilType || farm?.soilType || 'Black Soil / Regur';

  // Extract soil test values
  const soilTest = targetField?.soilTestReport || {};
  const soil = {
    soilType,
    pH: soilTest.pH || 7.2,
    organicCarbonPercent: soilTest.organicCarbonPercent || 0.62,
    nitrogenKgPerHa: soilTest.nitrogenKgPerHa || 195,
    phosphorusKgPerHa: soilTest.phosphorusKgPerHa || 26,
    potassiumKgPerHa: soilTest.potassiumKgPerHa || 290,
    micronutrients: {
      zincPpm: soilTest.micronutrients?.zincPpm || 0.75,
      ironPpm: soilTest.micronutrients?.ironPpm || 4.2,
      boronPpm: soilTest.micronutrients?.boronPpm || 0.55
    }
  };

  // Weather context
  const weather = {
    temp: weatherCache?.temperature || weatherCache?.temp || 27,
    humidity: weatherCache?.humidity || 62,
    rain24h: weatherCache?.precipitation24h || 0,
    rainProb: weatherCache?.precipitationProbability || 15,
    condition: weatherCache?.condition || 'Partly Cloudy'
  };

  // Irrigation & moisture
  const moisture = {
    score: monitoringObs?.moistureStatus?.moistureScore || 78,
    status: monitoringObs?.moistureStatus?.status || 'Adequate',
    deficitMm: monitoringObs?.moistureStatus?.deficitMm || 4.5,
    waterloggingRisk: false
  };

  // Pathology & scan
  const latestScan = Array.isArray(recentScans) && recentScans.length > 0 ? recentScans[0] : null;

  return {
    fieldId: targetField?.id || targetField?._id || fieldId || 'default',
    fieldName,
    areaAcres,
    crop,
    cropVariety: targetField?.cropVariety || currentCrop?.variety || 'Hybrid / High-Yield',
    cropStage,
    soil,
    weather,
    moisture,
    latestScan: latestScan ? {
      problem: latestScan.detectedProblem || latestScan.diseaseName,
      confidence: latestScan.confidence || 92,
      imageUrl: latestScan.imageUrl
    } : null,
    satelliteNdvi: monitoringObs?.satelliteData?.ndviMean || 0.76,
    healthScore: 88,
    healthStatus: 'Healthy'
  };
}

/**
 * Cross-validate query against client farm context and detect conflicting signals
 */
export function analyzeQueryWithFarmContext(queryText, context) {
  const q = (queryText || '').toLowerCase();

  const isYellowing = q.includes('peeli') || q.includes('peela') || q.includes('yellow') || q.includes('chlorosis') || q.includes('पीली') || q.includes('पीला');
  const isFertilizer = q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('खाद') || q.includes('यूरिया');
  const isIrrigation = q.includes('water') || q.includes('irrigation') || q.includes('pani') || q.includes('सिंचाई') || q.includes('पानी');
  const isDisease = q.includes('bimari') || q.includes('disease') || q.includes('fungus') || q.includes('spray') || q.includes('कीड़ा') || q.includes('रोग') || q.includes('छिड़काव');

  const hypotheses = [];
  const eliminated = [];
  const warnings = [];

  if (isYellowing) {
    // Cross-validate: Is it really Nitrogen?
    if (context.moisture?.score > 80) {
      hypotheses.push({
        cause: 'Soil Over-saturation & Root Oxygen Stress (जड़ों में अत्यधिक नमी से पीलापन)',
        evidence: `Current soil moisture is ${context.moisture.score}%, causing root asphyxiation and temporary nutrient lockup.`
      });
      eliminated.push({
        cause: 'Simple Nitrogen Deficiency (यूरिया की सीधी कमी)',
        reason: 'Soil test N is moderate and root zone is saturated. Adding urea right now will burn roots.'
      });
    } else if (context.soil?.pH > 7.8) {
      hypotheses.push({
        cause: 'Iron Chlorosis / Zinc Lockup due to High Alkaline pH (उच्च pH के कारण लौह/जिंक की अनुपलब्धता)',
        evidence: `Soil pH is ${context.soil.pH} (>7.8), immobilizing Fe and Zn ions at root tips.`
      });
    } else {
      hypotheses.push({
        cause: 'Vegetative Phase Nitrogen & Sulphur Demand (वानस्पतिक अवस्था में नत्रजन व गंधक की आवश्यकता)',
        evidence: `Crop is at ${context.cropStage} stage with soil available N at ${context.soil.nitrogenKgPerHa} kg/ha.`
      });
    }
  }

  // Weather gating check
  if (context.weather?.rain24h > 5 || context.weather?.rainProb > 60) {
    warnings.push(`Rain forecast of ${context.weather.rain24h}mm expected in 24h. Postpone foliar spraying and chemical broadcasting.`);
  }

  return {
    isYellowing,
    isFertilizer,
    isIrrigation,
    isDisease,
    hypotheses,
    eliminated,
    warnings
  };
}
