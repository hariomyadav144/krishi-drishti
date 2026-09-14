/**
 * Krishi Drishti - Field Service & Persistence
 * Dual-layer persistence: LocalStorage fallback + backend API synchronization.
 */
import api from './api';
import { calculatePolygonArea, calculatePolygonCenter, validateFieldPolygon } from '../utils/areaUtils';
import { SAMPLE_DEMO_FIELD_BOUNDARY } from '../utils/gpsUtils';

const STORAGE_KEY_SAVED_FIELDS = 'krishi_saved_fields';
const STORAGE_KEY_ACTIVE_FIELD = 'krishi_active_field';

// Calculate initial demo area from actual demo coordinates
const initialDemoArea = calculatePolygonArea(SAMPLE_DEMO_FIELD_BOUNDARY);
const initialDemoCenter = calculatePolygonCenter(SAMPLE_DEMO_FIELD_BOUNDARY);

// Pre-seeded initial field so users see an immediate working demonstration
const DEFAULT_INITIAL_FIELD = {
  id: 'field_demo_maize_01',
  fieldName: 'North Plot - Maize Block',
  crop: 'Maize',
  season: 'Kharif',
  farmerName: 'Rameshwar Patil',
  soilType: 'Black Soil / Regur',
  notes: 'Drip irrigation installed. High density hybrid planting with mulch.',
  points: SAMPLE_DEMO_FIELD_BOUNDARY,
  center: initialDemoCenter,
  areaAcres: initialDemoArea.acres,
  areaHectares: initialDemoArea.hectares,
  areaSqMeters: initialDemoArea.sqMeters,
  formattedAcres: initialDemoArea.formattedAcres,
  formattedHectares: initialDemoArea.formattedHectares,
  cornersCount: SAMPLE_DEMO_FIELD_BOUNDARY.length,
  gpsStatus: 'GPS Connected',
  gpsAccuracy: 18,
  createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Get all saved fields from localStorage
 */
export function getSavedFieldsLocal() {
  if (typeof window === 'undefined') return [DEFAULT_INITIAL_FIELD];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_FIELDS);
    if (!raw) {
      // Initialize with preloaded sample field
      localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify([DEFAULT_INITIAL_FIELD]));
      return [DEFAULT_INITIAL_FIELD];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [DEFAULT_INITIAL_FIELD];
  } catch (err) {
    console.warn('[FieldService] Error reading saved fields:', err);
    return [DEFAULT_INITIAL_FIELD];
  }
}

/**
 * Fetch saved fields (Attempts backend, falls back to local storage)
 */
export async function fetchSavedFields() {
  try {
    const res = await api.get('/farmer/fields');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      // Sync local storage with backend copy
      localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(res.data.data));
      return res.data.data;
    }
  } catch (_) {
    // Cloud sleeping or route not yet deployed, fallback gracefully
  }
  return getSavedFieldsLocal();
}

/**
 * Save or update a field polygon
 */
export async function saveFieldData(fieldPayload) {
  const { points, fieldName, crop, season, notes, farmerName, soilType, gpsAccuracy } = fieldPayload;

  const validation = validateFieldPolygon(points);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!fieldName || !fieldName.trim()) {
    throw new Error('Please provide a descriptive Field Name.');
  }

  if (!crop || !crop.trim()) {
    throw new Error('Please select a Crop for this field.');
  }

  const areaCalc = calculatePolygonArea(points);
  const center = calculatePolygonCenter(points);

  const existingFields = getSavedFieldsLocal();
  const id = fieldPayload.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const isExisting = existingFields.some(f => f.id === id);

  const fieldToSave = {
    id,
    fieldName: fieldName.trim(),
    crop: crop.trim(),
    season: season || 'Kharif',
    farmerName: farmerName || 'Rameshwar Patil',
    soilType: soilType || 'Black Soil / Regur',
    notes: notes ? notes.trim() : '',
    points,
    center,
    areaAcres: areaCalc.acres,
    areaHectares: areaCalc.hectares,
    areaSqMeters: areaCalc.sqMeters,
    formattedAcres: areaCalc.formattedAcres,
    formattedHectares: areaCalc.formattedHectares,
    cornersCount: points.length,
    gpsStatus: gpsAccuracy ? `GPS Connected (±${gpsAccuracy}m)` : 'GPS Connected',
    gpsAccuracy: gpsAccuracy || 20,
    createdAt: fieldPayload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let updatedList;
  if (isExisting) {
    updatedList = existingFields.map(f => f.id === id ? fieldToSave : f);
  } else {
    updatedList = [fieldToSave, ...existingFields];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_ACTIVE_FIELD, JSON.stringify(fieldToSave));
  } catch (err) {
    console.warn('[FieldService] LocalStorage error:', err);
  }

  // Attempt backend async synchronization
  try {
    await api.post('/farmer/fields', fieldToSave);
  } catch (_) {
    // Cloud offline / stateless fallback continues smoothly
  }

  return fieldToSave;
}

/**
 * Delete a saved field by ID
 */
export async function deleteFieldData(id) {
  const existingFields = getSavedFieldsLocal();
  const filtered = existingFields.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY_SAVED_FIELDS, JSON.stringify(filtered));

  const active = getActiveField();
  if (active && active.id === id) {
    const nextActive = filtered.length > 0 ? filtered[0] : null;
    if (nextActive) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_FIELD, JSON.stringify(nextActive));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_FIELD);
    }
  }

  try {
    await api.delete(`/farmer/fields/${id}`);
  } catch (_) {}

  return filtered;
}

/**
 * Get active selected field for Spatial Anchor & Satellite NDVI
 */
export function getActiveField() {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_FIELD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_FIELD);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.points && parsed.points.length >= 3) {
        return parsed;
      }
    }
    const all = getSavedFieldsLocal();
    return all.length > 0 ? all[0] : DEFAULT_INITIAL_FIELD;
  } catch (_) {
    return DEFAULT_INITIAL_FIELD;
  }
}

/**
 * Set active field
 */
export function setActiveField(field) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_FIELD, JSON.stringify(field));
  } catch (_) {}
}
