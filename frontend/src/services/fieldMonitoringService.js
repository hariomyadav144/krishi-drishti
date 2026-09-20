import api from './api';

/**
 * Fasal Drishti - Autonomous Field Monitoring Service
 * Communicates with backend endpoints for continuous Sentinel optical checks,
 * weather/soil water balance, proactive advisories, and historical comparison.
 */

// Fetch latest observation for a specific field (auto-generates if fresh run needed)
export async function fetchLatestObservation(fieldId) {
  const res = await api.get(`/field-monitoring/latest/${fieldId}`);
  return res.data;
}

// Manually trigger a fresh monitoring pipeline cycle
export async function triggerMonitoringRun(fieldId) {
  const res = await api.post(`/field-monitoring/run/${fieldId}`);
  return res.data;
}

// Fetch multi-temporal observations for graphs
export async function fetchFieldHistory(fieldId, limit = 30) {
  const res = await api.get(`/field-monitoring/history/${fieldId}?limit=${limit}`);
  return res.data;
}

// Compare current observation with historical baseline (7d, 15d, 30d, previous)
export async function compareFieldObservations(fieldId, period = '7d') {
  const res = await api.get(`/field-monitoring/compare/${fieldId}?period=${period}`);
  return res.data;
}

// Save soil test report and link permanently to field
export async function uploadSoilTest(fieldId, soilData) {
  const res = await api.post(`/field-monitoring/soil-test/${fieldId}`, soilData);
  return res.data;
}

// Get quick monitoring indicators for all farmer fields
export async function fetchMonitoringDashboardSummary() {
  const res = await api.get('/field-monitoring/dashboard-summary');
  return res.data?.data || [];
}

// Get closed-loop action items for a field
export async function fetchFieldActions(fieldId) {
  const res = await api.get(`/field-monitoring/actions/${fieldId}`);
  return res.data?.data || [];
}

// Update action item status (e.g. 'completed', 'verifying', 'resolved')
export async function updateActionStatus(actionId, status, notes = '') {
  const res = await api.post(`/field-monitoring/action/${actionId}/status`, { status, notes });
  return res.data;
}

// Ingest real-time IoT soil sensor or manual observation telemetry
export async function ingestFieldTelemetry(fieldId, telemetry) {
  const res = await api.post(`/field-monitoring/telemetry/${fieldId}`, telemetry);
  return res.data;
}

// Mark an alert as acknowledged / read
export async function markAlertRead(alertId) {
  const res = await api.put(`/field-monitoring/alert/${alertId}/read`);
  return res.data;
}

export default {
  fetchLatestObservation,
  triggerMonitoringRun,
  fetchFieldHistory,
  compareFieldObservations,
  uploadSoilTest,
  fetchMonitoringDashboardSummary,
  fetchFieldActions,
  updateActionStatus,
  ingestFieldTelemetry,
  markAlertRead
};
