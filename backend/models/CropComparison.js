const mongoose = require('mongoose');

const cropComparisonSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    required: true,
    index: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
  },
  fieldId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Field',
    default: null,
  },
  fieldName: {
    type: String,
    default: 'General Plot',
  },
  oldScanId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'CropScan',
    required: true,
  },
  newScanId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'CropScan',
    required: true,
  },
  comparisonResult: {
    status: {
      type: String,
      enum: ['Improved', 'Deteriorated', 'Stable', 'Resolved', 'Inconclusive'],
      default: 'Stable',
    },
    statusHi: {
      type: String,
      default: 'स्थिर',
    },
    progressScoreChange: {
      type: Number,
      default: 0,
    },
    daysBetweenScans: {
      type: Number,
      default: 0,
    },
    healthChange: {
      type: String,
      default: '',
    },
    diseaseChange: {
      type: String,
      default: '',
    },
    symptomsChange: {
      type: String,
      default: '',
    },
    conditionThenVsNow: {
      then: { type: String, default: '' },
      now: { type: String, default: '' }
    },
    diseaseThenVsNow: {
      then: { type: String, default: '' },
      now: { type: String, default: '' }
    },
    healthStatusThenVsNow: {
      then: { type: String, default: '' },
      now: { type: String, default: '' }
    },
    symptomsThenVsNow: {
      then: [String],
      now: [String]
    },
    diagnosisThenVsNow: {
      then: { type: String, default: '' },
      now: { type: String, default: '' }
    },
    treatmentThenVsNow: {
      then: { type: String, default: '' },
      now: { type: String, default: '' }
    },
    whatChanged: {
      type: String,
      default: '',
    },
    whatChangedHi: {
      type: String,
      default: '',
    },
    possibleReason: {
      type: String,
      default: '',
    },
    possibleReasonHi: {
      type: String,
      default: '',
    },
    actionAdvice: {
      type: String,
      default: '',
    },
    actionAdviceHi: {
      type: String,
      default: '',
    },
    aiSummary: {
      type: String,
      default: '',
    },
    aiSummaryHi: {
      type: String,
      default: '',
    },
  },
  comparisonDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

cropComparisonSchema.index({ farmerId: 1, createdAt: -1 });
cropComparisonSchema.index({ oldScanId: 1, newScanId: 1 });

module.exports = mongoose.model('CropComparison', cropComparisonSchema);
