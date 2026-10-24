/**
 * Fasal Drishti — Self-Healing & Auto-Debugging System Barrel Export
 */

export { ErrorCategory, LogLevel, classifyError, sanitizeData } from './ErrorClassifier.js';
export { ValidationManager } from './ValidationManager.js';
export { FeatureRecoveryStrategy } from './FeatureRecoveryStrategy.js';
export { RecoveryManager } from './RecoveryManager.js';
export { ErrorMonitor } from './ErrorMonitor.js';
export { SelfHealingProvider, useSelfHealing } from './SelfHealingProvider.jsx';
