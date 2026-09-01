const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation',
  },
  cropAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropAnalysis',
  },
  rating: {
    type: String,
    enum: ['helped', 'partially_helped', 'not_helped'],
    required: true,
  },
  comments: {
    type: String,
    default: '',
  },
  cropName: {
    type: String,
    default: '',
  },
  yieldImpactReported: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
