const mongoose = require('mongoose');

const fieldAlertSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['water', 'rain', 'crop_health', 'stress', 'fertilizer', 'satellite'],
    required: true,
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
  message: {
    type: String,
    required: true,
  },
  messageHi: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  cooldownKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  actionUrl: {
    type: String,
    default: '#/field-monitoring',
  },
}, {
  timestamps: true,
});

fieldAlertSchema.index({ farmerId: 1, createdAt: -1 });
fieldAlertSchema.index({ fieldId: 1, createdAt: -1 });

module.exports = mongoose.model('FieldAlert', fieldAlertSchema);
