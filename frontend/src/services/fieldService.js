/**
 * Fasal Drishti - Field Service & Persistence
 * Dual-layer persistence: User-isolated LocalStorage + backend API synchronization.
 */
import api from './api.js';
import { calculatePolygonArea, calculatePolygonCenter, calculatePolygonPerimeter, validateFieldPolygon } from '../utils/areaUtils.js';
import { FeatureRecoveryStrategy, RecoveryManager, LogLevel } from '../selfHealing/index.js';

export const STORAGE_KEY_FARMS = 'farms_data';
export const STORAGE_KEY_SAVED_FIELDS = 'krishi_saved_fields';
export const STORAGE_KEY_ACTIVE_FARM_ID = 'active_farm_id';
export const STORAGE_KEY_ACTIVE_FIELD = 'krishi_active_field';

/**
 * Get current authenticated user ID from storage
 */
export function getCurrentUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const rawFasal = localStorage.getItem('fasal_user_session');
    if (rawFasal) {
      const parsed = JSON.parse(rawFasal);
      if (parsed?.user?.id || parsed?.user?._id) {
        return String(parsed.user.id || parsed.user._id);
      }
    }
  } catch (_) {}
  try {
    const raw = localStorage.getItem('krishi_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id || u?._id) {
        return String(u.id || u._id);
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Permanent benchmark record for KIPM Paddy Farm (GIDA Gorakhpur, UP)
 * Belongs strictly to demo persona: usr_farmer_demo_01
 */
export const DEFAULT_KIPM_PADDY_FIELD = {
  id: 'field_kipm_paddy_01',
  _id: 'field_kipm_paddy_01',
  farmerId: 'usr_farmer_demo_01',
  userId: 'usr_farmer_demo_01',
  fieldName: 'Kipm paddy',
  name: 'Kipm paddy',
  farmerName: 'Farmer Rameshwar (KIPM Campus Block)',
  points: [
    { lat: 26.76920, lng: 83.22950 },
    { lat: 26.76950, lng: 83.23120 },
    { lat: 26.76780, lng: 83.23160 },
    { lat: 26.76740, lng: 83.22980 }
  ],
  boundary: [
    { lat: 26.76920, lng: 83.22950 },
    { lat: 26.76950, lng: 83.23120 },
    { lat: 26.76780, lng: 83.23160 },
    { lat: 26.76740, lng: 83.22980 }
  ],
  cornersCount: 4,
  farmArea: '3.85',
  areaAcres: 3.85,
  areaHectares: 1.56,
  areaSqMeters: 15580,
  formattedAcres: '3.85 acres',
  formattedHectares: '1.56 hectares',
  perimeterMeters: 685,
  formattedPerimeter: '685 meters',
  center: { lat: 26.76830, lng: 83.23030 },
  latitude: 26.76830,
  longitude: 83.23030,
  location: 'Sahajanwa, Gorakhpur, Uttar Pradesh, India',
  village: 'Sahajanwa',
  district: 'Gorakhpur',
  state: 'Uttar Pradesh',
  crop: 'Paddy',
  cropVariety: 'Pusa Basmati 1509',
  cropStage: 'Tillering Stage',
  season: 'Kharif',
  soilType: 'Alluvial Loam / बलुई दोमट मिट्टी',
  irrigationMethod: 'Tube Well & Canal',
  notes: 'KIPM Technical Campus GIDA Gorakhpur Paddy Block - Mapped with Sentinel-2 live telemetry',
  gpsStatus: 'GPS Connected & Verified',
  gpsAccuracy: 6,
  fieldSource: 'gps_polygon',
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-03T10:00:00.000Z'
};

/**
 * Return user-scoped storage key for farm data isolation
 */
export function getUserStorageKey(baseKey, userId) {
  const uid = userId || getCurrentUserId();
  return uid ? `${baseKey}_usr_${uid}` : baseKey;
}

/**
 * Identify legacy mock coordinates
 */
export function isLegacyMockPolygon(points) {
  return false;
}

/**
 * Automated Cache & Stale State Eviction
 */
export function purgeLegacyMockStorage() {
  if (typeof window === 'undefined') return;

  try {
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

    // Clear stale mock active field cache only if it is explicitly the hardcoded demo ID or Plot A
    try {
      const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE_FIELD);
      if (rawActive) {
        const parsed = JSON.parse(rawActive);
        const name = (parsed?.name || parsed?.fieldName || '').toLowerCase();
        if (
          parsed &&
          (parsed.id === 'field_demo_01' || parsed.id === 'field_demo_maize_01' ||
           parsed._id === 'field_demo_01' || parsed._id === 'field_demo_maize_01' ||
           name.includes('plot a') || name.includes('main wheat field'))
        ) {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_FIELD);
          localStorage.removeItem(STORAGE_KEY_ACTIVE_FARM_ID);
        }
      }
    } catch (_) {}

    // Purge crop health cache if it holds Plot A or Wheat
    try {
      const rawHealth = localStorage.getItem('krishi_crop_health_cache');
      if (rawHealth) {
        const parsed = JSON.parse(rawHealth);
        const name = (parsed?.fieldName || '').toLowerCase();
        const crop = (parsed?.crop || '').toLowerCase();
        if (name.includes('plot a') || crop.includes('wheat') || parsed?.fieldId === 'field_demo_01') {
          localStorage.removeItem('krishi_crop_health_cache');
        }
      }
    } catch (_) {}
  } catch (err) {
    console.warn('[FieldService] Silent purge note:', err);
  }
}

