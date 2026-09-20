const mongoose = require('mongoose');

const fieldPointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const soilTestReportSchema = new mongoose.Schema({
  testDate: { type: Date, default: Date.now },
  laboratory: { type: String, default: 'District Agricultural Testing Lab' },
  ph: { type: Number, default: 6.8 },
  organicCarbon: { type: Number, default: 0.65 }, // in %
  nitrogenKgPerHa: { type: Number, default: 210 },
  phosphorusKgPerHa: { type: Number, default: 24 },
  potassiumKgPerHa: { type: Number, default: 280 },
  micronutrients: {
    zincPpm: { type: Number, default: 0.8 },
    ironPpm: { type: Number, default: 4.5 },
    boronPpm: { type: Number, default: 0.5 }
  },
  notes: { type: String, default: '' },
  reportUrl: { type: String, default: '' }
}, { timestamps: true });

const irrigationHistoryItemSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  method: { type: String, default: 'Drip Irrigation' },
  durationHours: { type: Number, default: 2.0 },
  waterVolumeLiters: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  triggeredByRecommendation: { type: Boolean, default: false }
}, { _id: false });

const fertilizerHistoryItemSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  fertilizerName: { type: String, required: true },
  dosageKgPerAcre: { type: Number, required: true },
  applicationMethod: { type: String, default: 'Top Dressing' },
  cropStage: { type: String, default: 'Vegetative Stage' },
  notes: { type: String, default: '' }
}, { _id: false });

const pesticideHistoryItemSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  chemicalOrBioName: { type: String, required: true },
  targetPestOrDisease: { type: String, default: 'General Preventive' },
  dosageMlOrGPerL: { type: Number, default: 2.0 },
  sprayMethod: { type: String, default: 'Foliar Spray' },
  cropStage: { type: String, default: 'Vegetative Stage' },
  notes: { type: String, default: '' }
}, { _id: false });

const cropHealthHistoryItemSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  healthScore: { type: Number, required: true },
  status: { type: String, default: 'Good' },
  primaryRisk: { type: String, default: 'None' },
  source: { type: String, default: 'Autonomous Monitoring' }
}, { _id: false });

const fieldImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  date: { type: Date, default: Date.now },
  diagnosis: { type: String, default: 'Clean Foliage' },
  confidence: { type: Number, default: 90 },
  plantPart: { type: String, default: 'Leaf' }
}, { _id: false });

const sensorDataPointSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  soilMoisturePercent: { type: Number },
  soilTemperatureC: { type: Number },
  ambientHumidityPercent: { type: Number },
  ambientTemperatureC: { type: Number },
  batteryLevelPercent: { type: Number },
  sensorId: { type: String }
}, { _id: false });

const fieldSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    required: true,
    index: true,
  },
  fieldName: {
    type: String,
    required: true,
    trim: true,
  },
  crop: {
    type: String,
    default: 'Wheat',
    trim: true,
  },
  cropVariety: {
    type: String,
    default: 'Standard Certified Variety',
    trim: true,
  },
  season: {
    type: String,
    default: 'Rabi',
    trim: true,
  },
  sowingDate: {
    type: Date,
    default: () => new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // ~35 days ago
  },
  cropStage: {
    type: String,
    enum: [
      'Sowing / Germination',
      'Tillering Stage',
      'Vegetative Stage',
      'Flowering Stage',
      'Fruit / Pod Formation',
      'Maturity / Ripening',
      'Harvesting'
    ],
    default: 'Vegetative Stage',
  },
  farmerName: {
    type: String,
    default: '',
    trim: true,
  },
  soilType: {
    type: String,
    default: 'Black Soil / Regur',
    trim: true,
  },
  irrigationMethod: {
    type: String,
    enum: ['Drip Irrigation', 'Sprinkler System', 'Flood / Canal', 'Tube Well', 'Rainfed'],
    default: 'Drip Irrigation',
  },
  previousFertilizerHistory: {
    type: String,
    default: 'Basal application of DAP (50kg/acre) + Urea (25kg/acre) at sowing',
  },
  previousPesticideHistory: {
    type: String,
    default: 'Preventive Neem oil spray (5ml/L) on Day 20',
  },
  notes: {
    type: String,
    default: '',
  },
  points: {
    type: [fieldPointSchema],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length >= 3;
      },
      message: 'A field polygon must have at least 3 boundary corner points.'
    },
    required: true,
  },
  center: {
    lat: { type: Number, default: 20.174 },
    lng: { type: Number, default: 73.985 }
  },
  areaAcres: {
    type: Number,
    default: 0,
  },
  areaHectares: {
    type: Number,
    default: 0,
  },
  areaSqMeters: {
    type: Number,
    default: 0,
  },
  formattedAcres: {
    type: String,
    default: '0.00 acres',
  },
  formattedHectares: {
    type: String,
    default: '0.00 hectares',
  },
  cornersCount: {
    type: Number,
    default: 0,
  },
  gpsStatus: {
    type: String,
    default: 'GPS Connected',
  },
  gpsAccuracy: {
    type: Number,
    default: 20,
  },
  soilTestReports: [soilTestReportSchema],
  irrigationHistory: [irrigationHistoryItemSchema],
  fertilizerHistory: [fertilizerHistoryItemSchema],
  pesticideHistory: [pesticideHistoryItemSchema],
  cropHealthHistory: [cropHealthHistoryItemSchema],
  uploadedImages: [fieldImageSchema],
  sensorData: [sensorDataPointSchema],
  monitoringActive: {
    type: Boolean,
    default: true,
  },
  monitoringIntervalHours: {
    type: Number,
    default: 6,
  },
  lastMonitoringTimestamp: {
    type: Date,
    default: Date.now,
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now,
  },
  nextCheckAt: {
    type: Date,
    default: () => new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
  },
}, {
  timestamps: true,
});

// Compound indexes for high-speed farmer and field queries
fieldSchema.index({ farmerId: 1, fieldName: 1 });
fieldSchema.index({ farmerId: 1, createdAt: -1 });
fieldSchema.index({ farmerId: 1, lastMonitoringTimestamp: -1 });

module.exports = mongoose.model('Field', fieldSchema);
