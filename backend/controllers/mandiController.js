/**
 * Mandi Rates Controller for Krishi Drishti
 * Powered exclusively by official Government of India AGMARKNET data via Data.gov.in.
 * Strictly free of mock/fake/invented prices.
 */

const { getOfficialMandiRates, getNearbyMandiRates } = require('../services/mandiService');
const {
  MANDI_MASTER_TABLE,
  getAllStates,
  getDistrictsByState,
  getMarketsByDistrict,
  findNearbyMandis
} = require('../utils/mandiMaster');
const { resolveOfficialCommodity } = require('../utils/commodityMap');

/**
 * @desc Get official daily mandi rates with state, district, market, commodity filters
 * @route GET /api/mandi-rates and GET /api/mandi/prices
 */
exports.getMandiRates = async (req, res) => {
  try {
    const { state, district, market, commodity, date, search, limit = 50 } = req.query;

    let targetCommodity = commodity;
    let targetState = state;
    let targetDistrict = district;

    // If search text is provided (e.g. "Wheat Gorakhpur" or "गेहूं गोरखपुर")
    if (search && search.trim()) {
      const searchParts = search.trim().split(/\s+/);
      for (const part of searchParts) {
        const resolved = resolveOfficialCommodity(part);
        if (resolved) {
          targetCommodity = resolved;
        } else {
          // Check if part matches a known state or district
          const matchedState = getAllStates().find(s => s.toLowerCase().includes(part.toLowerCase()));
          if (matchedState) targetState = matchedState;

          const matchedDistrict = getDistrictsByState().find(d => d.toLowerCase().includes(part.toLowerCase()));
          if (matchedDistrict) targetDistrict = matchedDistrict;
        }
      }
    }

    const result = await getOfficialMandiRates({
      state: targetState,
      district: targetDistrict,
      market,
      commodity: targetCommodity,
      date,
      limit: Number(limit) || 50
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching official mandi rates:', error.message);
    res.status(500).json({
      success: false,
      source: 'AGMARKNET / Data.gov.in',
      sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
      message: 'Official mandi data is temporarily unavailable. Please try again in a few moments.',
      data: []
    });
  }
};

/**
 * Backward compatibility alias for existing clients
 */
exports.getAllMandiPrices = exports.getMandiRates;

/**
 * @desc Get nearby official mandis based on GPS coordinates
 * @route GET /api/mandi-rates/nearby
 */
exports.getNearbyRates = async (req, res) => {
  try {
    const { latitude, longitude, radius, commodity } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both latitude and longitude query parameters.'
      });
    }

    const result = await getNearbyMandiRates({
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius) || 75,
      commodity: commodity || null
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching nearby mandi rates:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not resolve nearby official mandis. Please select your state and district manually.',
      data: []
    });
  }
};

/**
 * @desc Get master list of official states, districts, and APMC markets
 * @route GET /api/mandi-rates/master
 */
exports.getMasterMandiData = async (req, res) => {
  try {
    const { state, district } = req.query;

    const states = getAllStates();
    const districts = getDistrictsByState(state);
    const markets = getMarketsByDistrict(state, district);

    res.status(200).json({
      success: true,
      source: 'Official APMC Registry / AGMARKNET',
      states,
      districts,
      markets: markets.map(m => ({
        id: m.mandi_id,
        name: m.market_name,
        district: m.district,
        state: m.state,
        latitude: m.latitude,
        longitude: m.longitude
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve official mandi registry.'
    });
  }
};

/**
 * @desc Get single mandi rate by ID / commodity
 * @route GET /api/mandi/prices/:id
 */
exports.getMandiPriceById = async (req, res) => {
  try {
    const result = await getOfficialMandiRates({ limit: 10 });
    const item = (result.data || []).find(m => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Official mandi rate record not found for this identifier.'
      });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mandi detail.'
    });
  }
};
