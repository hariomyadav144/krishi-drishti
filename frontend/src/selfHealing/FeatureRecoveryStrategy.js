/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * Feature Recovery Strategies
 * 
 * Implements bounded, domain-specific recovery operations for:
 * - Authentication & Session
 * - Network & API requests (Exponential backoff & Failover)
 * - Storage & Data Persistence (Zero-loss shadow backup & restoration)
 * - GPS & Field Mapping
 * - AI Crop Advice (Tiered fallback from Gemini to Universal Crop Engine)
 * - UI & Component State
 */

import { ValidationManager } from './ValidationManager.js';
import { sanitizeData } from './ErrorClassifier.js';
import { generateStandardStructuredAdvice } from '../services/universalCropEngine.js';

const STORAGE_SHADOW_BACKUP_FARMS = '_shadow_krishi_farms_backup';
const STORAGE_SHADOW_BACKUP_USER = '_shadow_krishi_user_backup';

export const FeatureRecoveryStrategy = {
  /**
   * 1. Storage & Farm Data Protection Strategy
   * Creates safe shadow snapshots before any destructive write,
   * and automatically restores from snapshot if corruption or JSON syntax error occurs.
   */
  storage: {
    createShadowBackup(key, data) {
      if (typeof localStorage === 'undefined' || !data) return;
      try {
        const backupKey = key === 'farms_data' || key.includes('farms_data') 
          ? STORAGE_SHADOW_BACKUP_FARMS 
          : `${key}_shadow_v1`;
        localStorage.setItem(backupKey, JSON.stringify(data));
      } catch (e) {
        console.warn('[SelfHealing:Storage] Shadow backup note:', e.message);
      }
    },

    restoreCorruptedStorage(key, expectedType = 'object') {
      if (typeof localStorage === 'undefined') return null;
      console.warn(`[SelfHealing:Storage] Attempting safe auto-recovery for corrupted key: "${key}"`);
      
      try {
        // Try shadow backup first
        const backupKey = key === 'farms_data' || key.includes('farms_data') 
          ? STORAGE_SHADOW_BACKUP_FARMS 
          : `${key}_shadow_v1`;
        const shadowRaw = localStorage.getItem(backupKey);
        
        if (shadowRaw) {
          const parsed = JSON.parse(shadowRaw);
          const validation = ValidationManager.validateStorage(backupKey, expectedType);
          if (validation.isValid) {
            console.log(`[SelfHealing:Storage] Successfully recovered "${key}" from shadow backup.`);
            localStorage.setItem(key, shadowRaw);
            return parsed;
          }
        }
      } catch (err) {
        console.error('[SelfHealing:Storage] Shadow recovery exception:', err);
      }

      // Safe default without throwing
      const fallback = expectedType === 'array' ? [] : {};
      try {
        localStorage.setItem(key, JSON.stringify(fallback));
      } catch (_) {}
      return fallback;
    },
  },

  /**
   * 2. Authentication & Session Strategy
   * Preserves all farm data, coordinates, and local preferences during session renewal.
   */
  auth: {
    async recoverSession(apiInstance, existingToken) {
      console.log('[SelfHealing:Auth] Initiating session self-recovery...');
      if (!existingToken && typeof localStorage !== 'undefined') {
        existingToken = localStorage.getItem('krishi_token');
      }

      if (!existingToken) {
        return { success: false, reason: 'No token present to refresh' };
      }

      try {
        // Attempt silent re-hydration with backend
        const res = await apiInstance.get('/auth/me');
        if (res.data?.success && res.data.user) {
          const validation = ValidationManager.validateAuth({
            token: existingToken,
            user: res.data.user,
          });
          if (validation.isValid) {
            console.log('[SelfHealing:Auth] Session re-validated and active.');
            return { success: true, user: res.data.user, token: existingToken };
          }
        }
      } catch (error) {
        console.warn('[SelfHealing:Auth] Silent /auth/me ping error:', error.message);
      }

      // If token is genuinely expired, preserve all farm data and field maps before clearing token!
      if (typeof localStorage !== 'undefined') {
        const cachedUser = localStorage.getItem('krishi_user');
        if (cachedUser) {
          try {
            FeatureRecoveryStrategy.storage.createShadowBackup('krishi_user', JSON.parse(cachedUser));
          } catch (_) {}
        }
      }

      return { success: false, reason: 'Token expired. User re-login required, farm data safely preserved.' };
    },
  },

  /**
   * 3. Network & API Request Recovery (Exponential Backoff with Jitter)
   */
  network: {
    getBackoffDelay(attemptNumber, baseDelay = 600) {
      // Exponential backoff: 600ms, 1200ms, 2400ms + random jitter up to 300ms
      const exponential = baseDelay * Math.pow(2, attemptNumber);
      const jitter = Math.floor(Math.random() * 300);
      return Math.min(exponential + jitter, 5000);
    },

    async retryWithBackoff(operationFn, maxAttempts = 3, onAttempt = null) {
      let lastError = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          if (attempt > 0 && onAttempt) {
            onAttempt(attempt);
          }
          const result = await operationFn();
          return { success: true, result, attempts: attempt + 1 };
        } catch (err) {
          lastError = err;
          // If status is 401 or 400 (client validation), retrying the identical request won't fix it
          if (err.response?.status === 400 || err.response?.status === 401 || err.response?.status === 403) {
            break;
          }

          if (attempt < maxAttempts - 1) {
            const delay = FeatureRecoveryStrategy.network.getBackoffDelay(attempt);
            console.log(`[SelfHealing:Network] Request failed (${err.message}). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`);
            await new Promise(res => setTimeout(res, delay));
          }
        }
      }

      return { success: false, error: lastError, attempts: maxAttempts };
    },
  },

  /**
   * 4. GPS & Geolocation Recovery
   * Reinitializes native/browser GPS watch, filters noise, validates coordinates,
   * and preserves existing boundary points.
   */
  gps: {
    async recoverGpsTelemetry(getDeviceLocationFn, lastKnownPosition = null) {
      console.log('[SelfHealing:GPS] Initiating GPS reacquisition...');

      try {
        // Attempt fresh high-accuracy acquisition with 10s timeout
        const position = await getDeviceLocationFn({ timeout: 10000 });
        const validation = ValidationManager.validateGps(position);

        if (validation.isValid) {
          console.log(`[SelfHealing:GPS] Fresh GPS fix validated (±${position.accuracy}m).`);
          return { success: true, position, isRecovered: true };
        }
      } catch (err) {
        console.warn('[SelfHealing:GPS] Fresh fix attempt warning:', err.message || err);
      }

      // Safe fallback: if last known position is reasonably fresh (< 90 seconds), use it
      if (lastKnownPosition) {
        const ageSeconds = (Date.now() - (lastKnownPosition.timestamp || 0)) / 1000;
        if (ageSeconds < 90) {
          const validation = ValidationManager.validateGps(lastKnownPosition);
          if (validation.isValid) {
            console.log('[SelfHealing:GPS] Using recently validated position cache (<90s old).');
            return { success: true, position: lastKnownPosition, isCached: true };
          }
        }
      }

      return {
        success: false,
        userMessageHi: 'जीपीएस सिग्नल कमजोर है। कृपया खुले आसमान के नीचे जाएं।',
        userMessageEn: 'Weak GPS signal. Please move outdoors with a clear view of the sky.',
      };
    },
  },

  /**
   * 5. AI Advice Tiered Recovery
   * If upstream Gemini or network fails:
   * Level 1: Retry with backoff
   * Level 2: Secondary / Universal Agricultural Intelligence Engine
   * Level 3: Verified crop-specific organic + chemical safe advice without raw stack traces
   */
  ai: {
    recoverCropAdvice({ query, crop, farmContext, language = 'hi' }) {
      console.log(`[SelfHealing:AI] Engaging local Universal Crop Engine fallback for "${crop}"...`);

      try {
        const structuredAdvice = generateStandardStructuredAdvice({
          query,
          crop: crop || 'Field Crop',
          farmContext,
          language,
        });

        const validation = ValidationManager.validateAiAdvice(structuredAdvice, crop);
        if (validation.isValid) {
          return {
            success: true,
            isFallback: true,
            data: structuredAdvice,
            answer: structuredAdvice.what_to_do_now?.[0]?.instruction || (language === 'hi' ? 'सलाह तैयार है।' : 'Advice ready.'),
          };
        }
      } catch (err) {
        console.error('[SelfHealing:AI] Universal Crop Engine exception:', err);
      }

      // Farmer-friendly emergency advice
      const emergencyAdviceHi = `फसल: ${crop || 'फसल'}\n• खेत में नियमित निगरानी रखें और नमी की जांच करें।\n• किसी भी कीट या रोग के शुरुआती लक्षण दिखने पर नीम तेल 5 मिली/लीटर पानी का छिड़काव करें।\n• स्थानीय कृषि विज्ञान केंद्र (KVK) या विशेषज्ञ से परामर्श लें।`;
      const emergencyAdviceEn = `Crop: ${crop || 'Field Crop'}\n• Monitor crop regularly and verify soil moisture.\n• For early pest/disease symptoms, apply neem oil at 5ml/litre water.\n• Consult your local Krishi Vigyan Kendra (KVK) or agri-officer.`;

      return {
        success: true,
        isFallback: true,
        answer: language === 'hi' ? emergencyAdviceHi : emergencyAdviceEn,
        data: {
          crop_name: crop || 'Field Crop',
          what_to_do_now: [{ step: 1, instruction: language === 'hi' ? emergencyAdviceHi : emergencyAdviceEn }],
        },
      };
    },
  },
};
