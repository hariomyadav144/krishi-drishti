/**
 * Krishi Drishti - True Geolocation & GPS Utilities
 * Real HTML5 GPS tracking with fallback error diagnostics and testing controls.
 */

// Configurable Desktop / Laptop Demo Location (Pimpalgaon Baswant Farm Cluster, Nashik, Maharashtra)
export const DEFAULT_DEMO_COORDINATE = {
  lat: 20.1738,
  lng: 73.9856,
  name: 'Pimpalgaon Baswant Agri-Plot #4 (Nashik)',
  accuracy: 12,
  isDemo: true
};

/**
 * Pre-configured realistic irregular farm boundary for demo & instant exploration
 * (~8.95 acres field in Pimpalgaon Baswant, Nashik)
 */
export const SAMPLE_DEMO_FIELD_BOUNDARY = [
  { lat: 20.17316, lng: 73.98476 },
  { lat: 20.17463, lng: 73.98465 },
  { lat: 20.17495, lng: 73.98571 },
  { lat: 20.17474, lng: 73.98665 },
  { lat: 20.17400, lng: 73.98655 },
  { lat: 20.17326, lng: 73.98644 },
  { lat: 20.17305, lng: 73.98560 },
];

/**
 * Request real device GPS using browser navigator.geolocation
 */
export function getDeviceLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser or device.',
        userMessage: 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है। Geolocation is not supported by this device.'
      });
      return;
    }

    const config = {
      enableHighAccuracy: true,
      timeout: options.timeout || 15000,
      maximumAge: 0, // Always request fresh fix
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
          isDemo: false
        });
      },
      (error) => {
        let userMessage = '';
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            userMessage = 'Location permission was denied. Please allow location access in your browser or OS settings and try again.';
            break;
          case 2: // POSITION_UNAVAILABLE
            userMessage = 'GPS position is currently unavailable. Ensure device location is turned on and you have a clear sky view.';
            break;
          case 3: // TIMEOUT
            userMessage = 'GPS request timed out. Please try again outdoors for a stronger satellite fix.';
            break;
          default:
            userMessage = error.message || 'Unable to retrieve location.';
        }

        reject({
          code: error.code,
          message: error.message,
          userMessage
        });
      },
      config
    );
  });
}

/**
 * Human readable formatting for GPS accuracy
 */
export function formatGpsAccuracy(accuracyMeters) {
  if (!accuracyMeters && accuracyMeters !== 0) return 'GPS Waiting';
  if (accuracyMeters <= 10) return `±${accuracyMeters}m (Survey Grade)`;
  if (accuracyMeters <= 30) return `±${accuracyMeters}m (High Precision GPS)`;
  if (accuracyMeters <= 100) return `±${accuracyMeters}m (Standard GPS)`;
  return `±${accuracyMeters}m (Cell/WiFi Estimated)`;
}
