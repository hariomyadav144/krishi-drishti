/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * Central Recovery Manager
 * 
 * Orchestrates the bounded recovery loop:
 * Error Detect -> Classify -> Root Cause -> Safe Recovery -> Validate -> Stop / Graceful Fallback
 * 
 * Guarantees:
 * 1. Bounded: MAX_ATTEMPTS = 3. Absolute prevention of infinite loops.
 * 2. Non-destructive: Farm data and coordinates are never deleted or reset.
 * 3. Structured diagnostics: Sanitized logging with levels (INFO, WARNING, ERROR, CRITICAL).
 * 4. Reactive notification: Emits farmer-friendly status updates in Hindi & English.
 */

import { classifyError, sanitizeData, LogLevel, ErrorCategory } from './ErrorClassifier.js';
import { ValidationManager } from './ValidationManager.js';
import { FeatureRecoveryStrategy } from './FeatureRecoveryStrategy.js';

const MAX_RECOVERY_ATTEMPTS = 3;
const COOLDOWN_WINDOW_MS = 2500;

class RecoveryManagerClass {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.subscribers = new Set();
    this.recentErrors = new Map(); // Error fingerprint -> timestamp
    this.activeRecoveries = new Map(); // Feature -> boolean
    this.isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  }

  /**
   * Subscribe to recovery state changes (used by UI toasts & banners)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event) {
    this.subscribers.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[RecoveryManager] Subscriber error:', err);
      }
    });
  }

  /**
   * Structured logger with sanitization
   */
  logDiagnostic(entry) {
    const record = {
      id: `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level: entry.level || LogLevel.INFO,
      module: entry.module || 'System',
      errorType: entry.errorType || 'GENERAL',
      message: sanitizeData(entry.message || ''),
      stack: sanitizeData(entry.stack || ''),
      attempt: entry.attempt || 0,
      recoveryResult: sanitizeData(entry.recoveryResult || null),
      status: entry.status || 'LOGGED',
    };

    this.logs.unshift(record);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output formatted for development or production diagnostics
    const prefix = `[FasalDrishti:SelfHealing][${record.level}][${record.module}]`;
    if (record.level === LogLevel.CRITICAL || record.level === LogLevel.ERROR) {
      console.error(prefix, record.message, record.status, record.recoveryResult || '');
    } else if (record.level === LogLevel.WARNING) {
      console.warn(prefix, record.message, record.status);
    } else {
      console.log(prefix, record.message, record.status);
    }

    return record;
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  /**
   * Generates a stable fingerprint to debounce duplicate errors
   */
  getFingerprint(error, context = {}) {
    const msg = error?.message || String(error || '');
    const mod = context?.module || 'General';
    return `${mod}:${msg.slice(0, 60)}`;
  }

  /**
   * CORE BOUNDED SELF-HEALING LOOP
   * 
   * attempt = 0
   * while error_not_resolved AND attempt < MAX_ATTEMPTS:
   *   detect_error()
   *   classify_error()
   *   identify_root_cause()
   *   apply_safe_recovery()
   *   validate_feature()
   */
  async executeRecoveryLoop({ error, context = {}, recoveryAction, validateAction }) {
    const fingerprint = this.getFingerprint(error, context);
    const now = Date.now();
    const lastSeen = this.recentErrors.get(fingerprint) || 0;

    // Cooldown check: prevent rapid flood loops
    if (now - lastSeen < COOLDOWN_WINDOW_MS && this.activeRecoveries.get(context?.module)) {
      console.warn(`[RecoveryManager] Debouncing duplicate recovery for: ${fingerprint}`);
      return { success: false, debounced: true };
    }
    this.recentErrors.set(fingerprint, now);
    this.activeRecoveries.set(context?.module, true);

    // 1. Detect & Classify Error
    const classification = classifyError(error, context);
    const moduleName = classification.module;

    this.logDiagnostic({
      level: LogLevel.WARNING,
      module: moduleName,
      errorType: classification.category,
      message: classification.message,
      stack: classification.stack,
      status: 'DETECTED',
      recoveryResult: { rootCause: classification.rootCause },
    });

    // Notify UI that auto-healing is underway
    this.notify({
      state: 'RECOVERING',
      module: moduleName,
      messageHi: 'समस्या का समाधान हो रहा है...',
      messageEn: 'Fasal Drishti is trying to recover automatically.',
      category: classification.category,
    });

    let attempt = 0;
    let isResolved = false;
    let finalResult = null;
    let lastRecoveryError = null;

    // 2. Bounded Safe Recovery Loop (Max 3 attempts)
    while (!isResolved && attempt < MAX_RECOVERY_ATTEMPTS) {
      attempt++;
      console.log(`[RecoveryManager] Loop iteration: Attempt ${attempt}/${MAX_RECOVERY_ATTEMPTS} for ${moduleName}`);

      try {
        // Execute recovery action
        let recoveryResult = null;
        if (typeof recoveryAction === 'function') {
          recoveryResult = await recoveryAction(attempt, classification);
        } else {
          // Default module recovery dispatcher
          recoveryResult = await this.defaultModuleRecovery(moduleName, classification, attempt);
        }

        // 3. Validation step after each recovery attempt
        let validation = { isValid: false };
        if (typeof validateAction === 'function') {
          validation = await validateAction(recoveryResult);
        } else {
          validation = await ValidationManager.validateFeature(moduleName, recoveryResult, context);
        }

        if (validation.isValid) {
          isResolved = true;
          finalResult = recoveryResult;

          this.logDiagnostic({
            level: LogLevel.INFO,
            module: moduleName,
            errorType: classification.category,
            message: `Feature recovery succeeded on attempt ${attempt}.`,
            attempt,
            status: 'RECOVERED',
            recoveryResult,
          });

          // Notify UI of success
          this.notify({
            state: 'RESOLVED',
            module: moduleName,
            messageHi: 'समस्या ठीक हो गई है। आप जारी रख सकते हैं।',
            messageEn: 'Problem fixed. You can continue.',
            attempt,
          });

          break; // Stop loop immediately upon verified resolution
        } else {
          console.warn(`[RecoveryManager] Attempt ${attempt} validation failed:`, validation.reason);
        }
      } catch (recoveryErr) {
        lastRecoveryError = recoveryErr;
        console.error(`[RecoveryManager] Attempt ${attempt} exception:`, recoveryErr);
      }

      // Safe exponential wait before next attempt
      if (!isResolved && attempt < MAX_RECOVERY_ATTEMPTS) {
        const delay = FeatureRecoveryStrategy.network.getBackoffDelay(attempt - 1, 400);
        await new Promise(res => setTimeout(res, delay));
      }
    }

    this.activeRecoveries.delete(context?.module);

    // 4. Final Status: Resolved or Graceful Fallback
    if (isResolved) {
      return {
        success: true,
        attempts: attempt,
        result: finalResult,
        classification,
      };
    } else {
      this.logDiagnostic({
        level: LogLevel.ERROR,
        module: moduleName,
        errorType: classification.category,
        message: `Recovery loop exhausted after ${MAX_RECOVERY_ATTEMPTS} attempts. Safe fallback activated.`,
        attempt,
        status: 'FALLBACK_ACTIVATED',
        recoveryResult: { lastError: lastRecoveryError?.message },
      });

      // Notify UI of graceful fallback with assurance of data safety
      this.notify({
        state: 'FALLBACK',
        module: moduleName,
        messageHi: 'कार्य अभी पूरा नहीं हो सका। आपका सहेजा गया डेटा पूरी तरह सुरक्षित है।',
        messageEn: "We couldn't complete this action right now. Your saved farm data is safe. Please try again.",
        attempts: attempt,
      });

      return {
        success: false,
        attempts: attempt,
        classification,
        fallbackActivated: true,
      };
    }
  }

  /**
   * Default recovery strategy based on module
   */
  async defaultModuleRecovery(moduleName, classification, attempt) {
    switch (classification.category) {
      case ErrorCategory.STORAGE_ERROR:
      case ErrorCategory.PARSING_ERROR:
        return FeatureRecoveryStrategy.storage.restoreCorruptedStorage(classification.module, 'object');
      
      case ErrorCategory.NETWORK_ERROR:
      case ErrorCategory.API_ERROR:
        // Delay and return retry signal
        return { retryReady: true, attempt };

      default:
        return null;
    }
  }
}

// Global Singleton Instance
export const RecoveryManager = new RecoveryManagerClass();

// Attach to window for diagnostic verification in browser / devtools
if (typeof window !== 'undefined') {
  window.__FASAL_DRISHTI_SELF_HEALING__ = {
    getDiagnostics: () => RecoveryManager.getLogs(),
    clearDiagnostics: () => RecoveryManager.clearLogs(),
    manager: RecoveryManager,
  };
}
