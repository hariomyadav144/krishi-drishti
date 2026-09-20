const { getFarmWeather } = require('../services/weatherService');
const FarmerProfile = require('../models/FarmerProfile');
const { isDbConnected } = require('../utils/statelessStore');

// @desc Get weather and agro-forecast
// @route GET /api/weather
const getWeather = async (req, res) => {
  try {
    let district = req.query.district || req.query.city || 'Nashik';
    let state = req.query.state || 'Maharashtra';

    if (isDbConnected() && req.user?._id) {
      try {
        const profile = await FarmerProfile.findOne({ userId: req.user._id });
        if (profile) {
          district = profile.district || district;
          state = profile.state || state;
        }
      } catch (e) {
        console.warn('Weather profile lookup warning:', e.message);
      }
    }

    const { latitude, longitude } = req.query;
    const parsedLat = latitude ? parseFloat(latitude) : null;
    const parsedLng = longitude ? parseFloat(longitude) : null;

    const weatherData = await getFarmWeather(district, state, parsedLat, parsedLng);
    res.json({ success: true, data: weatherData });
  } catch (error) {
    console.error('Weather error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWeather,
};
