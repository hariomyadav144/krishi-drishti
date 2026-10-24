/**
 * Fasal Drishti — Self-Healing & Auto-Debugging Verification Test Suite
 * Tests all 18 core requirements:
 * - Error classification
 * - Root-cause analysis
 * - Bounded loop (attempt < 3, no infinite loops)
 * - Validation after every fix
 * - Zero data loss (shadow backup & recovery)
 * - Sanitization (passwords & tokens redacted)
 * - GPS validation & boundary protection
 * - AI advice fallback & crop verification
 */

// In-memory mock localStorage for Node testing
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
try {
  Object.defineProperty(globalThis.navigator, 'onLine', { value: true, writable: true, configurable: true });
} catch (_) {}

import { 
  ErrorCategory, 
  LogLevel, 
  classifyError, 
  sanitizeData 
} from './src/selfHealing/ErrorClassifier.js';
import { ValidationManager } from './src/selfHealing/ValidationManager.js';
import { FeatureRecoveryStrategy } from './src/selfHealing/FeatureRecoveryStrategy.js';
import { RecoveryManager } from './src/selfHealing/RecoveryManager.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`🌾 FASAL DRISHTI — SELF-HEALING SYSTEM TEST SUITE 🌾`);
  console.log(`======================================================\n`);

  // --- TEST 1: Error Classification ---
  console.log('--- 1. Testing Error Classification & Root Cause Identification ---');
  
  const gpsErr = classifyError(new Error('User denied Geolocation'), { module: 'GPS' });
  assert(gpsErr.category === ErrorCategory.PERMISSION_ERROR, 'GPS permission denied classified correctly');
  assert(gpsErr.canAutoRecover === true, 'GPS error marked as auto-recoverable');

  const netErr = classifyError({ code: 'ECONNABORTED', message: 'timeout of 25000ms exceeded' }, { module: 'API' });
  assert(netErr.category === ErrorCategory.NETWORK_ERROR, 'Network timeout classified correctly');

  const authErr = classifyError({ response: { status: 401 } }, { url: '/api/auth/me', module: 'Authentication' });
  assert(authErr.category === ErrorCategory.SESSION_ERROR, 'Session 401 classified as SESSION_ERROR');

  const aiErr = classifyError({ response: { status: 429 } }, { url: '/api/ai/advice', module: 'AiAdvisor' });
  assert(aiErr.category === ErrorCategory.AI_PROVIDER_ERROR, 'AI 429 rate limit classified as AI_PROVIDER_ERROR');

  const parseErr = classifyError(new SyntaxError('Unexpected token < in JSON at position 0'), { module: 'Storage' });
  assert(parseErr.category === ErrorCategory.PARSING_ERROR, 'Corrupted JSON classified as PARSING_ERROR');

  // --- TEST 2: Data Sanitization ---
  console.log('\n--- 2. Testing Data Sanitization (No sensitive tokens in logs) ---');
  const sanitizedString = sanitizeData('Authorization: Bearer secret_jwt_token_12345');
  assert(!sanitizedString.includes('secret_jwt_token_12345'), 'JWT token redacted from string');
  assert(sanitizedString.includes('[REDACTED_TOKEN]'), 'String includes token redaction marker');

  const sanitizedObj = sanitizeData({
    phone: '9876543210',
    password: 'SuperSecretPassword123!',
    token: 'jwt_abc_999',
    farmName: 'Green Valley Plot'
  });
  assert(sanitizedObj.password === '[REDACTED]', 'Password redacted from object');
  assert(sanitizedObj.token === '[REDACTED]', 'Token redacted from object');
  assert(sanitizedObj.farmName === 'Green Valley Plot', 'Non-sensitive farm name preserved');

  // --- TEST 3: Validation Manager ---
  console.log('\n--- 3. Testing Validation Manager (Feature integrity validation) ---');

  // GPS Validation
  const validCoords = { lat: 20.1738, lng: 73.9856, accuracy: 12 };
  assert(ValidationManager.validateGps(validCoords).isValid === true, 'Valid GPS coords pass validation');

  const nanCoords = { lat: NaN, lng: 73.9856 };
  assert(ValidationManager.validateGps(nanCoords).isValid === false, 'NaN GPS coordinates rejected');

  const outOfRangeCoords = { lat: 105.0, lng: 73.9856 };
  assert(ValidationManager.validateGps(outOfRangeCoords).isValid === false, 'Latitude > 90 rejected');

  // Farm Data Validation
  const validFarms = [
    {
      id: 'farm_01',
      name: 'North Plot',
      boundaryPoints: [
        { lat: 20.173, lng: 73.985 },
        { lat: 20.174, lng: 73.986 },
        { lat: 20.175, lng: 73.984 }
      ]
    }
  ];
  assert(ValidationManager.validateFarmData(validFarms).isValid === true, 'Valid farm polygon passes validation');

  const brokenFarms = [{ name: 'Missing ID Farm' }];
  assert(ValidationManager.validateFarmData(brokenFarms).isValid === false, 'Farm missing ID rejected');

  // AI Advice Validation
  const validAdvice = {
    cropName: 'Wheat',
    what_to_do_now: [{ instruction: 'Spray Mancozeb 75 WP @ 2g/L for yellow rust control.' }]
  };
  assert(ValidationManager.validateAiAdvice(validAdvice, 'Wheat').isValid === true, 'Valid wheat advice passes validation');

  const stackTraceAdvice = {
    answer: 'TypeError: Cannot read properties of undefined\n  at /app/routes/ai.js:45:12'
  };
  assert(ValidationManager.validateAiAdvice(stackTraceAdvice, 'Wheat').isValid === false, 'Raw stack trace rejected from advice');

  // --- TEST 4: Bounded Recovery Loop (Success Path) ---
  console.log('\n--- 4. Testing Bounded Recovery Loop (Transient failure auto-resolved) ---');
  let attemptCount = 0;
  const loopResult = await RecoveryManager.executeRecoveryLoop({
    error: new Error('Transient network glitch'),
    context: { module: 'WeatherSync' },
    recoveryAction: async (attempt) => {
      attemptCount = attempt;
      if (attempt < 2) throw new Error('Still glitching');
      return { weather: 'Sunny 28°C' };
    },
    validateAction: async (res) => {
      return { isValid: !!res?.weather };
    }
  });

  assert(loopResult.success === true, 'Recovery loop succeeded');
  assert(loopResult.attempts === 2, 'Loop resolved on attempt 2');
  assert(attemptCount === 2, 'Correct attempt count tracked');

  // --- TEST 5: Bounded Recovery Loop (Max 3 attempts, No Infinite Loops) ---
  console.log('\n--- 5. Testing Infinite Loop Prevention (Max 3 attempts limit) ---');
  let infiniteLoopTestAttempts = 0;
  const permanentFailureResult = await RecoveryManager.executeRecoveryLoop({
    error: new Error('Permanent database offline'),
    context: { module: 'PersistentModule' },
    recoveryAction: async (attempt) => {
      infiniteLoopTestAttempts = attempt;
      throw new Error('Unrecoverable external hardware failure');
    },
    validateAction: async () => ({ isValid: false, reason: 'Never valid' })
  });

  assert(permanentFailureResult.success === false, 'Permanent failure stopped gracefully');
  assert(permanentFailureResult.attempts === 3, 'Loop strictly bounded to MAX_ATTEMPTS (3)');
  assert(infiniteLoopTestAttempts === 3, 'Recovery stopped at exactly 3 attempts without looping infinitely');
  assert(permanentFailureResult.fallbackActivated === true, 'Graceful fallback activated');

  // --- TEST 6: Zero Data Loss — Shadow Backup & Recovery ---
  console.log('\n--- 6. Testing Zero Data Loss (Shadow backup & recovery from corrupted JSON) ---');
  const valuableFarms = [
    { id: 'farm_real_01', name: 'My Wheat Field', areaAcres: 3.5, boundary: [{ lat: 20.1, lng: 73.9 }] }
  ];

  // 1. Create shadow backup
  FeatureRecoveryStrategy.storage.createShadowBackup('farms_data', valuableFarms);

  // 2. Simulate catastrophic corruption in primary key
  localStorage.setItem('farms_data', '{{CORRUPTED_TRUNCATED_JSON_DATA<<<');

  // 3. Trigger auto-healing restoration
  const restored = FeatureRecoveryStrategy.storage.restoreCorruptedStorage('farms_data', 'array');
  assert(Array.isArray(restored), 'Corrupted data recovered as valid array');
  assert(restored.length === 1, 'Farm count restored intact');
  assert(restored[0].name === 'My Wheat Field', 'Farm name restored without data loss');
  assert(restored[0].areaAcres === 3.5, 'Farm area preserved intact');

  // --- TEST 7: AI Advice Tiered Fallback with Crop Verification ---
  console.log('\n--- 7. Testing AI Advice Tiered Fallback ---');
  const fallbackAdvice = FeatureRecoveryStrategy.ai.recoverCropAdvice({
    query: 'पत्तियों पर धब्बे दिख रहे हैं',
    crop: 'Tomato',
    language: 'hi'
  });

  assert(fallbackAdvice.success === true, 'AI fallback advice generated');
  assert(fallbackAdvice.isFallback === true, 'Marked as fallback');
  assert(typeof fallbackAdvice.answer === 'string' && fallbackAdvice.answer.length > 20, 'Non-empty farmer advice generated');
  assert(!fallbackAdvice.answer.includes('TypeError') && !fallbackAdvice.answer.includes('Error:'), 'Advice free of technical errors');

  // --- TEST 8: Structured Diagnostic Logging ---
  console.log('\n--- 8. Testing Diagnostic Logging ---');
  const logs = RecoveryManager.getLogs();
  assert(logs.length > 0, 'Diagnostic logs recorded in memory');
  assert(logs.some(l => l.module === 'WeatherSync'), 'WeatherSync recovery logged');
  assert(logs.some(l => l.module === 'PersistentModule'), 'PersistentModule fallback logged');

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedTests}/${totalTests} SELF-HEALING TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
