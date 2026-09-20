/**
 * Fasal Drishti - Field Boundary & Geodesic Area Calculation Utilities
 * Accurately calculates agricultural parcel surface area from GPS / map coordinates.
 */

const SQ_METERS_PER_HECTARE = 10000;
const SQ_METERS_PER_ACRE = 4046.8564224;

/**
 * Calculates accurate geodesic surface area in square meters for an array of coordinates:
 * [{ lat: number, lng: number }, ...]
 * Uses equal-area local equirectangular projection Shoelace formula (WGS-84).
 */
export function calculatePolygonArea(points) {
  if (!points || points.length < 3) {
    return {
      sqMeters: 0,
      hectares: 0,
      acres: 0,
      formattedAcres: '0.00 acres',
      formattedHectares: '0.00 ha',
      formattedSqMeters: '0 m²',
      cornersCount: points ? points.length : 0,
      isValid: false
    };
  }

  const numPoints = points.length;

  // Mean latitude & longitude for local tangential projection
  const lat0 = points.reduce((sum, p) => sum + Number(p.lat), 0) / numPoints;
  const lng0 = points.reduce((sum, p) => sum + Number(p.lng), 0) / numPoints;

  // 1 degree of latitude in meters on WGS-84 ellipsoid
  const latRad = (lat0 * Math.PI) / 180;
  const metersPerDegreeLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const metersPerDegreeLon = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);

  // Project lat/lng to local Euclidean (x, y) coordinates in meters
  const xy = points.map(p => ({
    x: (Number(p.lng) - lng0) * metersPerDegreeLon,
    y: (Number(p.lat) - lat0) * metersPerDegreeLat
  }));

  // Standard Shoelace formula on projected coordinates
  let areaMetersSq = 0;
  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    areaMetersSq += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  areaMetersSq = Math.abs(areaMetersSq) / 2;

  const hectares = areaMetersSq / SQ_METERS_PER_HECTARE;
  const acres = areaMetersSq / SQ_METERS_PER_ACRE;

  return {
    sqMeters: Math.round(areaMetersSq * 100) / 100,
    hectares: Math.round(hectares * 100) / 100,
    acres: Math.round(acres * 100) / 100,
    formattedAcres: `${acres.toFixed(2)} acres`,
    formattedHectares: `${hectares.toFixed(2)} hectares`,
    formattedSqMeters: `${Math.round(areaMetersSq).toLocaleString()} m²`,
    cornersCount: numPoints,
    isValid: numPoints >= 3 && areaMetersSq > 0
  };
}

/**
 * Calculates geographic center / centroid of polygon vertices
 */
export function calculatePolygonCenter(points) {
  if (!points || points.length === 0) {
    return { lat: 20.5937, lng: 78.9629 }; // Neutral India center
  }

  let sumLat = 0;
  let sumLng = 0;

  points.forEach(p => {
    sumLat += Number(p.lat);
    sumLng += Number(p.lng);
  });

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Calculates perimeter length in meters / km of a polygon or path
 */
export function calculatePolygonPerimeter(points) {
  if (!points || points.length < 2) {
    return { meters: 0, km: 0, formattedPerimeter: '0 m' };
  }
  let totalMeters = 0;
  const R = 6371000; // Earth radius in meters
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const lat1 = (Number(points[i].lat) * Math.PI) / 180;
    const lat2 = (Number(points[j].lat) * Math.PI) / 180;
    const dLat = ((Number(points[j].lat) - Number(points[i].lat)) * Math.PI) / 180;
    const dLng = ((Number(points[j].lng) - Number(points[i].lng)) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }
  return {
    meters: Math.round(totalMeters),
    km: +(totalMeters / 1000).toFixed(2),
    formattedPerimeter: totalMeters >= 1000 ? `${(totalMeters / 1000).toFixed(2)} km` : `${Math.round(totalMeters)} m`
  };
}

/**
 * Validates a field polygon array
 */
export function validateFieldPolygon(points) {
  if (!points || !Array.isArray(points)) {
    return { valid: false, error: 'Points must be a valid array.' };
  }
  if (points.length < 3) {
    return { valid: false, error: `At least 3 boundary corners are required (currently ${points.length}).` };
  }
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (typeof p.lat !== 'number' || isNaN(p.lat) || typeof p.lng !== 'number' || isNaN(p.lng)) {
      return { valid: false, error: `Invalid coordinate at point #${i + 1}.` };
    }
  }
  return { valid: true, error: null };
}
