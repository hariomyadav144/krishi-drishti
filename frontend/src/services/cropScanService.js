import api from './api';

/**
 * Krishi Drishti - Crop Scan & Permanent History Service
 * Connects directly to backend MongoDB Atlas endpoints.
 */

export async function fetchCropScans(filters = {}) {
  const params = new URLSearchParams();
  if (filters.crop && filters.crop !== 'All') params.append('crop', filters.crop);
  if (filters.fieldId && filters.fieldId !== 'All') params.append('fieldId', filters.fieldId);
  if (filters.healthStatus && filters.healthStatus !== 'All') params.append('healthStatus', filters.healthStatus);
  if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
  if (filters.search) params.append('search', filters.search);

  const res = await api.get(`/crop-scans?${params.toString()}`);
  return res.data?.data || [];
}

export async function fetchCropScanById(scanId) {
  const res = await api.get(`/crop-scans/detail/${scanId}`);
  return res.data?.data || null;
}

export async function saveCropScan(formData) {
  const res = await api.post('/crop-scans', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function compareCropScans(oldScanId, newScanId, language = 'hi') {
  const res = await api.post('/crop-scans/compare', {
    oldScanId,
    newScanId,
    language
  });
  return res.data?.data || null;
}

export async function deleteCropScan(scanId) {
  const res = await api.delete(`/crop-scans/${scanId}`);
  return res.data;
}

export async function fetchCropTimeline(cropName) {
  const res = await api.get(`/crop-scans/timeline/${encodeURIComponent(cropName)}`);
  return res.data?.timeline || [];
}

export async function fetchCropHistoryStats() {
  const res = await api.get('/crop-scans/stats');
  return res.data?.data || null;
}
