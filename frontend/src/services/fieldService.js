/**
 * Fasal Drishti - Field Service & Persistence
 * Dual-layer persistence: LocalStorage fallback + backend API synchronization.
 */
import api from './api.js';
import { calculatePolygonArea, calculatePolygonCenter, calculatePolygonPerimeter, validateFieldPolygon } from '../utils/areaUtils.js';

export const STORAGE_KEY_FARMS = 'farms_data';
export const STORAGE_KEY_SAVED_FIELDS = 'krishi_saved_fields';
export const STORAGE_KEY_ACTIVE_FARM_ID = 'active_farm_id';
export const STORAGE_KEY_ACTIVE_FIELD = 'krishi_active_field';

/**
 * Identify legacy 7-point mock coordinates or Pimpalgaon demo coordinates cluster
 */
export function isLegacyMockPolygon(points) {
  if (!Array.isArray(points)) return false;
  if (points.length === 0) return false;
  // Any 7-point or 8-point polygon from test sessions
  if (points.length === 7 || points.length === 8) return true;

  // Check if any coordinates cluster around the hardcoded Pimpalgaon demo coordinates (20.17x, 73.98x)
  return points.some(p => {
    const lat = Number(p?.lat);
    const lng = Number(p?.lng);
    return !isNaN(lat) && !isNaN(lng) && Math.abs(lat - 20.174) < 0.05 && Math.abs(lng - 73.985) < 0.05;
  });
}

/**
 * Automated Cache & Stale State Eviction (Self-Healing Purge Hook)
 * Scans and silently purges legacy mock keys and 7-point/8-point polygons from storage.
 */
export function purgeLegacyMockStorage() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Explicitly purge targeted stale keys from localStorage and sessionStorage
    const staleKeys = [
      'fieldPoints',
      'polygonCoordinates',
      'currentField',
      'boundaryPoints',
      'points',
      'cachedField',
      'lastField',
      'activeField'
    ];

    staleKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch (_) {}
    });

    // 2. Check and purge krishi_farm_coords if it contains mock Pimpalgaon coordinates
    try {
      const rawCoords = localStorage.getItem('krishi_farm_coords');
      if (rawCoords) {
        const parsedCoords = JSON.parse(rawCoords);
        if (
          parsedCoords &&
          (Math.abs(Number(parsedCoords.lat) - 20.174) < 0.05 && Math.abs(Number(parsedCoords.lng) - 73.985) < 0.05)
        ) {
          localStorage.removeItem('krishi_farm_coords');
        }
      }
    } catch (_) {}

    // 3. Purge legacy boundary points keys if they hold mock data
    try {
      ['farm_boundary_geo_points', 'farm_boundary_points'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && (parsed.length === 7 || parsed.length === 8 || isLegacyMockPolygon(parsed))) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (_) {}

    // 4. Wipe active field cache if it holds legacy demo IDs, 7 or 8-point mock coordinates, or North Plot
    try {
      const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE_FIELD);
      if (rawActive) {
        const parsed = JSON.parse(rawActive);
        const pts = parsed?.boundary || parsed?.points;
        if (
          !parsed ||
          parsed.id === 'field_demo_01' ||
          parsed.id === 'field_demo_maize_01' ||
          parsed._id === 'field_demo_01' ||
          parsed._id === 'field_demo_maize_01' ||
          (parsed.fieldName && (parsed.fieldName.includes('North Plot') || parsed.fieldName.includes('field_demo') || parsed.fieldName.includes('Pimpalgaon'))) ||
          (parsed.name && (parsed.name.includes('North Plot') || parsed.name.includes('field_demo') || parsed.name.includes('Pimpalgaon'))) ||
          isLegacyMockPolygon(pts) ||
          (Array.isArray(pts) && (pts.length === 7 || pts.length === 8))
        ) {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_FIELD);
          localStorage.removeItem(STORAGE_KEY_ACTIVE_FARM_ID);
        }
      }
    } catch (_) {}

    // 5. Cleanse saved fields list of any 7 or 8-point mock polygons or demo fields
    try {
      [STORAGE_KEY_SAVED_FIELDS, STORAGE_KEY_FARMS].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized = sanitizeStoredFields(parsed);
            if (sanitized.length === 0) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, JSON.stringify(sanitized));
            }
          }
        }
      });
    } catch (_) {}

    // 6. Scan all remaining localStorage and sessionStorage keys for legacy coordinates or demo strings
    const stores = [
      typeof localStorage !== 'undefined' ? localStorage : null,
      typeof sessionStorage !== 'undefined' ? sessionStorage : null
    ].filter(Boolean);

    stores.forEach(store => {
      for (let i = store.length - 1; i >= 0; i--) {
        const key = store.key(i);
        if (!key) continue;
        const val = store.getItem(key);
        if (val && (
          val.includes('20.17316') || 
          val.includes('20.17482') || 
          val.includes('field_demo_01') || 
          val.includes('North Plot - Wheat')
        )) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && (parsed.length === 7 || parsed.length === 8 || isLegacyMockPolygon(parsed))) {
              store.removeItem(key);
            } else if (parsed && typeof parsed === 'object') {
              const pts = parsed.points || parsed.boundary;
              if (isLegacyMockPolygon(pts) || (Array.isArray(pts) && (pts.length === 7 || pts.length === 8))) {
                store.removeItem(key);
              }
            }
          } catch (_) {}
        }
      }
    });
  } catch (err) {
    console.warn('[FieldService] Silent purge note:', err);
  }
}

