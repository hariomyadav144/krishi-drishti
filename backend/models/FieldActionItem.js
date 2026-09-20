const mongoose = require('mongoose');

/**
 * FieldActionItem Model:
 * Manages the closed-loop Problem -> Action -> Resolution tracking cycle.
 * Tracks when problems are detected, farmer action is taken, and whether
 * subsequent autonomous monitoring cycles confirmed improvement or escalated.
 */
const fieldActionItemSchema = new mongoose.Schema({
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
    default: 'Primary Field',
  },
  observationId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'FieldMonitoringObservation',
  },
  issueKey: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  titleHi: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  descriptionHi: {
    type: String,
    default: '',
  },
  severity: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'info'],
    default: 'medium',
  },
  category: {
    type: String,
    enum: ['irrigation', 'fertilizer', 'disease_protection', 'pest_control', 'monitoring', 'routine'],
    default: 'monitoring',
  },
  dataSource: {
    type: String,
    enum: ['weather', 'satellite', 'soil_sensor', 'image_ai', 'agronomy_rule', 'historical'],
    default: 'agronomy_rule',
  },
  confidence: {
    type: Number,
    default: 85,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'dismissed'],
    default: 'pending',
    index: true,
  },
  resolutionStatus: {
    type: String,
    enum: ['active', 'verifying', 'resolved', 'escalated'],
    default: 'active',
    index: true,
  },
  actionTakenAt: {
    type: Date,
  },
  completedNotes: {
    type: String,
    default: '',
  },
  initialMetric: {
    name: { type: String },
    value: { type: Number },
    unit: { type: String }
  },
  resolvedMetric: {
    name: { type: String },
    value: { type: Number },
    unit: { type: String }
  },
  resolutionMessage: {
    type: String,
    default: '',
  },
  resolutionMessageHi: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
  },
  recheckCount: {
    type: Number,
    default: 0,
  },
  lastRecheckAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

fieldActionItemSchema.index({ fieldId: 1, status: 1, resolutionStatus: 1 });
fieldActionItemSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('FieldActionItem', fieldActionItemSchema);
