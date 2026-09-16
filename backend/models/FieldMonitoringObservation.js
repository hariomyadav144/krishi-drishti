const mongoose = require('mongoose');

const spatialZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  name: { type: String, required: true },
  areaAcres: { type: Number, default: 1.0 },
  ndvi: { type: Number, default: 0.75 },
  status: { type: String, default: 'Healthy' },
  statusHi: { type: String, default: 'स्वस्थ' },
  color: { type: String, default: '#10B981' } // hex color for map display
}, { _id: false });

const dailyActionItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  icon: { type: String, default: 'CheckCircle' },
  text: { type: String, required: true },
  textHi: { type: String, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low', 'Info'], default: 'Medium' }
}, { _id: false });

const fieldMonitoringObservationSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    required: true,
    index: true,
  },
  fieldId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Field',
    required: true,
    index: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
  },
  cropStage: {
    type: String,
    default: 'Vegetative Stage',
  },
  observationDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  // 1. Satellite Observation Data
  satelliteData: {
    available: { type: Boolean, default: true },
    source: { type: String, default: 'Sentinel-2B (ESA Copernicus MSI)' },
    resolution: { type: String, default: '10m Multispectral Ground Resolution' },
    cloudCoverPercent: { type: Number, default: 4.5 },
    observationDate: { type: Date, default: Date.now },
    ndviMean: { type: Number, default: 0.76 },
    ndviMin: { type: Number, default: 0.58 },
    ndviMax: { type: Number, default: 0.84 },
    ndmiMean: { type: Number, default: 0.42 }, // Normalized Difference Moisture Index (Vegetation water proxy)
    ndwiMean: { type: Number, default: 0.28 }, // Normalized Difference Water Index
    vegetationHealthScore: { type: Number, default: 85 }, // 0 to 100
    healthStatus: { type: String, default: 'High Vegetative Vigour' },
    healthStatusHi: { type: String, default: 'उच्च वानस्पतिक स्वास्थ्य' },
    spatialZones: [spatialZoneSchema],
    unavailabilityReason: { type: String, default: null }, // e.g., 'Cloud cover exceeded threshold (>25%)'
  },
  // 2. Weather & Atmospheric Conditions
  weatherData: {
    temperature: { type: Number, default: 28 },
    relativeHumidity: { type: Number, default: 65 },
    recentRainfallMm: { type: Number, default: 0 },
    forecastRainfall24h: { type: Number, default: 0 },
    forecastRainfall48h: { type: Number, default: 0 },
    rainProbability: { type: Number, default: 15 },
    evapotranspirationMm: { type: Number, default: 4.2 }, // ET0 reference crop evapotranspiration
    windSpeedKmH: { type: Number, default: 12 },
    condition: { type: String, default: 'Partly Cloudy' },
  },
  // 3. Field Moisture Status Engine (Strictly labeled as estimate)
  moistureStatus: {
    status: {
      type: String,
      enum: ['Adequate', 'Decreasing', 'Becoming Dry', 'Irrigation Recommended'],
      default: 'Adequate',
    },
    statusHi: { type: String, default: 'पर्याप्त नमी' },
    indicatorScore: { type: Number, default: 78 }, // 0 to 100 proxy
    isEstimate: { type: Boolean, default: true },
    explanation: { type: String, default: 'Soil water balance indicates adequate root-zone moisture.' },
    explanationHi: { type: String, default: 'मिट्टी में जल संतुलन के अनुसार जड़ों में पर्याप्त नमी उपलब्ध है।' },
  },
  // 4. Automatic Irrigation Advisory
  irrigationAdvisory: {
    recommended: { type: Boolean, default: false },
    urgency: {
      type: String,
      enum: ['None', 'Low', 'Within 24-48h', 'Immediate', 'Hold (Rain Incoming)'],
      default: 'None',
    },
    urgencyHi: { type: String, default: 'कोई सिंचाई आवश्यक नहीं' },
    title: { type: String, default: 'Optimal Soil Moisture' },
    titleHi: { type: String, default: 'उचित नमी स्तर' },
    recommendation: { type: String, default: 'No irrigation needed today.' },
    recommendationHi: { type: String, default: 'आज सिंचाई की आवश्यकता नहीं है।' },
    rationale: { type: String, default: 'Evapotranspiration rate is balanced by soil reserve moisture.' },
    rationaleHi: { type: String, default: 'वाष्पोत्सर्जन दर मिट्टी की संचित नमी द्वारा संतुलित है।' },
  },
  // 5. Fertilizer / Nutrient Advisory
  nutrientAdvisory: {
    status: {
      type: String,
      enum: ['Optimal', 'Review Required', 'Application Due'],
      default: 'Optimal',
    },
    statusHi: { type: String, default: 'संतुलित पोषण' },
    recommendation: { type: String, default: 'Crop nutrition is progressing well for current stage.' },
    recommendationHi: { type: String, default: 'वर्तमान फसल अवस्था के लिए पोषक तत्व संतुलन सामान्य है।' },
    stageMilestone: { type: String, default: 'Tillering Stage Nutrition Check' },
    soilTestSuggested: { type: Boolean, default: false },
  },
  // 6. Pest & Disease Microclimate Risk
  diseaseRisk: {
    level: {
      type: String,
      enum: ['Low', 'Moderate', 'Elevated', 'High'],
      default: 'Low',
    },
    levelHi: { type: String, default: 'कम जोखिम' },
    pathogenRisks: [{ type: String }],
    rationale: { type: String, default: 'Atmospheric humidity and canopy temperature do not favor pathogen proliferation.' },
    rationaleHi: { type: String, default: 'वातावरणीय आर्द्रता और तापमान फफूंद प्रसार के लिए अनुकूल नहीं हैं।' },
  },
  // 7. "What Should I Do Today?" Actionable Items
  whatShouldIDoToday: [dailyActionItemSchema],
  // 8. Bilingual AI Summary
  aiSummary: { type: String, default: '' },
  aiSummaryHi: { type: String, default: '' },
}, {
  timestamps: true,
});

// Explicit compound indexes for fast time-series queries
fieldMonitoringObservationSchema.index({ fieldId: 1, observationDate: -1 });
fieldMonitoringObservationSchema.index({ farmerId: 1, fieldId: 1, observationDate: -1 });

module.exports = mongoose.model('FieldMonitoringObservation', fieldMonitoringObservationSchema);
