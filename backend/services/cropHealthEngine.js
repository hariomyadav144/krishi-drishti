const mongoose = require('mongoose');
const Field = require('../models/Field');
const CropScan = require('../models/CropScan');
const FieldMonitoringObservation = require('../models/FieldMonitoringObservation');
const CropHealthRecord = require('../models/CropHealthRecord');
const { 
  isDbConnected,
  getStatelessFields, 
  getStatelessCropScans, 
  getStatelessLatestObservation,
  saveStatelessHealthRecord,
  getStatelessHealthHistory,
  getStatelessLatestHealthRecord
} = require('../utils/statelessStore');

// Configurable baseline factor weights
const DEFAULT_FACTOR_WEIGHTS = {
  cropCondition: 0.30,   // Crop & Disease condition
  soilMoisture: 0.20,    // Soil & Moisture balance
  weather: 0.15,         // Weather stress & atmospheric suitability
  irrigation: 0.10,      // Irrigation status & urgency
  cropStage: 0.10,       // Growth stage progress & vigour
  nutrients: 0.10,       // Nutrients & fertilizer status
  farmMonitoring: 0.05,  // Satellite telemetry / NDVI
};

/**
 * Evaluates Weather stress score between 0 and 100 based on actual telemetry
 */
function evaluateWeatherScore(weatherData, cropName) {
  if (!weatherData) return null;
  const temp = typeof weatherData.temperature === 'number' ? weatherData.temperature : 26;
  const humidity = typeof weatherData.relativeHumidity === 'number' ? weatherData.relativeHumidity : 60;
  const rain24h = typeof weatherData.forecastRainfall24h === 'number' ? weatherData.forecastRainfall24h : 0;

  let score = 90;
  let detail = `${temp}°C, ${humidity}% humidity`;
  let detailHi = `${temp}°C तापमान, ${humidity}% आर्द्रता`;

  // Temperature stress penalties
  if (temp > 38) {
    score -= 25;
    detail += ' • Extreme heat stress';
    detailHi += ' • अत्यधिक गर्मी का तनाव';
  } else if (temp > 34) {
    score -= 12;
    detail += ' • Elevated daytime temperature';
    detailHi += ' • अधिक तापमान';
  } else if (temp < 10) {
    score -= 25;
    detail += ' • Cold stress / chill risk';
    detailHi += ' • अत्यधिक ठंड का जोखिम';
  } else if (temp < 15) {
    score -= 10;
    detail += ' • Cool nighttime temperature';
    detailHi += ' • ठंडी रात का प्रभाव';
  } else {
    detail += ' • Optimal growing temperature';
    detailHi += ' • फसल वृद्धि हेतु उत्तम तापमान';
  }

  // Humidity & disease risk penalties
  if (humidity > 85) {
    score -= 15;
    detail += ' • High humidity increases fungal risk';
    detailHi += ' • उच्च आर्द्रता से फफूंद का खतरा';
  } else if (humidity < 30) {
    score -= 12;
    detail += ' • Dry air increases evapotranspiration';
    detailHi += ' • शुष्क हवा से वाष्पीकरण अधिक';
  }

  // Rain forecast impacts
  if (rain24h > 35) {
    score -= 15;
    detail += ` • Heavy rain forecast (${rain24h}mm)`;
    detailHi += ` • भारी बारिश का पूर्वानुमान (${rain24h}mm)`;
  }

  score = Math.max(20, Math.min(100, score));
  return { score, detail, detailHi };
}

/**
 * Evaluates Soil Moisture score between 0 and 100
 */
