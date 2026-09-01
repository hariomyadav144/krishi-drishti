const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
    enum: [
      'Rice / Paddy',
      'Wheat',
      'Cotton',
      'Tomato',
      'Potato',
      'Sugarcane',
      'Maize / Corn',
      'Soybean',
      'Mustard',
      'Onion',
      'Chilli / Pepper',
      'Groundnut'
    ],
    default: 'Tomato',
  },
  variety: {
    type: String,
    default: 'Abhinav Hybrid',
  },
  cropStage: {
    type: String,
    enum: [
      'Sowing / Germination',
      'Vegetative Stage',
      'Flowering Stage',
      'Fruit / Pod Formation',
      'Maturity / Ripening',
      'Harvesting'
    ],
    default: 'Flowering Stage',
  },
  plantingDate: {
    type: Date,
    default: () => new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // ~35 days ago
  },
  expectedHarvestDate: {
    type: Date,
    default: () => new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
  },
  healthStatus: {
    type: String,
    enum: ['Excellent', 'Good', 'Moderate', 'At Risk', 'Diseased'],
    default: 'Good',
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 88,
  },
  areaAllocated: {
    type: Number,
    default: 2.5,
  },
  isCurrent: {
    type: Boolean,
    default: true,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Crop', cropSchema);
