const { getFarmWeather } = require('../services/weatherService');
const FarmerProfile = require('../models/FarmerProfile');

// @desc Get weather and agro-forecast
// @route GET /api/weather
const getWeather = async (req, res) => {
  try {
    let district = 'Nashik';
    let state = 'Maharashtra';

    if (req.user) {
      const profile = await FarmerProfile.findOne({ userId: req.user._id });
      if (profile) {
        district = profile.district || district;
        state = profile.state || state;
      }
    }

    const { latitude, longitude } = req.query;
    const parsedLat = latitude ? parseFloat(latitude) : null;
    const parsedLng = longitude ? parseFloat(longitude) : null;

    const weatherData = await getFarmWeather(district, state, parsedLat, parsedLng);
    res.json({ success: true, data: weatherData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWeather,
};
