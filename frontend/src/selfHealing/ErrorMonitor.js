/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * Global Error Monitor
 * 
 * Central listener capturing uncaught errors, unhandled rejections,
 * network connectivity transitions, and module-specific signals.
 */

import { RecoveryManager } from './RecoveryManager.js';
import { LogLevel } from './ErrorClassifier.js';

class ErrorMonitorClass {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize Global Observers
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Uncaught Javascript Exceptions
    window.addEventListener('error', (event) => {
      // Ignore cross-origin script error noise with no stack/message
      if (!event.message && !event.error) return;

      // Filter out browser extension noise (e.g. Chrome extensions)
      const filename = event.filename || '';
      if (filename.includes('extension://') || filename.includes('chrome://')) return;

      RecoveryManager.logDiagnostic({
        level: LogLevel.ERROR,
        module: 'WindowGlobal',
        errorType: 'UNCAUGHT_EXCEPTION',
        message: event.message || event.error?.message || 'Uncaught window error',
        stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        status: 'CAPTURED',
      });
    });

    // 2. Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason?.message || (typeof reason === 'string' ? reason : 'Unhandled promise rejection');

      // Filter out expected cancelled requests
      if (message.includes('canceled') || message.includes('abort')) return;

      RecoveryManager.logDiagnostic({
        level: LogLevel.WARNING,
        module: 'PromiseGlobal',
        errorType: 'UNHANDLED_REJECTION',
        message,
        stack: reason?.stack || '',
        status: 'CAPTURED',
      });
    });

    // 3. Online / Offline Connectivity Monitor
    window.addEventListener('offline', () => {
      RecoveryManager.logDiagnostic({
        level: LogLevel.WARNING,
        module: 'NetworkState',
        errorType: 'OFFLINE',
        message: 'Device has lost internet connection. Seamless offline caching engaged.',
        status: 'OFFLINE_DETECTED',
      });

      RecoveryManager.notify({
        state: 'OFFLINE',
        module: 'Network',
        messageHi: 'इंटरनेट कनेक्शन कट गया है। ऑफलाइन मोड सक्रिय है।',
        messageEn: 'Internet connection lost. Offline mode active.',
      });
    });

    window.addEventListener('online', () => {
      RecoveryManager.logDiagnostic({
        level: LogLevel.INFO,
        module: 'NetworkState',
        errorType: 'ONLINE',
        message: 'Internet connection restored. Resuming live cloud sync.',
        status: 'ONLINE_RESTORED',
      });

      RecoveryManager.notify({
        state: 'ONLINE',
        module: 'Network',
        messageHi: 'इंटरनेट कनेक्शन जुड़ गया है। डेटा सिंक हो रहा है।',
        messageEn: 'Internet connection restored. Synchronizing farm data.',
      });
    });

    console.log('[SelfHealing:ErrorMonitor] Global error listeners successfully initialized.');
  }

  /**
   * Monitor API operations
   */
  async monitorApiCall(apiOperation, context = {}) {
    try {
      return await apiOperation();
    } catch (error) {
      return await RecoveryManager.executeRecoveryLoop({
        error,
        context: { module: 'API', ...context },
        recoveryAction: async () => {
          return await apiOperation();
        },
      });
    }
  }

  /**
   * Monitor GPS operations
   */
  async monitorGpsCall(gpsOperation, context = {}) {
    try {
      return await gpsOperation();
    } catch (error) {
      return await RecoveryManager.executeRecoveryLoop({
        error,
        context: { module: 'GPS', ...context },
        recoveryAction: async () => {
          return await gpsOperation();
        },
      });
    }
  }
}

export const ErrorMonitor = new ErrorMonitorClass();