// Execute initial silent eviction on module load
if (typeof window !== 'undefined') {
  purgeLegacyMockStorage();
}

/**
 * Clean up legacy/demo fields that were previously pre-seeded into browser storage
 */
export function sanitizeStoredFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields.filter(f => {
    if (!f) return false;
    if (f.id === 'field_demo_maize_01' || f.id === 'field_demo_01') return false;
    if (f._id === 'field_demo_maize_01' || f._id === 'field_demo_01') return false;
    if (f.fieldName && (f.fieldName.includes('North Plot') || f.fieldName.includes('Pimpalgaon') || f.fieldName.includes('Demo') || f.fieldName.includes('Test'))) return false;
    if (f.name && (f.name.includes('North Plot') || f.name.includes('Pimpalgaon') || f.name.includes('Demo') || f.name.includes('Test'))) return false;
    const pts = f.boundary || f.points;
    if (Array.isArray(pts) && (pts.length === 7 || pts.length === 8)) return false;
    if (isLegacyMockPolygon(pts)) return false;
    if (Array.isArray(pts) && pts.some(p => Math.abs(Number(p.lat) - 20.174) < 0.05 && Math.abs(Number(p.lng) - 73.985) < 0.05)) return false;
    return true;
  });
}

/**
 * Farm Repository: Get all saved farms from persistent storage
 */
export function getFarms() {
  if (typeof window === 'undefined') return [];
  purgeLegacyMockStorage();
  migrateLegacyBoundaries();

  try {
    let raw = localStorage.getItem(STORAGE_KEY_FARMS) || localStorage.getItem(STORAGE_KEY_SAVED_FIELDS);
    if (!raw) return [];
    let parsed = JSON.parse(raw);
    let sanitized = sanitizeStoredFields(parsed);

    // Normalize property aliases (name <-> fieldName, boundary <-> points)
    sanitized = sanitized.map(f => ({
      ...f,
      id: f.id || f._id,
      name: f.name || f.fieldName || 'Farm',
      fieldName: f.fieldName || f.name || 'Farm',
      boundary: f.boundary || f.points || [],
      points: f.points || f.boundary || [],
      farmArea: f.farmArea || f.areaAcres ? String(f.farmArea || f.areaAcres) : '0',
      areaAcres: typeof f.areaAcres === 'number' ? f.areaAcres : parseFloat(f.farmArea || 0),
      latitude: f.latitude || f.center?.lat || (f.points?.[0]?.lat),
      longitude: f.longitude || f.center?.lng || (f.points?.[0]?.lng),
      fieldSource: f.fieldSource || 'gps_polygon'
    }));

    // Synchronize both keys
    localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(sanitized));
    localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(sanitized));

    return sanitized;
  } catch (err) {
    console.warn('[FieldService] Error reading farms:', err);
    return [];
  }
}

export const getSavedFieldsLocal = getFarms;

/**
 * Fetch saved fields/farms (Attempts backend sync, falls back to local storage)
 */
export async function fetchSavedFields() {
  purgeLegacyMockStorage();
  try {
    const res = await api.get('/farmer/fields');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      const sanitized = sanitizeStoredFields(res.data.data);
      localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(sanitized));
      localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(sanitized));
      return getFarms();
    }
  } catch (_) {}
  return getFarms();
}

/**
 * Get farm by specific ID
 */