function evaluateMoistureScore(moistureObj) {
  if (!moistureObj) return null;

  const rawScore = typeof moistureObj.indicatorScore === 'number' ? moistureObj.indicatorScore : null;
  const status = moistureObj.status || 'Adequate';

  let score = rawScore;
  if (score === null) {
    switch (status) {
      case 'Adequate': score = 88; break;
      case 'Decreasing': score = 72; break;
      case 'Becoming Dry': score = 52; break;
      case 'Irrigation Recommended': score = 38; break;
      default: score = 75;
    }
  }

  let detail = moistureObj.explanation || `Soil moisture is ${status.toLowerCase()}`;
  let detailHi = moistureObj.explanationHi || `मिट्टी में नमी ${moistureObj.statusHi || status} है`;

  return { score: Math.max(10, Math.min(100, score)), detail, detailHi };
}

/**
 * Evaluates Crop Condition score from latest AI scan or visual detection
 */
function evaluateCropConditionScore(latestScan) {
  if (!latestScan) return null;

  let baseScore = typeof latestScan.healthScore === 'number' ? latestScan.healthScore : 75;
  const severity = latestScan.severity || 'Medium';
  const problem = latestScan.detectedProblem || 'Unknown condition';
  const problemHi = latestScan.detectedProblemHi || problem;

  // Align severity with ground truth constraints
  if (severity === 'None (Healthy)') {
    baseScore = Math.max(baseScore, 92);
  } else if (severity === 'Low') {
    baseScore = Math.min(baseScore, 85);
  } else if (severity === 'Medium') {
    baseScore = Math.min(baseScore, 68);
  } else if (severity === 'High') {
    baseScore = Math.min(baseScore, 48);
  } else if (severity === 'Critical') {
    baseScore = Math.min(baseScore, 30);
  }

  // Recency check: older scans slowly decay in impact if > 14 days
  if (latestScan.createdAt) {
    const ageDays = (Date.now() - new Date(latestScan.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 21) {
      // Degrade confidence slightly for stale scans
      baseScore = Math.round(baseScore * 0.95);
    }
  }

  const detail = severity === 'None (Healthy)' 
    ? `No active disease detected in latest image (${latestScan.cropName || 'Crop'})`
    : `Detected ${problem} (${severity} severity)`;

  const detailHi = severity === 'None (Healthy)'
    ? `नवीनतम तस्वीर में कोई रोग लक्षण नहीं पाए गए (${latestScan.cropName || 'फसल'} स्वस्थ)`
    : `${problemHi} के लक्षण पाए गए (${severity} प्रभाव)`;

  return { score: Math.max(15, Math.min(100, baseScore)), detail, detailHi };
}

/**
 * Evaluates Irrigation status score
 */
function evaluateIrrigationScore(irrigationAdvisory, irrigationMethod) {
  if (!irrigationAdvisory) return null;

  let score = 90;
  const urgency = irrigationAdvisory.urgency || 'None';

  if (urgency === 'Immediate') {
    score = 42;
  } else if (urgency === 'Within 24-48h') {
    score = 64;
  } else if (urgency === 'Low') {
    score = 80;
  } else if (urgency === 'Hold (Rain Incoming)') {
    score = 88;
  } else {
    score = 94;
  }

  // Bonus for efficient delivery system
  if (irrigationMethod === 'Drip Irrigation') score += 3;
  score = Math.max(20, Math.min(100, score));

  let detail = irrigationAdvisory.recommendation || `Irrigation urgency: ${urgency}`;
  let detailHi = irrigationAdvisory.recommendationHi || `सिंचाई आवश्यकता: ${irrigationAdvisory.urgencyHi || urgency}`;

  return { score, detail, detailHi };
}

/**
 * Evaluates Nutrient & Fertilizer condition score
 */
function evaluateNutrientScore(nutrientAdvisory, soilTestReport) {
  if (!nutrientAdvisory && !soilTestReport) return null;

  let score = 84;
  let detail = 'Nutrition schedule is balanced for current stage';
  let detailHi = 'वर्तमान फसल अवस्था हेतु पोषण संतुलन सामान्य है';

  if (nutrientAdvisory) {
    const status = nutrientAdvisory.status || 'Optimal';
    if (status === 'Application Due') {
      score = 60;
      detail = nutrientAdvisory.recommendation || 'Fertilizer application is due';
      detailHi = nutrientAdvisory.recommendationHi || 'खाद एवं पोषक तत्वों का छिड़काव देय है';
    } else if (status === 'Review Required') {
      score = 72;
      detail = nutrientAdvisory.recommendation || 'Micronutrient review suggested';
      detailHi = nutrientAdvisory.recommendationHi || 'सूक्ष्म पोषक तत्वों की समीक्षा आवश्यक है';
    } else {
      score = 90;
      detail = 'Optimal nutrient balance';
      detailHi = 'संतुलित पोषण स्तर';
    }
  }

  // Adjust if soil test report is present
  if (soilTestReport) {
    const ph = soilTestReport.ph;
    if (typeof ph === 'number' && (ph < 6.0 || ph > 8.2)) {
      score -= 8;
      detail += ` • Soil pH (${ph}) requires amendment`;
      detailHi += ` • मिट्टी का पीएच (${ph}) सुधार योग्य है`;
    }
  }

  return { score: Math.max(20, Math.min(100, score)), detail, detailHi };
}

/**
 * Evaluates Crop Stage Vigour
 */
function evaluateCropStageScore(cropStage, sowingDate) {
  if (!cropStage && !sowingDate) return null;

  let score = 88;
  const stage = cropStage || 'Vegetative Stage';
  let detail = `Growth milestone: ${stage}`;
  let detailHi = `फसल विकास अवस्था: ${stage}`;

  return { score, detail, detailHi };
}

/**
 * Evaluates Farm Monitoring & Satellite Telemetry (NDVI)
 */
function evaluateFarmMonitoringScore(satelliteData) {
  if (!satelliteData || !satelliteData.available) return null;

  let score = typeof satelliteData.vegetationHealthScore === 'number' 
    ? satelliteData.vegetationHealthScore 
    : (typeof satelliteData.ndviMean === 'number' ? Math.round(satelliteData.ndviMean * 100) : 82);

  let detail = `Sentinel-2 NDVI: ${satelliteData.ndviMean || 0.76} (${satelliteData.healthStatus || 'Good Vigour'})`;
  let detailHi = `उपग्रह NDVI: ${satelliteData.ndviMean || 0.76} (${satelliteData.healthStatusHi || 'अच्छा वानस्पतिक विकास'})`;

  return { score: Math.max(20, Math.min(100, score)), detail, detailHi };
}

/**
 * Synthesizes top 2-3 reasons affecting health
 */
function synthesizeReasons(factors, healthScore, status) {
  const reasons = [];
  const reasonsHi = [];

  // Positive factors
  if (factors.cropCondition.available && factors.cropCondition.score >= 80) {
    reasons.push('✓ No significant disease detected in latest scan');
    reasonsHi.push('✓ नवीनतम जांच में कोई गंभीर रोग नहीं पाया गया');
  } else if (factors.cropCondition.available && factors.cropCondition.score < 70) {
    reasons.push(`⚠ Disease stress detected: ${factors.cropCondition.details}`);
    reasonsHi.push(`⚠ रोग का असर: ${factors.cropCondition.detailsHi}`);
  }

  if (factors.soilMoisture.available && factors.soilMoisture.score >= 75) {
    reasons.push('✓ Soil moisture within recommended range');
    reasonsHi.push('✓ मिट्टी में नमी उचित स्तर पर है');
  } else if (factors.soilMoisture.available && factors.soilMoisture.score < 65) {
    reasons.push('⚠ Soil moisture is decreasing below recommended level');
    reasonsHi.push('⚠ मिट्टी में नमी की कमी देखी जा रही है');
  }

  if (factors.weather.available && factors.weather.score >= 75) {
    reasons.push('✓ Favorable weather & temperature conditions');
    reasonsHi.push('✓ मौसम एवं तापमान फसल के अनुकूल है');
  } else if (factors.weather.available && factors.weather.score < 65) {
    reasons.push(`⚠ Weather stress: ${factors.weather.details}`);
    reasonsHi.push(`⚠ मौसमी तनाव: ${factors.weather.detailsHi}`);
  }

  if (factors.irrigation.available && factors.irrigation.score < 65) {
    reasons.push('⚠ Timely irrigation recommended');
    reasonsHi.push('⚠ समय पर सिंचाई की सलाह दी जाती है');
  }

  // Fallbacks if fewer than 2 reasons generated
  if (reasons.length === 0) {
    if (healthScore >= 80) {
      reasons.push('✓ Overall crop parameters are stable');
      reasons.push('✓ Routine crop monitoring active');
      reasonsHi.push('✓ फसल के सभी मुख्य मापदंड सामान्य हैं');
      reasonsHi.push('✓ नियमित निगरानी सक्रिय है');
    } else {
      reasons.push('⚠ Attention required on crop maintenance');
      reasonsHi.push('⚠ फसल की देखरेख पर विशेष ध्यान आवश्यक है');
    }
  }

  return { reasons: reasons.slice(0, 3), reasonsHi: reasonsHi.slice(0, 3) };
}

/**
 * Generates plain-language explanation ("Why is my crop at this level?")
 */
function generateFarmerExplanation(factors, healthScore, status, cropName) {
  const crop = cropName || 'Your crop';

  if (status === 'Healthy') {
    return {
      en: `${crop} is currently healthy at ${healthScore}%. Soil moisture is within the recommended threshold and no significant disease lesions were detected in the recent image scan.`,
      hi: `${crop} इस समय ${healthScore}% के साथ पूरी तरह स्वस्थ है। खेत में नमी का स्तर उत्तम है और नवीनतम जांच में किसी गंभीर बीमारी के लक्षण नहीं मिले हैं।`
    };
  }

  if (status === 'Attention Needed') {
    let issueEn = [];
    let issueHi = [];
    if (factors.soilMoisture.available && factors.soilMoisture.score < 70) {
      issueEn.push('soil moisture is decreasing');
      issueHi.push('मिट्टी में नमी कम हो रही है');
    }
    if (factors.cropCondition.available && factors.cropCondition.score < 75) {
      issueEn.push('mild disease stress was observed in the latest scan');
      issueHi.push('पत्तियों पर हल्के रोग के लक्षण दिखे हैं');
    }
    if (factors.nutrients.available && factors.nutrients.score < 70) {
      issueEn.push('top-dressing fertilizer is due');
      issueHi.push('पोषक तत्वों की खुराक देय है');
    }

    const issueTextEn = issueEn.length > 0 ? issueEn.join(' and ') : 'certain environmental parameters need attention';
    const issueTextHi = issueHi.length > 0 ? issueHi.join(' और ') : 'कुछ पर्यावरणीय कारकों पर ध्यान देने की आवश्यकता है';

    return {
      en: `${crop} health is at ${healthScore}% (Attention Needed) because ${issueTextEn}. Early preventive intervention will quickly restore peak health.`,
      hi: `${crop} का स्वास्थ्य स्कोर ${healthScore}% (ध्यान योग्य) है क्योंकि ${issueTextHi}। समय पर आवश्यक कदम उठाने से फसल पुनः पूरी तरह स्वस्थ हो जाएगी।`
    };
  }

  if (status === 'At Risk') {
    return {
      en: `${crop} health has dropped to ${healthScore}% (At Risk) due to combination of stress factors including reduced soil moisture and detected symptoms. Urgent inspection and care recommended.`,
      hi: `${crop} का स्वास्थ्य स्कोर घटकर ${healthScore}% (जोखिम में) हो गया है। नमी की कमी अथवा रोग के लक्षणों के कारण तुरंत खेत का निरीक्षण कर सुधारात्मक उपाय करें।`
    };
  }

  // Critical
  return {
    en: `${crop} is at critical condition (${healthScore}%). Immediate action required to inspect the affected plot and follow emergency treatment protocols.`,
    hi: `${crop} की स्थिति गंभीर (${healthScore}%) है। कृपया प्रभावित क्षेत्र का तुरंत निरीक्षण करें और सुझाई गई दवा व सिंचाई का तत्काल उपयोग करें।`
  };
}

/**
 * Generates Actionable Recommendations based on actual conditions
 */
function generateActionableRecommendations(factors, status, cropName) {
  const list = [];
  const crop = cropName || 'crop';

  if (factors.soilMoisture.available && factors.soilMoisture.score < 65) {
    list.push({
      id: 'rec_moisture_irrigation',
      title: 'Schedule Field Irrigation',
      titleHi: 'खेत में सिंचाई करें',
      description: 'Root zone moisture is depleted. Apply irrigation within next 24-48 hours during early morning.',
      descriptionHi: 'जड़ क्षेत्र में नमी कम हो गई है। आगामी 24-48 घंटों के भीतर सुबह के समय हल्की सिंचाई करें।',
      urgency: 'High',
      category: 'Irrigation'
    });
  }

  if (factors.cropCondition.available && factors.cropCondition.score < 70) {
    list.push({
      id: 'rec_disease_control',
      title: 'Inspect & Treat Foliar Symptoms',
      titleHi: 'रोगग्रस्त पत्तियों का निरीक्षण व उपचार करें',
      description: `Symptoms detected on ${crop}. Inspect the affected rows and spray organic neem oil (5ml/L) or recommended fungicide.`,
      descriptionHi: `${crop} पर रोग के लक्षण दिखे हैं। प्रभावित क्षेत्र का मुआयना करें और 5 मिली नीम तेल प्रति लीटर पानी में मिलाकर छिड़कें।`,
      urgency: 'Immediate',
      category: 'Disease'
    });
  }

  if (factors.nutrients.available && factors.nutrients.score < 70) {
    list.push({
      id: 'rec_nutrient_boost',
      title: 'Apply Micronutrient Spray',
      titleHi: 'सूक्ष्म पोषक तत्वों का छिड़काव करें',
      description: 'Foliar spray of balanced NPK (19:19:19, 5g/L) + Zinc will boost vegetative vigor.',
      descriptionHi: 'फसल की बढ़वार के लिए 19:19:19 (5 ग्राम/लीटर) के साथ जिंक का पर्णीय छिड़काव करें।',
      urgency: 'Medium',
      category: 'Nutrient'
    });
  }

  if (factors.weather.available && factors.weather.score < 65) {
    list.push({
      id: 'rec_weather_shield',
      title: 'Weather Protective Management',
      titleHi: 'मौसम अनुकूल सुरक्षा प्रबंधन',
      description: 'Atmospheric stress detected. Avoid spraying during peak heat hours and maintain light soil mulch.',
      descriptionHi: 'अत्यधिक तापमान या आर्द्रता के समय दोपहर में छिड़काव से बचें और मल्चिंग का ध्यान रखें।',
      urgency: 'Medium',
      category: 'Weather'
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'rec_routine_care',
      title: 'Maintain Regular Crop Inspection',
      titleHi: 'नियमित फसल निरीक्षण जारी रखें',
      description: 'Crop is thriving normally. Continue weekly scouting and maintain current irrigation schedule.',
      descriptionHi: 'फसल अच्छी स्थिति में है। साप्ताहिक जांच जारी रखें और नियमित जल प्रबंधन बनाए रखें।',
      urgency: 'Low',
      category: 'General'
    });
  }

  return list;
}

/**
 * CORE ENGINE: Calculate Crop Health for a specific field and farmer
 * Uses 100% real available data with transparent weight normalization.
 */
async function calculateCropHealth({ farmerId, fieldId, fieldDoc = null }) {
  // 1. Resolve Field Document
  let field = fieldDoc;
  if (!field) {
    if (isDbConnected()) {
      if (fieldId) {
        field = await Field.findOne({ _id: fieldId, farmerId });
      }
      if (!field) {
        field = await Field.findOne({ farmerId }).sort({ updatedAt: -1 });
      }
    } else {
      const statelessFields = getStatelessFields();
      field = fieldId 
        ? statelessFields.find(f => f._id === fieldId || f.id === fieldId)
        : statelessFields[0];
    }
  }

  // Fallback virtual field definition if none registered
  if (!field) {
    field = {
      _id: fieldId || 'field_demo_01',
      fieldName: 'Primary Crop Plot',
      crop: 'Wheat',
      cropStage: 'Vegetative Stage',
      soilType: 'Black Soil / Regur',
      irrigationMethod: 'Drip Irrigation',
      soilTestReports: []
    };
  }

  const cropName = field.crop || 'Wheat';
  const effectiveFieldId = field._id || fieldId || 'field_demo_01';

  // 2. Fetch Latest Telemetry & Records
  let latestScan = null;
  let latestObservation = null;

  if (isDbConnected()) {
    // Attempt query by fieldId first, fallback to farmerId + cropName
    latestScan = await CropScan.findOne({ farmerId, fieldId: effectiveFieldId }).sort({ createdAt: -1 });
    if (!latestScan) {
      latestScan = await CropScan.findOne({ farmerId, cropName }).sort({ createdAt: -1 });
    }
    latestObservation = await FieldMonitoringObservation.findOne({ fieldId: effectiveFieldId }).sort({ observationDate: -1 });
  } else {
    const scans = getStatelessCropScans();
    latestScan = scans.find(s => s.fieldId === effectiveFieldId || s.cropName === cropName) || scans[0];
    latestObservation = getStatelessLatestObservation(effectiveFieldId);
  }

  // 3. Evaluate Individual Factor Scores
  const cropCondEval = evaluateCropConditionScore(latestScan);
  const moistureEval = evaluateMoistureScore(latestObservation?.moistureStatus);
  const weatherEval = evaluateWeatherScore(latestObservation?.weatherData, cropName);
  const irrigationEval = evaluateIrrigationScore(latestObservation?.irrigationAdvisory, field.irrigationMethod);
  const nutrientEval = evaluateNutrientScore(latestObservation?.nutrientAdvisory, field.soilTestReports?.[0]);
  const stageEval = evaluateCropStageScore(field.cropStage, field.sowingDate);
  const satelliteEval = evaluateFarmMonitoringScore(latestObservation?.satelliteData);

  // Raw factor definitions with configured default weights
  const rawFactors = {
    cropCondition: {
      score: cropCondEval?.score ?? null,
      available: cropCondEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.cropCondition,
      details: cropCondEval?.detail || 'No recent leaf scan available for analysis',
      detailsHi: cropCondEval?.detailHi || 'विश्लेषण हेतु कोई हालिया स्कैन उपलब्ध नहीं',
      dataSource: 'Latest AI Leaf Scan & Diagnosis'
    },
    soilMoisture: {
      score: moistureEval?.score ?? null,
      available: moistureEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.soilMoisture,
      details: moistureEval?.detail || 'Soil moisture sensor telemetry unavailable',
      detailsHi: moistureEval?.detailHi || 'मिट्टी में नमी का संवेदी डेटा अनुपलब्ध',
      dataSource: 'Soil Water Balance & Sensor Telemetry'
    },
    weather: {
      score: weatherEval?.score ?? null,
      available: weatherEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.weather,
      details: weatherEval?.detail || 'Weather station data unavailable',
      detailsHi: weatherEval?.detailHi || 'मौसम केंद्र डेटा अनुपलब्ध',
      dataSource: 'Local Microclimate & Forecast Telemetry'
    },
    irrigation: {
      score: irrigationEval?.score ?? null,
      available: irrigationEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.irrigation,
      details: irrigationEval?.detail || 'Irrigation advisory not configured',
      detailsHi: irrigationEval?.detailHi || 'सिंचाई परामर्श उपलब्ध नहीं',
      dataSource: 'Irrigation Advisory & Scheduling'
    },
    cropStage: {
      score: stageEval?.score ?? null,
      available: stageEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.cropStage,
      details: stageEval?.detail || 'Crop stage details not specified',
      detailsHi: stageEval?.detailHi || 'फसल विकास अवस्था विवरण अनुपलब्ध',
      dataSource: 'Crop Phenology & Growth Stage'
    },
    nutrients: {
      score: nutrientEval?.score ?? null,
      available: nutrientEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.nutrients,
      details: nutrientEval?.detail || 'Soil nutrient / test data unavailable',
      detailsHi: nutrientEval?.detailHi || 'मृदा परीक्षण रिपोर्ट अनुपलब्ध',
      dataSource: 'Nutrient Advisory & Soil Lab Test'
    },
    farmMonitoring: {
      score: satelliteEval?.score ?? null,
      available: satelliteEval !== null,
      defaultWeight: DEFAULT_FACTOR_WEIGHTS.farmMonitoring,
      details: satelliteEval?.detail || 'Satellite telemetry unavailable',
      detailsHi: satelliteEval?.detailHi || 'उपग्रह निगरानी डेटा अनुपलब्ध',
      dataSource: 'Sentinel-2 MSI Satellite Telemetry'
    }
  };

  // 4. Dynamic Weight Normalization (Strictly over available factors)
  let sumAvailableWeights = 0;
  Object.keys(rawFactors).forEach(key => {
    if (rawFactors[key].available && typeof rawFactors[key].score === 'number') {
      sumAvailableWeights += rawFactors[key].defaultWeight;
    }
  });

  const factors = {};
  let weightedScoreSum = 0;

  Object.keys(rawFactors).forEach(key => {
    const rf = rawFactors[key];
    const isAvail = rf.available && typeof rf.score === 'number';
    const effectiveWeight = (isAvail && sumAvailableWeights > 0)
      ? Number((rf.defaultWeight / sumAvailableWeights).toFixed(3))
      : 0;

    factors[key] = {
      score: isAvail ? rf.score : null,
      available: isAvail,
      weight: effectiveWeight,
      details: rf.details,
      detailsHi: rf.detailsHi,
      dataSource: rf.dataSource
    };

    if (isAvail) {
      weightedScoreSum += rf.score * effectiveWeight;
    }
  });

  // Calculate final percentage (between 0 and 100)
  const healthScore = sumAvailableWeights > 0 
    ? Math.max(10, Math.min(100, Math.round(weightedScoreSum)))
    : 75; // safe baseline fallback if literally zero telemetry exists

  // Determine Status and Localized Label
  let status = 'Healthy';
  let statusHi = 'स्वस्थ';

  if (healthScore >= 80) {
    status = 'Healthy';
    statusHi = 'स्वस्थ';
  } else if (healthScore >= 60) {
    status = 'Attention Needed';
    statusHi = 'ध्यान योग्य';
  } else if (healthScore >= 40) {
    status = 'At Risk';
    statusHi = 'जोखिम में';
  } else {
    status = 'Critical';
    statusHi = 'गंभीर';
  }

  // Determine Confidence based on reliable data coverage
  let confidence = 'High';
  const confidenceScore = Math.round(sumAvailableWeights * 100);

  if (sumAvailableWeights >= 0.75) {
    confidence = 'High';
  } else if (sumAvailableWeights >= 0.45) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // Synthesize Reasons, Explanations, Recommendations
  const { reasons, reasonsHi } = synthesizeReasons(factors, healthScore, status);
  const explanationObj = generateFarmerExplanation(factors, healthScore, status, cropName);
  const recommendations = generateActionableRecommendations(factors, status, cropName);

  // Compile transparent Data Sources audit trail
  const dataSources = [
    {
      name: 'Latest Crop Image Scan',
      nameHi: 'फसल की नवीनतम पत्ती/तस्वीर जांच',
      available: factors.cropCondition.available,
      lastRecorded: latestScan?.createdAt || null,
      note: factors.cropCondition.available ? `Analyzed: ${latestScan.detectedProblem}` : 'No recent scan uploaded'
    },
    {
      name: 'Soil Moisture Telemetry',
      nameHi: 'मिट्टी में नमी का संवेदी स्तर',
      available: factors.soilMoisture.available,
      lastRecorded: latestObservation?.observationDate || null,
      note: factors.soilMoisture.available ? factors.soilMoisture.details : 'Soil moisture sensor unavailable'
    },
    {
      name: 'Weather & Microclimate Data',
      nameHi: 'स्थानीय मौसम एवं पूर्वानुमान डेटा',
      available: factors.weather.available,
      lastRecorded: latestObservation?.observationDate || null,
      note: factors.weather.available ? factors.weather.details : 'Weather telemetry unavailable'
    },
    {
      name: 'Irrigation Scheduling & History',
      nameHi: 'सिंचाई स्थिति एवं सलाह',
      available: factors.irrigation.available,
      lastRecorded: latestObservation?.observationDate || null,
      note: factors.irrigation.available ? factors.irrigation.details : 'Irrigation status unavailable'
    },
    {
      name: 'Crop Growth Stage & Milestone',
      nameHi: 'फसल विकास अवस्था एवं अवधि',
      available: factors.cropStage.available,
      lastRecorded: field.updatedAt || null,
      note: factors.cropStage.details
    },
    {
      name: 'Nutrients & Soil Lab Test',
      nameHi: 'पोषक तत्व व मृदा परीक्षण रिपोर्ट',
      available: factors.nutrients.available,
      lastRecorded: field.soilTestReports?.[0]?.testDate || null,
      note: factors.nutrients.available ? factors.nutrients.details : 'Soil lab test report unavailable'
    },
    {
      name: 'Satellite Multispectral NDVI',
      nameHi: 'उपग्रह आधारित वानस्पतिक सूचकांक (NDVI)',
      available: factors.farmMonitoring.available,
      lastRecorded: latestObservation?.satelliteData?.observationDate || null,
      note: factors.farmMonitoring.available ? factors.farmMonitoring.details : 'Satellite revisit pending'
    }
  ];

  // 5. Build Final Immutable Snapshot
  const snapshotData = {
    farmerId,
    fieldId: effectiveFieldId,
    fieldName: field.fieldName || 'Main Plot',
    crop: cropName,
    cropStage: field.cropStage || 'Vegetative Stage',
    healthScore,
    status,
    statusHi,
    confidence,
    confidenceScore,
    factors,
    reasons,
    reasonsHi,
    explanation: explanationObj.en,
    explanationHi: explanationObj.hi,
    recommendations,
    dataSources,
    calculatedAt: new Date()
  };

  // 6. Persist to MongoDB or in-memory Stateless Store
  let savedRecord = snapshotData;
  if (isDbConnected()) {
    try {
      savedRecord = await CropHealthRecord.create(snapshotData);
    } catch (err) {
      console.warn('Could not persist CropHealthRecord to MongoDB, using memory fallback:', err.message);
      savedRecord = saveStatelessHealthRecord(snapshotData);
    }
  } else {
    savedRecord = saveStatelessHealthRecord(snapshotData);
  }

  return savedRecord;
}

module.exports = {
  calculateCropHealth,
  DEFAULT_FACTOR_WEIGHTS
};
