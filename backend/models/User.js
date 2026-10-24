const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['farmer', 'expert', 'admin'],
    default: 'farmer',
  },
  avatar: {
    type: String,
    default: '',
  },
  languagePreference: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en',
  },
  isOnboarded: {
    type: Boolean,
    default: false,
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  refreshTokens: [
    {
      token: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      rememberMe: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