export function getFarmById(id) {
  if (!id) return null;
  const farms = getFarms();
  return farms.find(f => f.id === id || f._id === id) || null;
}

/**
 * Get active farm ID
 */
export function getActiveFarmId() {
  if (typeof window === 'undefined') return null;
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_FARM_ID);
    if (activeId) return activeId;

    const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE_FIELD);
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      if (parsed?.id) return parsed.id;
    }
  } catch (_) {}
  return null;
}

/**
 * Activate a farm by ID (Section 20 & 21 of Master Spec: Exactly ONE farm active at a time)
 */
export function activateFarm(farmId) {
  if (typeof window === 'undefined' || !farmId) return null;
  const farm = getFarmById(farmId);
  if (!farm) return null;

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_FARM_ID, farm.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_FIELD, JSON.stringify(farm));
    localStorage.setItem('active_farm_id', farm.id);
    localStorage.setItem('farm_data', JSON.stringify(farm));
  } catch (_) {}

  return farm;
}

export const setActiveField = activateFarm;
export const setActiveFarmId = activateFarm;

/**
 * Get active farm record for downstream intelligence (AI, Weather, Satellite NDVI, Irrigation)
 */
export function getActiveFarm() {
  if (typeof window === 'undefined') return null;
  const activeId = getActiveFarmId();
  if (activeId) {
    const farm = getFarmById(activeId);
    if (farm) return farm;
  }

  // If active ID is missing or invalid, default to first valid farm in the repository
  const farms = getFarms();
  if (farms.length > 0) {
    activateFarm(farms[0].id);
    return farms[0];
  }
  return null;
}

export const getActiveField = getActiveFarm;

/**
 * Save or Update a Farm (Section 16, 22, 23 of Master Spec)
 * Supports createNew = true vs createNew = false (preserving ID without duplicates)
 */
