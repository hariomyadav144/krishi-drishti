const mongoose = require('mongoose');

const cropAnalysisSchema = new mongoose.Schema({
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
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  symptomDescription: {
    type: String,
    default: '',
  },
  detectedProblem: {
    type: String,
    required: true,
  },
  detectedProblemHi: {
    type: String,
    default: '',
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 92,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'None (Healthy)'],
    default: 'Medium',
  },
  cause: {
    type: String,
    required: true,
  },
  causeHi: {
    type: String,
    default: '',
  },
  symptoms: [
    {
      type: String,
    }
  ],
  recommendedAction: {
    type: String,
    required: true,
  },
  recommendedActionHi: {
    type: String,
    default: '',
  },
  organicTreatment: {
    type: String,
    default: '',
  },
  chemicalTreatment: {
    type: String,
    default: '',
  },
  preventionTips: [
    {
      type: String,
    }
  ],
  nextActionTimeline: {
    type: String,
    default: 'Apply treatment within 24-48 hours and re-inspect on Day 4.',
  },
  expertReviewed: {
    type: Boolean,
    default: false,
  },
  expertNotes: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CropAnalysis', cropAnalysisSchema);
