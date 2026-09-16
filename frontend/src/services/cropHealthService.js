import api from './api';

/**
 * Fetch latest calculated crop health for a given field
 * Returns null if no real field or calculation exists yet
 */
export async function fetchLatestCropHealth(fieldId = 'default') {
  try {
    const res = await api.get(`/crop-health/latest/${fieldId}`);
    if (res?.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[cropHealthService] fetchLatestCropHealth note:', err.message);
  }
  return null;
}

/**
 * Fetch multi-field crop health summaries
 * Returns array of field health summaries or empty array if no fields added
 */
export async function fetchCropHealthSummary() {
  try {
    const res = await api.get('/crop-health/summary');
    if (res?.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[cropHealthService] fetchCropHealthSummary note:', err.message);
  }
  return [];
}

/**
 * Fetch permanent time-series health history records
 */
export async function fetchCropHealthHistory(fieldId = 'default', period = '30d') {
  try {
    const res = await api.get(`/crop-health/history/${fieldId}?period=${period}`);
    if (res?.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[cropHealthService] fetchCropHealthHistory note:', err.message);
  }
  return [];
}

/**
 * Trigger immediate recalculation of crop health
 */
export async function recalculateCropHealth(fieldId = 'default') {
  try {
    const res = await api.post(`/crop-health/recalculate/${fieldId}`);
    if (res?.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[cropHealthService] recalculateCropHealth note:', err.message);
  }
  return null;
}
