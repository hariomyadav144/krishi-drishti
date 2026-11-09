/**
 * Geocoding & Reverse Geocoding Service for Fasal Drishti
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
 * Search places by text query, village name, PIN code, or landmark
 * Multi-provider engine: Google Geocoding (if API key present) -> Photon (Komoot OSM) -> Nominatim OSM
 * @param {string} query 
 * @returns {Promise<Array<{display_name: string, short_name: string, village?: string, district?: string, state?: string, lat: number, lng: number, lon: number, source: string}>>}
 */
export async function searchPlaces(query) {
  if (!query || !query.trim()) return [];
  const clean = query.trim().replace(/\s+/g, ' ');
  const results = [];
  const seen = new Set();

  // 1. If Google Maps API key is configured, query Google Geocoding API
  const googleApiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(clean)}&components=country:IN&key=${googleApiKey}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && Array.isArray(gData.results)) {
          for (const item of gData.results) {
            const loc = item.geometry?.location;
            if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
              const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
              seen.add(key);
              results.push({
                display_name: item.formatted_address,
                short_name: item.formatted_address.split(',')[0],
                lat: loc.lat,
                lng: loc.lng,
                lon: loc.lng,
                source: 'google'
              });
            }
          }
          if (results.length > 0) return results;
        }
      }
    } catch (gErr) {
      console.warn('[PLACE SEARCH] Google Geocoding failed, falling back:', gErr.message);
    }
  }

  // 2. Photon API (Komoot / OSM) - exceptionally fast, handles Indian villages, PIN codes & tehsils
  try {
    const pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=6`;
    const pRes = await fetch(pUrl, { signal: AbortSignal.timeout(5000) });
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData?.features && Array.isArray(pData.features)) {
        for (const feat of pData.features) {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [];
          if (coords.length >= 2) {
            const lat = parseFloat(coords[1]);
            const lng = parseFloat(coords[0]);
            const name = props.name || '';
            const locality = props.district || props.county || props.city || '';
            const state = props.state || '';
            const postcode = props.postcode || '';
            const parts = [name, locality, state, postcode].filter(Boolean);
            const displayName = parts.join(', ');
            const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
            if (!seen.has(key) && !isNaN(lat) && !isNaN(lng)) {
              seen.add(key);
              results.push({
                display_name: displayName || name,
                short_name: name || locality || displayName,
                village: name,
                district: locality,
                state: state,
                lat,
                lng,
                lon: lng,
                source: 'photon'
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[PLACE SEARCH] Photon search error:', err.message);
  }

  // 3. OpenStreetMap Nominatim with India countrycode filter
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&countrycodes=in&addressdetails=1&limit=6`;
    const nRes = await fetch(nomUrl, { 
      signal: AbortSignal.timeout(6000),
      headers: { 'Accept-Language': 'en,hi' }
    });
    if (nRes.ok) {
      const nData = await nRes.json();
      if (Array.isArray(nData)) {
        for (const item of nData) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
          if (!seen.has(key) && !isNaN(lat) && !isNaN(lng)) {
            seen.add(key);
            const addr = item.address || {};
            const shortName = addr.village || addr.suburb || addr.town || addr.city || item.display_name.split(',')[0];
            results.push({
              display_name: item.display_name,
              short_name: shortName,
              village: addr.village || addr.suburb || '',
              district: addr.state_district || addr.county || '',
              state: addr.state || '',
              lat,
              lng,
              lon: lng,
              source: 'nominatim'
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[PLACE SEARCH] Nominatim search error:', err.message);
  }

  // 4. Comma-separated query fallback (e.g. "Sahajanwa, Gorakhpur" -> try "Sahajanwa")
  if (results.length === 0 && clean.includes(',')) {
    const primaryPart = clean.split(',')[0].trim();
    if (primaryPart.length >= 3) {
      try {
        const fUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(primaryPart)}&limit=4`;
        const fRes = await fetch(fUrl, { signal: AbortSignal.timeout(4000) });
        if (fRes.ok) {
          const fData = await fRes.json();
          if (fData?.features) {
            for (const feat of fData.features) {
              const coords = feat.geometry?.coordinates || [];
              const props = feat.properties || {};
              if (coords.length >= 2) {
                const lat = parseFloat(coords[1]);
                const lng = parseFloat(coords[0]);
                const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
                if (!seen.has(key) && !isNaN(lat) && !isNaN(lng)) {
                  seen.add(key);
                  const parts = [props.name, props.district || props.county, props.state].filter(Boolean);
                  results.push({
                    display_name: parts.join(', '),
                    short_name: props.name || primaryPart,
                    lat,
                    lng,
                    lon: lng,
                    source: 'photon_fallback'
                  });
                }
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  return results;
}
