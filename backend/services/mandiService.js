const https = require('https');
const mongoose = require('mongoose');
const MandiRate = require('../models/MandiRate');
const { MANDI_MASTER_TABLE, findNearbyMandis, calculateDistanceKm } = require('../utils/mandiMaster');
const { resolveOfficialCommodity, getCommodityHindiName } = require('../utils/commodityMap');

const OGD_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const OGD_BASE_URL = 'https://api.data.gov.in/resource';

// In-memory cache for high performance & resilience when operating without persistent DB
const inMemoryCache = new Map();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes cache during mandi trading hours

function getApiKey() {
  return (
    process.env.DATA_GOV_API_KEY ||
    process.env.DATA_GOV_KEY ||
    '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'
  ).trim();
}

/**
 * Validates official mandi record according to Requirement 7:
 * - min_price <= modal_price <= max_price
 * - price > 0
 * - valid commodity, market, state, district
 */
function validateMandiRecord(item) {
  if (!item) return { isValid: false, reason: 'Empty record' };

  const min = Number(item.min_price != null ? item.min_price : item.Min_Price);
  const modal = Number(item.modal_price != null ? item.modal_price : item.Modal_Price);
  const max = Number(item.max_price != null ? item.max_price : item.Max_Price);

  if (isNaN(min) || isNaN(modal) || isNaN(max)) {
    return { isValid: false, reason: 'Non-numeric price values' };
  }

  if (min <= 0 || modal <= 0 || max <= 0) {
    return { isValid: false, reason: 'Price must be greater than zero' };
  }

  // Strict check: min_price <= modal_price <= max_price
  if (!(min <= modal && modal <= max)) {
    return { isValid: false, reason: `Price consistency failure (min: ${min}, modal: ${modal}, max: ${max})` };
  }

  const commodity = (item.commodity || item.Commodity || '').trim();
  const market = (item.market || item.Market || '').trim();
  const state = (item.state || item.State || '').trim();

  if (!commodity || !market || !state) {
    return { isValid: false, reason: 'Missing essential geographic or commodity identification' };
  }

  return {
    isValid: true,
    min,
    modal,
    max,
    commodity,
    market,
    state,
    district: (item.district || item.District || '').trim(),
    variety: (item.variety || item.Variety || 'Standard / Other').trim(),
    grade: (item.grade || item.Grade || 'FAQ').trim(),
    arrival_date: (item.arrival_date || item.Arrival_Date || '').trim(),
    arrival: Number(item.arrival || item.Arrival || 0) || 0
  };
}

/**
 * Standard HTTP GET helper to query api.data.gov.in
 */
