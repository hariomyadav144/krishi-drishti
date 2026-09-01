const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farmName: {
    type: String,
    required: true,
    default: 'My Primary Farm',
  },
  farmSize: {
    type: Number,
    required: true,
    default: 4.5,
  },
  landUnit: {
    type: String,
    enum: ['Acres', 'Hectares', 'Bigha', 'Guntha'],
    default: 'Acres',
  },
  soilType: {
    type: String,
    enum: ['Alluvial', 'Black Soil / Regur', 'Red & Yellow', 'Laterite', 'Sandy Loam', 'Clayey'],
    default: 'Black Soil / Regur',
  },
  irrigationMethod: {
    type: String,
    enum: ['Drip Irrigation', 'Sprinkler System', 'Flood / Canal', 'Tube Well', 'Rainfed'],
    default: 'Drip Irrigation',
  },
  soilPh: {
    type: Number,
    default: 6.8,
  },
  organicMatter: {
    type: String,
    default: 'Medium (0.65%)',
  },
  waterSource: {
    type: String,
    default: 'Borewell & Farm Pond',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Farm', farmSchema);
