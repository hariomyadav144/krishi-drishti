const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
  },
  cropName: {
    type: String,
    default: 'General Farming',
  },
  queryText: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['General', 'Irrigation', 'Fertilizer & Nutrition', 'Pest & Disease', 'Weather & Soil', 'Yield Optimization'],
    default: 'General',
  },
  // 5-Part Structured Advice
  issue: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  whatToDo: {
    type: String,
    required: true,
  },
  whenToDo: {
    type: String,
    required: true,
  },
  whatToAvoid: {
    type: String,
    required: true,
  },
  // Hindi counterparts for seamless bilingual UI
  issueHi: {
    type: String,
    default: '',
  },
  reasonHi: {
    type: String,
    default: '',
  },
  whatToDoHi: {
    type: String,
    default: '',
  },
  whenToDoHi: {
    type: String,
    default: '',
  },
  whatToAvoidHi: {
    type: String,
    default: '',
  },
  actionPlanCreated: {
    type: Boolean,
    default: false,
  },
  feedbackStatus: {
    type: String,
    enum: ['pending', 'helped', 'partially_helped', 'not_helped'],
    default: 'pending',
  },
  feedbackComment: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