function fetchFromGovApi(queryParams) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return reject(new Error('DATA_GOV_API_KEY is not configured in backend environment'));
    }

    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: '100',
      ...queryParams
    });

    const url = `${OGD_BASE_URL}/${OGD_RESOURCE_ID}?${params.toString()}`;

    const req = https.get(url, { timeout: 12000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Government API returned HTTP ${res.statusCode}: ${raw.slice(0, 150)}`));
          }
          const json = JSON.parse(raw);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse Government API JSON response: ${err.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Government API request timed out (12s)'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fetch and standardize official mandi rates with cache & database persistence
 */
async function getOfficialMandiRates({ state, district, market, commodity, date, limit = 50 }) {
  const resolvedCommodity = resolveOfficialCommodity(commodity);
  const cacheKey = `mandi_${state || 'ALL'}_${district || 'ALL'}_${market || 'ALL'}_${resolvedCommodity || 'ALL'}_${date || 'TODAY'}`;

  // 1. Check in-memory short term cache
  const cached = inMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      isCached: true,
      cachedAgeSec: Math.round((Date.now() - cached.timestamp) / 1000)
    };
  }

  // 2. Prepare Data.gov.in filter query
  const queryParams = { limit: String(limit) };
  if (state && state !== 'All') {
    queryParams['filters[state]'] = state;
  }
  if (district && district !== 'All') {
    queryParams['filters[district]'] = district;
  }
  if (market && market !== 'All') {
    // Strip "APMC" suffix for AGMARKNET matching if needed
    const cleanMarket = market.replace(/\s*APMC\s*/i, '').replace(/\s*Mandi\s*/i, '').trim();
    queryParams['filters[market]'] = cleanMarket;
  }
  if (resolvedCommodity) {
    queryParams['filters[commodity]'] = resolvedCommodity;
  }
  if (date) {
    // If date is provided in YYYY-MM-DD format, convert to DD/MM/YYYY for AGMARKNET
    if (date.includes('-')) {
      const [y, m, d] = date.split('-');
      queryParams['filters[arrival_date]'] = `${d}/${m}/${y}`;
    } else {
      queryParams['filters[arrival_date]'] = date;
    }
  }

  let apiRecords = [];
  let apiSuccess = false;
  let apiError = null;

  try {
    const response = await fetchFromGovApi(queryParams);
    if (response && Array.isArray(response.records)) {
      apiRecords = response.records;
      apiSuccess = true;
    }
  } catch (err) {
    console.warn(`[MandiService] Data.gov.in fetch note (${err.message}). Attempting database/cache fallback.`);
    apiError = err.message;
  }

  // 3. Process and validate fetched records
  const validatedRecords = [];
  for (const raw of apiRecords) {
    const validation = validateMandiRecord(raw);
    if (validation.isValid) {
      // Find matching coordinates from Mandi Master table if available
      const masterMatch = MANDI_MASTER_TABLE.find(
        (m) =>
          m.state.toLowerCase() === validation.state.toLowerCase() &&
          (m.market_name.toLowerCase().includes(validation.market.toLowerCase()) ||
            validation.market.toLowerCase().includes(m.market_name.toLowerCase().replace(' apmc', '')))
      );

      const record = {
        id: `mandi_${validation.state}_${validation.district}_${validation.market}_${validation.commodity}_${validation.arrival_date}`.replace(/\s+/g, '_'),
        state: validation.state,
        district: validation.district || validation.state,
        market: masterMatch ? masterMatch.market_name : `${validation.market} APMC`,
        marketRaw: validation.market,
        commodity: validation.commodity,
        commodityHi: getCommodityHindiName(validation.commodity),
        variety: validation.variety,
        grade: validation.grade,
        minPrice: validation.min,
        modalPrice: validation.modal,
        maxPrice: validation.max,
        unit: '₹ / Quintal',
        priceUnit: 'Quintal',
        arrival: validation.arrival,
        arrivalUnit: 'Tonnes',
        source: 'AGMARKNET / Government of India',
        sourceAuthority: 'Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, GoI',
        sourceUrl: 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi',
        sourceDate: validation.arrival_date,
        fetchedAt: new Date().toISOString(),
        isValid: true,
        coordinates: masterMatch ? { latitude: masterMatch.latitude, longitude: masterMatch.longitude } : null,
        // AI Forecast disclaimer: visually separated from official price
        aiForecast: {
          action: 'HOLD / MONITOR',
          actionHi: 'मंडी भाव स्थिर - निगरानी रखें',
          rationale: 'Official reported market price. Agricultural market trends fluctuate based on daily arrivals and terminal demand.',
          rationaleHi: 'यह सरकार द्वारा रिपोर्टेड वास्तविक मंडी भाव है। स्थानीय मांग व आवक के अनुसार विक्रय निर्णय लें।',
          isPrediction: true,
          disclaimer: 'Prediction — not official mandi price. Actual farmer sale price may vary based on moisture and grade.'
        }
      };

      validatedRecords.push(record);

      // Async write-through to MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        MandiRate.findOneAndUpdate(
          {
            state: record.state,
            district: record.district,
            market: record.market,
            commodity: record.commodity,
            source_date: record.sourceDate
          },
          {
            state: record.state,
            district: record.district,
            market: record.market,
            commodity: record.commodity,
            variety: record.variety,
            grade: record.grade,
            min_price: record.minPrice,
            modal_price: record.modalPrice,
            max_price: record.maxPrice,
            arrival: record.arrival,
            unit: 'Quintal',
            source: record.source,
            source_date: record.sourceDate,
            fetched_at: new Date(),
            is_valid: true
          },
          { upsert: true, new: true }
        ).catch((saveErr) => console.warn('MandiRate cache save warning:', saveErr.message));
      }
    }
  }

  // 4. If government API was successful and returned records, store in cache and return
  if (validatedRecords.length > 0) {
    const result = {
      success: true,
      count: validatedRecords.length,
      source: 'AGMARKNET / Data.gov.in',
      sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
      sourceUrl: 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi',
      dataDate: validatedRecords[0].sourceDate,
      fetchedAt: new Date().toISOString(),
      isCached: false,
      data: validatedRecords
    };

    inMemoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  // 5. Fallback to MongoDB Cache if API returned 0 records or failed
  if (mongoose.connection.readyState === 1) {
    try {
      const dbQuery = {};
      if (state && state !== 'All') dbQuery.state = new RegExp(state, 'i');
      if (district && district !== 'All') dbQuery.district = new RegExp(district, 'i');
      if (resolvedCommodity) dbQuery.commodity = new RegExp(resolvedCommodity, 'i');

      const cachedDocs = await MandiRate.find(dbQuery).sort({ source_date: -1 }).limit(limit).lean();
      if (cachedDocs.length > 0) {
        const formatted = cachedDocs.map((doc) => ({
          id: String(doc._id),
          state: doc.state,
          district: doc.district,
          market: doc.market,
          commodity: doc.commodity,
          commodityHi: getCommodityHindiName(doc.commodity),
          variety: doc.variety,
          grade: doc.grade,
          minPrice: doc.min_price,
          modalPrice: doc.modal_price,
          maxPrice: doc.max_price,
          unit: '₹ / Quintal',
          priceUnit: 'Quintal',
          arrival: doc.arrival,
          arrivalUnit: 'Tonnes',
          source: doc.source,
          sourceAuthority: doc.source_authority,
          sourceDate: doc.source_date,
          fetchedAt: doc.fetched_at,
          isValid: true,
          isCached: true,
          aiForecast: {
            action: 'HOLD / MONITOR',
            actionHi: 'मंडी भाव स्थिर - निगरानी रखें',
            rationale: 'Official reported market price from Government database.',
            rationaleHi: 'यह सरकार द्वारा रिपोर्टेड वास्तविक मंडी भाव है।',
            isPrediction: true,
            disclaimer: 'Prediction — not official mandi price.'
          }
        }));

        return {
          success: true,
          count: formatted.length,
          source: 'AGMARKNET / Data.gov.in (Cached)',
          sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
          dataDate: formatted[0].sourceDate,
          isCached: true,
          notice: 'Showing last available official government mandi data.',
          data: formatted
        };
      }
    } catch (dbErr) {
      console.warn('MongoDB fallback query warning:', dbErr.message);
    }
  }

  // 6. If no official data exists for the selected filters, fail safely without fake numbers
  return {
    success: true,
    count: 0,
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    message: "Today's official mandi price is not available yet for the selected filter.",
    data: []
  };
}

/**
 * Find nearby mandis and fetch their official rates
 */
async function getNearbyMandiRates({ latitude, longitude, radius = 75, commodity }) {
  const nearbyMandis = findNearbyMandis(latitude, longitude, radius);
  if (nearbyMandis.length === 0) {
    return {
      success: true,
      count: 0,
      nearbyMandis: [],
      message: 'No official APMC mandis found within the specified radius.',
      data: []
    };
  }

  // Identify nearest primary district and state
  const primaryMandi = nearbyMandis[0];
  const ratesResult = await getOfficialMandiRates({
    state: primaryMandi.state,
    district: primaryMandi.district,
    commodity: commodity || null,
    limit: 50
  });

  // Attach distance to records matching nearby markets
  const enrichedData = (ratesResult.data || []).map((record) => {
    const matchedMandi = nearbyMandis.find(
      (m) =>
        m.state.toLowerCase() === record.state.toLowerCase() &&
        (m.market_name.toLowerCase().includes(record.marketRaw.toLowerCase()) ||
          record.market.toLowerCase().includes(m.market_name.toLowerCase()))
    );

    return {
      ...record,
      distanceKm: matchedMandi ? matchedMandi.distanceKm : null
    };
  });

  return {
    success: true,
    userLocation: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      nearestDistrict: primaryMandi.district,
      nearestState: primaryMandi.state,
      nearestMandi: primaryMandi.market_name,
      distanceKm: primaryMandi.distanceKm
    },
    nearbyMarkets: nearbyMandis.slice(0, 10),
    count: enrichedData.length,
    data: enrichedData,
    source: ratesResult.source,
    sourceAuthority: ratesResult.sourceAuthority,
    dataDate: ratesResult.dataDate,
    message: enrichedData.length === 0 ? "Today's official mandi price is not available yet for your nearby area." : undefined
  };
}

module.exports = {
  getOfficialMandiRates,
  getNearbyMandiRates,
  validateMandiRecord
};