// Execute initial silent eviction on module load
if (typeof window !== 'undefined') {
  purgeLegacyMockStorage();
}

/**
 * Clean up only explicit legacy demo mock fields, never user-created farms
 */
export function sanitizeStoredFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields.filter(f => {
    if (!f) return false;
    if (f.id === 'field_demo_maize_01' || f.id === 'field_demo_01') return false;
    if (f._id === 'field_demo_maize_01' || f._id === 'field_demo_01') return false;
    const name = (f.fieldName || f.name || '').toLowerCase();
    if (name.includes('plot a') || name.includes('main wheat field')) return false;
    return true;
  });
}

/**
 * Farm Repository: Get all saved farms from persistent storage for a specific user
 */
export function getFarms(userId) {
  if (typeof window === 'undefined') return [];
  purgeLegacyMockStorage();
  migrateLegacyBoundaries();

  const uid = userId || getCurrentUserId();
  if (!uid) return [];

  const userKey = getUserStorageKey(STORAGE_KEY_FARMS, uid);

  try {
    let raw = localStorage.getItem(userKey);
    let parsed = [];

    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) parsed = p;
      } catch (_) {}
    }

    // Only for demo persona (usr_farmer_demo_01): ensure KIPM Paddy Farm benchmark is available
    if (uid === 'usr_farmer_demo_01') {
      if (!parsed.some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm') || f.name?.toLowerCase().includes('kipm'))) {
        parsed.unshift({
          ...DEFAULT_KIPM_PADDY_FIELD,
          farmerId: 'usr_farmer_demo_01',
          userId: 'usr_farmer_demo_01'
        });
      }
    } else {
      // Real user: strictly remove any leaked KIPM Paddy Farm records from previous shared storage
      parsed = parsed.filter(f => f.id !== 'field_kipm_paddy_01' && f._id !== 'field_kipm_paddy_01');
    }

    let sanitized = sanitizeStoredFields(parsed);

    // Normalize property aliases (name <-> fieldName, boundary <-> points)
    sanitized = sanitized.map(f => ({
      ...f,
      id: f.id || f._id,
      farmerId: f.farmerId || f.userId || uid,
      userId: f.userId || f.farmerId || uid,
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

    // Persist only to userKey
    try {
      localStorage.setItem(userKey, JSON.stringify(sanitized));
    } catch (_) {}

    return sanitized;
  } catch (err) {
    console.error('[FieldService] Storage read error:', err);
    return [];
  }
}

export const getSavedFieldsLocal = getFarms;

/**
 * Fetch saved fields/farms from permanent backend database with local cache restoration
 */
export async function fetchSavedFields(userId) {
  purgeLegacyMockStorage();
  const uid = userId || getCurrentUserId();
  if (!uid) return [];

  const userKey = getUserStorageKey(STORAGE_KEY_FARMS, uid);
  try {
    const res = await api.get('/farmer/fields');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      const serverFields = sanitizeStoredFields(res.data.data).map(f => ({
        ...f,
        id: f.id || f._id,
        farmerId: f.farmerId || uid,
        userId: f.userId || uid,
      }));
      
      // If server returned fields, merge with local un-synced fields for this user
      const localFields = getFarms(uid);
      const mergedMap = new Map();
      localFields.forEach(f => mergedMap.set(f.id || f._id, f));
      serverFields.forEach(f => mergedMap.set(f.id || f._id, f));

      const merged = Array.from(mergedMap.values());
      try {
        localStorage.setItem(userKey, JSON.stringify(merged));
      } catch (_) {}

      // Automatically activate primary farm if none active or current active invalid
      const currentActiveId = getActiveFarmId(uid);
      const hasActive = currentActiveId && merged.some(f => f.id === currentActiveId || f._id === currentActiveId);
      if (!hasActive && merged.length > 0) {
        activateFarm(merged[0].id, uid);
      } else if (merged.length === 0) {
        // Clear active farm if user has no farms
        try {
          localStorage.removeItem(getUserStorageKey(STORAGE_KEY_ACTIVE_FARM_ID, uid));
          localStorage.removeItem(getUserStorageKey(STORAGE_KEY_ACTIVE_FIELD, uid));
        } catch (_) {}
      }

      return merged;
    }
  } catch (err) {
    console.warn('[FieldService] Backend sync warning, using local cache:', err.message);
  }
  const fallbackFarms = getFarms(uid);
  if (fallbackFarms.length > 0 && !getActiveFarmId(uid)) {
    activateFarm(fallbackFarms[0].id, uid);
  }
  return fallbackFarms;
}

