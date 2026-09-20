/**
 * Fasal Drishti - True Geolocation & GPS Utilities
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
 * Clean boundary default - zero pre-allocated points so farmer always begins at Point 1
 */
export const SAMPLE_DEMO_FIELD_BOUNDARY = [];

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
  if (accuracyMeters <= 25) return `±${accuracyMeters}m (High Precision)`;
  if (accuracyMeters <= 60) return `±${accuracyMeters}m (Acceptable)`;
  return `±${accuracyMeters}m (Low Accuracy)`;
}

/**
 * GPS Quality Control Validator (Section 5 of Master Spec)
 * Validates timestamp freshness (< 20s) and accuracy tiers.
 */
export function validateGpsQuality(position) {
  if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number') {
    return {
      isValid: false,
      isStale: true,
      reason: 'no_fix',
      quality: 'poor',
      accuracyTier: 'poor',
      accuracy: null,
      message: 'No valid GPS fix received yet.'
    };
  }

  // Reject readings older than 20 seconds
  const now = Date.now();
  const positionTime = position.timestamp || now;
  const isStale = (now - positionTime) > 20000;
  if (isStale) {
    return {
      isValid: false,
      isStale: true,
      reason: 'stale',
      quality: 'poor',
      accuracyTier: 'poor',
      accuracy: position.accuracy,
      message: 'GPS reading is stale (> 20s old). Waiting for fresh satellite update.'
    };
  }

  const accuracy = typeof position.accuracy === 'number' ? position.accuracy : 999;

  let quality = 'poor';
  let reason = accuracy > 60 ? 'poor_accuracy' : null;
  let message = 'GPS accuracy is low. Move outdoors and wait for a better GPS fix.';

  if (accuracy <= 10) {
    quality = 'good';
    message = `Survey-grade GPS fix (±${accuracy}m). Excellent for boundary marking.`;
  } else if (accuracy <= 25) {
    quality = 'acceptable';
    message = `High precision GPS fix (±${accuracy}m). Ready to mark boundary.`;
  } else if (accuracy <= 60) {
    quality = 'improving';
    message = `Acceptable GPS fix (±${accuracy}m). Move to clear sky for higher accuracy.`;
  } else {
    quality = 'poor';
    message = `GPS accuracy is low (±${accuracy}m). Move outdoors and wait for a better GPS fix.`;
  }

  return {
    isValid: quality !== 'poor',
    isStale: false,
    reason,
    quality,
    accuracyTier: quality,
    accuracy,
    message
  };
}

/**
 * Continuous GPS Location Stream (Section 4 & 6 of Master Spec)
 * Listens to live location updates using navigator.geolocation.watchPosition.
 * Returns an unsubscribe / cleanup function.
 */
export function watchDeviceLocation(onPosition, onError, options = {}) {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    if (onError) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by your device.',
        userMessage: 'आपके डिवाइस में GPS सुविधा उपलब्ध नहीं है।'
      });
    }
    return () => {};
  }

  const config = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: options.timeout || 15000,
    ...options
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const parsed = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp || Date.now(),
        isDemo: false
      };
      if (onPosition) onPosition(parsed);
    },
    (error) => {
      let userMessage = '';
      switch (error.code) {
        case 1:
          userMessage = 'Location permission was denied. Please enable GPS permissions.';
          break;
        case 2:
          userMessage = 'GPS position unavailable. Ensure device location is on and sky is clear.';
          break;
        case 3:
          userMessage = 'GPS request timed out. Trying to acquire fresh satellite fix...';
          break;
        default:
          userMessage = error.message || 'GPS location error.';
      }
      if (onError) onError({ code: error.code, message: error.message, userMessage });
    },
    config
  );

  return () => {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch (_) {}
  };
}