export async function saveFarm(farmPayload, createNew = false) {
  const points = farmPayload.boundary || farmPayload.points || [];
  const validation = validateFieldPolygon(points);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const farmName = (farmPayload.name || farmPayload.fieldName || '').trim();
  if (!farmName) {
    throw new Error('Please provide a Farm Name.');
  }

  const areaCalc = calculatePolygonArea(points);
  const perimeterCalc = calculatePolygonPerimeter(points);
  const center = calculatePolygonCenter(points);

  const existingFarms = getFarms();

  // Handle ID generation: If createNew = true or no id provided, generate collision-safe unique ID
  let id = farmPayload.id;
  const isExisting = !createNew && id && existingFarms.some(f => f.id === id);

  if (!isExisting) {
    id = `farm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Preserve existing metadata when updating
  const existingRecord = isExisting ? existingFarms.find(f => f.id === id) : null;

  const farmToSave = {
    id,
    _id: id,
    name: farmName,
    fieldName: farmName,
    farmerName: farmPayload.farmerName || existingRecord?.farmerName || 'Farmer',
    phone: farmPayload.phone || existingRecord?.phone || '',
    farmArea: areaCalc.acres.toFixed(2),
    areaAcres: areaCalc.acres,
    areaHectares: areaCalc.hectares,
    areaSqMeters: areaCalc.sqMeters,
    formattedAcres: areaCalc.formattedAcres,
    formattedHectares: areaCalc.formattedHectares,
    perimeterMeters: perimeterCalc.meters,
    formattedPerimeter: perimeterCalc.formattedPerimeter,
    latitude: center.lat,
    longitude: center.lng,
    center,
    fieldSource: farmPayload.fieldSource || 'gps_polygon',
    boundary: points,
    points,
    cornersCount: points.length,
    crop: farmPayload.crop || existingRecord?.crop || null,
    cropStatus: existingRecord?.cropStatus || 'pending_detection',
    varietyStatus: existingRecord?.varietyStatus || 'pending_detection',
    soilStatus: existingRecord?.soilStatus || 'pending_fetch',
    irrigationStatus: existingRecord?.irrigationStatus || 'pending_inference',
    sowingDateStatus: existingRecord?.sowingDateStatus || 'pending_inference',
    soilType: farmPayload.soilType || existingRecord?.soilType || 'Black Soil / Regur',
    season: farmPayload.season || existingRecord?.season || 'Kharif',
    notes: farmPayload.notes !== undefined ? farmPayload.notes : (existingRecord?.notes || ''),
    gpsAccuracy: farmPayload.gpsAccuracy || 15,
    gpsStatus: farmPayload.gpsStatus || 'GPS Connected',
    createdAt: existingRecord?.createdAt || farmPayload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let updatedList;
  if (isExisting) {
    // Update existing record in-place by ID without duplicating
    updatedList = existingFarms.map(f => f.id === id ? farmToSave : f);
  } else {
    // Prepend newly created farm
    updatedList = [farmToSave, ...existingFarms];
  }

  try {
    localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(updatedList));
    activateFarm(id);
  } catch (err) {
    console.warn('[FieldService] LocalStorage error:', err);
  }

  // Attempt backend async synchronization
  try {
    await api.post('/farmer/fields', farmToSave);
  } catch (_) {}

  return farmToSave;
}

export const saveFieldData = (payload) => saveFarm(payload, !payload.id);

/**
 * Delete a farm by ID (Only when explicitly requested by farmer)
 */
export async function deleteFarm(id) {
  const existingFarms = getFarms();
  const filtered = existingFarms.filter(f => f.id !== id && f._id !== id);

  localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(filtered));
  localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(filtered));

  const activeId = getActiveFarmId();
  if (activeId === id) {
    const nextActive = filtered.length > 0 ? filtered[0].id : null;
    if (nextActive) {
      activateFarm(nextActive);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_FARM_ID);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_FIELD);
      localStorage.removeItem('active_farm_id');
      localStorage.removeItem('farm_data');
    }
  }

  try {
    await api.delete(`/farmer/fields/${id}`);
  } catch (_) {}

  return filtered;
}

export const deleteFieldData = deleteFarm;

/**
 * Section 31 & 37: Legacy Boundary Migration
 * Converts old boundary points (e.g. screen x/y or normalized offsets) to geographic coordinates.
 * Saves result as farm_boundary_geo_points.
 */
export function migrateLegacyBoundaries() {
  if (typeof window === 'undefined') return null;

  try {
    const rawLegacy = localStorage.getItem('farm_boundary_points');
    if (!rawLegacy) return null;

    const parsed = JSON.parse(rawLegacy);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // Check if points are already geographic (lat/lng)
    const isAlreadyGeo = parsed.every(p => typeof p.lat === 'number' && typeof p.lng === 'number');
    if (isAlreadyGeo) {
      localStorage.setItem('farm_boundary_geo_points', JSON.stringify(parsed));
      return parsed;
    }

    // Resolve base latitude and longitude
    let baseLat = parseFloat(localStorage.getItem('farm_location_latitude'));
    let baseLng = parseFloat(localStorage.getItem('farm_location_longitude'));

    if (isNaN(baseLat) || isNaN(baseLng)) {
      baseLat = 20.5937; // Default India center
      baseLng = 78.9629;
    }

    // Convert screen coordinates {x, y} to small geographic degree offsets (~0.0001 deg ~= 11 meters)
    const avgX = parsed.reduce((sum, p) => sum + (p.x || 0), 0) / parsed.length;
    const avgY = parsed.reduce((sum, p) => sum + (p.y || 0), 0) / parsed.length;

    const scaleFactor = 0.00001; // Scale factor for converting pixel offsets to lat/lng

    const migrated = parsed.map(p => {
      const offsetX = ((p.x || 0) - avgX) * scaleFactor;
      const offsetY = ((p.y || 0) - avgY) * scaleFactor;
      return {
        lat: Math.round((baseLat + offsetY) * 100000) / 100000,
        lng: Math.round((baseLng + offsetX) * 100000) / 100000,
        source: 'legacy_migrated'
      };
    });

    localStorage.setItem('farm_boundary_geo_points', JSON.stringify(migrated));
    return migrated;
  } catch (err) {
    console.warn('[FieldService] Legacy migration warning:', err);
    return null;
  }
}

/**
 * Load geographic boundary points for active farm
 */
export function loadGeographicBoundary() {
  if (typeof window === 'undefined') return [];
  const farm = getActiveFarm();
  if (farm && Array.isArray(farm.boundary) && farm.boundary.length > 0) {
    return farm.boundary;
  }
  try {
    const raw = localStorage.getItem('farm_boundary_geo_points');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

/**
 * Save geographic boundary points
 */
export function saveGeographicBoundary(points) {
  if (typeof window === 'undefined' || !Array.isArray(points)) return;
  try {
    localStorage.setItem('farm_boundary_geo_points', JSON.stringify(points));
  } catch (_) {}
}