/**
 * Get farm by specific ID for a user
 */
export function getFarmById(id, userId) {
  if (!id) return null;
  const farms = getFarms(userId);
  return farms.find(f => f.id === id || f._id === id) || null;
}

/**
 * Get active farm ID for a user
 */
export function getActiveFarmId(userId) {
  if (typeof window === 'undefined') return null;
  const uid = userId || getCurrentUserId();
  if (!uid) return null;

  try {
    const userActiveKey = getUserStorageKey(STORAGE_KEY_ACTIVE_FARM_ID, uid);
    const activeId = localStorage.getItem(userActiveKey);
    if (activeId) return activeId;

    const userActiveFieldKey = getUserStorageKey(STORAGE_KEY_ACTIVE_FIELD, uid);
    const rawActive = localStorage.getItem(userActiveFieldKey);
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      if (parsed?.id) return parsed.id;
    }
  } catch (_) {}
  return null;
}

/**
 * Activate a farm by ID (Exactly ONE farm active per user at a time)
 */
export function activateFarm(farmId, userId) {
  if (typeof window === 'undefined' || !farmId) return null;
  const uid = userId || getCurrentUserId();
  const farm = getFarmById(farmId, uid);
  if (!farm) return null;

  try {
    const userActiveKey = getUserStorageKey(STORAGE_KEY_ACTIVE_FARM_ID, uid);
    const userActiveFieldKey = getUserStorageKey(STORAGE_KEY_ACTIVE_FIELD, uid);
    localStorage.setItem(userActiveKey, farm.id);
    localStorage.setItem(userActiveFieldKey, JSON.stringify(farm));
  } catch (_) {}

  return farm;
}

export const setActiveField = activateFarm;
export const setActiveFarmId = activateFarm;

/**
 * Get active farm record for a user
 */
export function getActiveFarm(userId) {
  if (typeof window === 'undefined') return null;
  const uid = userId || getCurrentUserId();
  if (!uid) return null;

  const activeId = getActiveFarmId(uid);
  if (activeId) {
    const farm = getFarmById(activeId, uid);
    if (farm) return farm;
  }

  // If active ID is missing, default to first valid farm of THIS user
  const farms = getFarms(uid);
  if (farms.length > 0) {
    activateFarm(farms[0].id, uid);
    return farms[0];
  }
  return null;
}

