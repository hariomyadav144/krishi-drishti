const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  location: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    required: true,
    default: 'Uttar Pradesh',
  },
  district: {
    type: String,
    required: true,
    default: 'Gorakhpur',
  },
  village: {
    type: String,
    required: true,
    default: 'Sahajanwa',
  },
  pincode: {
    type: String,
    default: '273209',
  },
  experienceYears: {
    type: Number,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
