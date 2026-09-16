const mongoose = require('mongoose');

const factorScoreSchema = new mongoose.Schema({
  score: { type: Number, default: null }, // 0 to 100, or null if unavailable
  available: { type: Boolean, default: false },
  weight: { type: Number, default: 0 }, // effective normalized weight applied
  details: { type: String, default: '' },
  detailsHi: { type: String, default: '' },
  dataSource: { type: String, default: '' }
}, { _id: false });

const recommendationItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  titleHi: { type: String, default: '' },
  description: { type: String, required: true },
  descriptionHi: { type: String, default: '' },
  urgency: {
    type: String,
    enum: ['Immediate', 'High', 'Medium', 'Low', 'Info'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Disease', 'Moisture', 'Weather', 'Nutrient', 'Irrigation', 'General'],
    default: 'General'
  }
}, { _id: false });

const dataSourceAuditSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  available: { type: Boolean, default: false },
  lastRecorded: { type: Date, default: null },
  note: { type: String, default: '' }
}, { _id: false });

const cropHealthRecordSchema = new mongoose.Schema({
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
  fieldName: {
    type: String,
    default: 'Main Plot',
    trim: true,
  },
  crop: {
    type: String,
    required: true,
    trim: true,
  },
  cropStage: {
    type: String,
    default: 'Vegetative Stage',
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Healthy', 'Attention Needed', 'At Risk', 'Critical'],
    required: true,
  },
  statusHi: {
    type: String,
    default: 'स्वस्थ',
  },
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
    default: 'Medium',
  },
  confidenceScore: {
    type: Number,
    default: 80, // % of reliable data weights available
  },
  factors: {
    cropCondition: factorScoreSchema,
    soilMoisture: factorScoreSchema,
    weather: factorScoreSchema,
    diseaseRisk: factorScoreSchema,
    irrigation: factorScoreSchema,
    nutrients: factorScoreSchema,
    cropStage: factorScoreSchema,
    farmMonitoring: factorScoreSchema,
  },
  reasons: [{ type: String }],
  reasonsHi: [{ type: String }],
  explanation: {
    type: String,
    default: '',
  },
  explanationHi: {
    type: String,
    default: '',
  },
  recommendations: [recommendationItemSchema],
  dataSources: [dataSourceAuditSchema],
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, {
  timestamps: true,
});

// Explicit compound indexes for fast time-series queries
cropHealthRecordSchema.index({ fieldId: 1, calculatedAt: -1 });
cropHealthRecordSchema.index({ farmerId: 1, fieldId: 1, calculatedAt: -1 });
cropHealthRecordSchema.index({ farmerId: 1, calculatedAt: -1 });

module.exports = mongoose.model('CropHealthRecord', cropHealthRecordSchema);