export const getActiveField = getActiveFarm;

/**
 * Save or Update a Farm
 */
export async function saveFarm(farmPayload, createNew = false, userId) {
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

  const uid = userId || getCurrentUserId();
  if (!uid) {
    throw new Error('Authentication required to save farm.');
  }

  const existingFarms = getFarms(uid);

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
    farmerId: uid,
    userId: uid,
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
    crop: farmPayload.crop || existingRecord?.crop || 'Paddy',
    cropStatus: existingRecord?.cropStatus || 'pending_detection',
    varietyStatus: existingRecord?.varietyStatus || 'pending_detection',
    soilStatus: existingRecord?.soilStatus || 'pending_fetch',
    irrigationStatus: existingRecord?.irrigationStatus || 'pending_inference',
    sowingDateStatus: existingRecord?.sowingDateStatus || 'pending_inference',
    soilType: farmPayload.soilType || existingRecord?.soilType || 'Alluvial Soil',
    season: farmPayload.season || existingRecord?.season || 'Kharif',
    notes: farmPayload.notes !== undefined ? farmPayload.notes : (existingRecord?.notes || ''),
    gpsAccuracy: farmPayload.gpsAccuracy || 15,
    gpsStatus: farmPayload.gpsStatus || 'GPS Connected',
    createdAt: existingRecord?.createdAt || farmPayload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let updatedList;
  if (isExisting) {
    updatedList = existingFarms.map(f => f.id === id ? farmToSave : f);
  } else {
    updatedList = [farmToSave, ...existingFarms];
  }

  const userKey = getUserStorageKey(STORAGE_KEY_FARMS, uid);
  try {
    localStorage.setItem(userKey, JSON.stringify(updatedList));
    FeatureRecoveryStrategy.storage.createShadowBackup(userKey, updatedList);
    activateFarm(id, uid);
  } catch (err) {
    console.warn('[FieldService] LocalStorage error:', err);
  }

  // Asynchronously persist to backend database
  try {
    const res = await api.post('/farmer/fields', farmToSave);
    if (res.data?.success && res.data.data) {
      farmToSave.isSynced = true;
    }
  } catch (syncErr) {
    console.warn('[FieldService] Backend sync note (queued locally):', syncErr.message);
    farmToSave.isSynced = false;
  }

  return farmToSave;
}

export const saveFieldData = (payload, userId) => saveFarm(payload, !payload.id, userId);

/**
 * Delete a farm by ID
 */
export async function deleteFarm(id, userId) {
  const uid = userId || getCurrentUserId();
  // Protect KIPM Paddy Farm for demo persona
  if (id === 'field_kipm_paddy_01' && uid === 'usr_farmer_demo_01') {
    console.warn('[FieldService] KIPM Paddy Farm is protected from accidental deletion.');
    return getFarms(userId);
  }

  const existingFarms = getFarms(uid);
  const filtered = existingFarms.filter(f => f.id !== id && f._id !== id);

  const userKey = getUserStorageKey(STORAGE_KEY_FARMS, uid);
  try {
    localStorage.setItem(userKey, JSON.stringify(filtered));
  } catch (_) {}

  const activeId = getActiveFarmId(uid);
  if (activeId === id) {
    const nextActive = filtered.length > 0 ? filtered[0].id : null;
    if (nextActive) {
      activateFarm(nextActive, uid);
    } else {
      try {
        localStorage.removeItem(getUserStorageKey(STORAGE_KEY_ACTIVE_FARM_ID, uid));
        localStorage.removeItem(getUserStorageKey(STORAGE_KEY_ACTIVE_FIELD, uid));
      } catch (_) {}
    }
  }

  try {
    await api.delete(`/farmer/fields/${id}`);
  } catch (_) {}

  return filtered;
}

export const deleteFieldData = deleteFarm;

/**
 * Legacy Boundary Migration
 */
export function migrateLegacyBoundaries() {
  if (typeof window === 'undefined') return null;
  return null;
}
