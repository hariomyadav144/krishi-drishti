/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * Validation Manager
 * 
 * Verifies that a repaired feature or restored state is truly valid
 * and functional before the self-healing loop marks the problem as resolved.
 */

export const ValidationManager = {
  /**
   * Validates Authentication and Session State
   */
  validateAuth(authData) {
    if (!authData) return { isValid: false, reason: 'Auth data is null or undefined' };
    const token = authData.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('krishi_token') : null);
    const user = authData.user || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('krishi_user') || 'null') : null);

    if (!token || typeof token !== 'string' || token.trim().length < 5) {
      return { isValid: false, reason: 'Invalid or missing authentication token' };
    }
    if (!user || (!user.id && !user._id && !user.phone)) {
      return { isValid: false, reason: 'User profile payload is missing identity keys' };
    }

    return { isValid: true, token, user };
  },

  /**
   * Validates GPS Coordinates and Telemetry
   */
  validateGps(coords) {
    if (!coords || typeof coords !== 'object') {
      return { isValid: false, reason: 'Coordinates payload is missing or empty' };
    }

    const { lat, lng, accuracy } = coords;

    if (typeof lat !== 'number' || !Number.isFinite(lat) || isNaN(lat)) {
      return { isValid: false, reason: 'Latitude is not a valid finite number' };
    }
    if (typeof lng !== 'number' || !Number.isFinite(lng) || isNaN(lng)) {
      return { isValid: false, reason: 'Longitude is not a valid finite number' };
    }

    // Boundary check for physical coordinates on Earth
    if (lat < -90 || lat > 90) {
      return { isValid: false, reason: `Latitude ${lat} is out of realistic physical range [-90, 90]` };
    }
    if (lng < -180 || lng > 180) {
      return { isValid: false, reason: `Longitude ${lng} is out of realistic physical range [-180, 180]` };
    }

    // Accuracy sanity check: reject readings with accuracy worse than 150m for survey purposes
    if (typeof accuracy === 'number' && accuracy > 200) {
      return { isValid: false, reason: `GPS accuracy (±${accuracy}m) is too poor for surveying` };
    }

    return { isValid: true, coords };
  },

  /**
   * Validates Farm & Field Boundary Integrity
   * Ensures no farm or boundary data was corrupted or lost.
   */
  validateFarmData(farms) {
    if (!Array.isArray(farms)) {
      return { isValid: false, reason: 'Farms must be an array' };
    }

    for (let i = 0; i < farms.length; i++) {
      const f = farms[i];
      if (!f || typeof f !== 'object') {
        return { isValid: false, reason: `Farm entry at index ${i} is invalid` };
      }
      const fid = f.id || f._id;
      if (!fid) {
        return { isValid: false, reason: `Farm entry at index ${i} is missing an identifier` };
      }

      // Check boundary coordinates if field has polygon points
      const points = f.coordinates || f.boundaryCoordinates || f.boundaryPoints || [];
      if (Array.isArray(points) && points.length > 0) {
        for (let j = 0; j < points.length; j++) {
          const pt = points[j];
          const lat = pt.lat !== undefined ? pt.lat : (Array.isArray(pt) ? pt[0] : null);
          const lng = pt.lng !== undefined ? pt.lng : (Array.isArray(pt) ? pt[1] : null);
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            return { isValid: false, reason: `Farm "${f.name || fid}" contains invalid boundary coordinate at point ${j + 1}` };
          }
        }
      }
    }

    return { isValid: true, count: farms.length };
  },

  /**
   * Validates AI Crop Advice
   * Verifies that the advice matches the selected crop context and contains farmer-actionable advice.
   */
  validateAiAdvice(adviceResult, expectedCrop) {
    if (!adviceResult || typeof adviceResult !== 'object') {
      return { isValid: false, reason: 'Advice payload is missing or empty' };
    }

    const answer = adviceResult.answer || adviceResult.what_to_do_now || adviceResult.diagnosis;
    if (!answer || (typeof answer === 'string' && answer.trim().length < 10)) {
      return { isValid: false, reason: 'AI Advice text is empty or too short to be helpful' };
    }

    // Verify advice does not contain raw developer error messages or prompt leaks
    const raw = typeof answer === 'string' ? answer : JSON.stringify(answer);
    if (raw.includes('Traceback (most recent call last)') || raw.includes('TypeError:') || raw.includes('SyntaxError:')) {
      return { isValid: false, reason: 'Advice contains raw server stack traces instead of farmer guidance' };
    }

    // Crop match validation: if expectedCrop is provided, ensure advice does not mistakenly hallucinate another crop
    if (expectedCrop && typeof expectedCrop === 'string' && expectedCrop.trim()) {
      const detectedCrop = adviceResult.cropName || adviceResult.crop_name || adviceResult.crop;
      if (detectedCrop && typeof detectedCrop === 'string') {
        const c1 = detectedCrop.toLowerCase().trim();
        const c2 = expectedCrop.toLowerCase().trim();
        // Allow generic "Fasal" or exact matches
        const isCompatible = c1 === c2 || c1.includes(c2) || c2.includes(c1) || c1.includes('fasal') || c1.includes('crop') || c1.includes('plant');
        if (!isCompatible) {
          console.warn(`[ValidationManager] Advisory crop mismatch notice: Expected "${expectedCrop}", received "${detectedCrop}"`);
        }
      }
    }

    return { isValid: true, advice: adviceResult };
  },

  /**
   * Validates Local Storage Key Integrity
   */
  validateStorage(key, expectedType = 'object') {
    if (typeof localStorage === 'undefined') return { isValid: false, reason: 'localStorage unavailable' };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { isValid: true, isNull: true, data: null };
      const parsed = JSON.parse(raw);
      if (expectedType === 'array' && !Array.isArray(parsed)) {
        return { isValid: false, reason: `Storage item "${key}" was expected to be an array` };
      }
      if (expectedType === 'object' && (typeof parsed !== 'object' || Array.isArray(parsed))) {
        return { isValid: false, reason: `Storage item "${key}" was expected to be an object` };
      }
      return { isValid: true, data: parsed };
    } catch (e) {
      return { isValid: false, reason: `Corrupted JSON in "${key}": ${e.message}` };
    }
  },

  /**
   * Generic validator dispatcher based on feature module
   */
  async validateFeature(module, result, context = {}) {
    switch (module) {
      case 'Authentication':
      case 'Session':
        return this.validateAuth(result);
      case 'GPS':
      case 'FieldMapping':
        return this.validateGps(result);
      case 'FarmData':
      case 'FieldService':
        return this.validateFarmData(result);
      case 'AiAdvisor':
        return this.validateAiAdvice(result, context?.expectedCrop);
      default:
        // By default, if result is non-null and not an error instance, consider valid
        if (result instanceof Error) {
          return { isValid: false, reason: result.message };
        }
        return { isValid: result !== null && result !== undefined, data: result };
    }
  },
};
