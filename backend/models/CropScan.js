const mongoose = require('mongoose');

const cropScanSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    required: true,
    index: true,
  },
  fieldId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Field',
    default: null,
    index: true,
  },
  fieldName: {
    type: String,
    default: 'General Plot',
    trim: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  cropVariety: {
    type: String,
    default: 'Standard Variety',
    trim: true,
  },
  cropStage: {
    type: String,
    default: 'Vegetative Stage',
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  symptomDescription: {
    type: String,
    default: '',
  },
  detectedProblem: {
    type: String,
    required: true,
    trim: true,
  },
  detectedProblemHi: {
    type: String,
    default: '',
    trim: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 90,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'None (Healthy)'],
    default: 'Medium',
  },
  healthStatus: {
    type: String,
    enum: ['Healthy', 'Good', 'Moderate', 'Needs Attention', 'Critical', 'Diseased'],
    default: 'Moderate',
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75,
  },
  symptoms: [
    {
      type: String,
      trim: true,
    }
  ],
  cause: {
    type: String,
    default: '',
  },
  causeHi: {
    type: String,
    default: '',
  },
  diagnosis: {
    type: String,
    default: '',
  },
  diagnosisHi: {
    type: String,
    default: '',
  },
  recommendedTreatment: {
    organic: { type: String, default: '' },
    chemical: { type: String, default: '' },
    general: { type: String, default: '' },
    timeline: { type: String, default: 'Apply treatment within 24-48 hours and re-inspect.' }
  },
  fertilizerRecommendation: {
    type: String,
    default: '',
  },
  irrigationRecommendation: {
    type: String,
    default: '',
  },
  weatherInfo: {
    temperature: { type: Number, default: 28 },
    humidity: { type: Number, default: 65 },
    condition: { type: String, default: 'Partly Cloudy' },
    rainProbability: { type: Number, default: 10 }
  },
  soilInfo: {
    soilType: { type: String, default: 'Black Soil / Regur' },
    soilPh: { type: Number, default: 6.8 },
    moisture: { type: String, default: 'Adequate' }
  },
  previousScanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropScan',
    default: null,
  },
  scanDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  rawAiReport: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
});

// Explicit compound indexes for performance and multi-attribute farmer filtering
cropScanSchema.index({ farmerId: 1, createdAt: -1 });
cropScanSchema.index({ farmerId: 1, cropName: 1, createdAt: -1 });
cropScanSchema.index({ farmerId: 1, fieldId: 1, createdAt: -1 });
cropScanSchema.index({ farmerId: 1, healthStatus: 1 });
cropScanSchema.index({ farmerId: 1, scanDate: -1 });

module.exports = mongoose.model('CropScan', cropScanSchema);
