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
    default: 'Maharashtra',
  },
  district: {
    type: String,
    required: true,
    default: 'Nashik',
  },
  village: {
    type: String,
    required: true,
    default: 'Pimpalgaon',
  },
  pincode: {
    type: String,
    default: '422209',
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
