/**
 * Geocoding & Reverse Geocoding Service for Krishi Drishti
 * Provides accurate resolution of village, town, district, and state
 * directly from browser GPS coordinates.
 */

/**
 * Reverse geocode latitude and longitude into village, district, state
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{formatted: string, village: string, district: string, state: string, country: string}>}
 */
export async function reverseGeocode(lat, lng) {
  console.log(`[REVERSE GEOCODING] latitude: ${lat}, longitude: ${lng}`);

  // 1. Primary: BigDataCloud free client-side reverse geocoding
  // Specifically designed for client-side browsers without API keys, zero CORS issues,
  // and exceptionally granular data for Indian villages, tehsils, and districts.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const d = await res.json();
      const admin = d.localityInfo?.administrative || [];
      const districtObj = admin.find((a) => 
        a.description?.toLowerCase().includes('district') || 
        a.name?.toLowerCase().includes('district')
      );
      const district = districtObj ? districtObj.name.replace(/\s+district/i, '') : (d.city || '');
      const village = d.locality || d.city || '';
      const state = d.principalSubdivision || '';

      const parts = [];
      if (village) parts.push(village);
      if (district && district.toLowerCase() !== village.toLowerCase()) parts.push(district);
      if (state && state.toLowerCase() !== district.toLowerCase()) parts.push(state);

      if (parts.length > 0) {
        const formatted = parts.join(', ');
        console.log(`[REVERSE GEOCODING SUCCESS] ${formatted}`);
        return {
          formatted,
          village,
          district,
          state,
          country: d.countryName || 'India'
        };
      }
    }
  } catch (err) {
    console.warn('[REVERSE GEOCODING] BigDataCloud primary failed, attempting OpenStreetMap:', err.message);
  }

  // 2. Secondary fallback: OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.village || addr.suburb || addr.town || addr.city || addr.county || '';
      const district = addr.state_district || addr.county || addr.district || '';
      const state = addr.state || '';

      const parts = [];
      if (village) parts.push(village);
      if (district && district.toLowerCase() !== village.toLowerCase()) parts.push(district);
      if (state && state.toLowerCase() !== district.toLowerCase()) parts.push(state);

      if (parts.length > 0) {
        const formatted = parts.join(', ');
        console.log(`[REVERSE GEOCODING SUCCESS (Nominatim)] ${formatted}`);
        return {
          formatted,
          village,
          district,
          state,
          country: addr.country || 'India'
        };
      }
    }
  } catch (err) {
    console.warn('[REVERSE GEOCODING] OpenStreetMap Nominatim failed:', err.message);
  }

  // 3. Coordinate fallback if both reverse geocoding providers are unreachable
  const fallback = `Field Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  console.log(`[REVERSE GEOCODING FALLBACK] ${fallback}`);
  return {
    formatted: fallback,
    village: '',
    district: '',
    state: '',
    country: 'India'
  };
}

/**
 * Search places by text query via OpenStreetMap Nominatim
 * @param {string} query 
 */
export async function searchPlaces(query) {
  if (!query || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim() + ', India')}&limit=5`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[PLACE SEARCH ERROR]:', err.message);
  }
  return [];
}
