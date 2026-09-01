const mongoose = require('mongoose');

const actionPlanSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
  },
  cropAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropAnalysis',
  },
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation',
  },
  title: {
    type: String,
    required: true,
  },
  titleHi: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  descriptionHi: {
    type: String,
    default: '',
  },
  dayLabel: {
    type: String,
    enum: ['TODAY', 'DAY 2', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 7', 'WEEK 2'],
    default: 'TODAY',
  },
  dueDate: {
    type: Date,
    default: Date.now,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  category: {
    type: String,
    enum: ['Inspection', 'Irrigation', 'Fertilizer', 'Pest Management', 'Pruning & Weeding', 'Soil Care'],
    default: 'Inspection',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ActionPlan', actionPlanSchema);
