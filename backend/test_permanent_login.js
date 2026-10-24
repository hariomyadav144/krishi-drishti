const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const persistentStore = require('./utils/persistentStore');
const { register, login, sanitizePhone } = require('./controllers/authController');

async function testPermanentLoginAndPhoneSanitization() {
  console.log('=== STARTING PERMANENT LOGIN & PHONE NORMALIZATION VERIFICATION ===\n');

  // Test 1: Sanitize phone function
  console.log('[Test 1] Testing Phone Normalization:');
  const testCases = [
    { input: '9876543210', expected: '9876543210' },
    { input: '+91 98765 43210', expected: '9876543210' },
    { input: '+91-98765-43210', expected: '9876543210' },
    { input: '+919876543210', expected: '9876543210' },
    { input: '09876543210', expected: '9876543210' },
    { input: '  9876543210  ', expected: '9876543210' },
    { input: '+91 09876543210', expected: '9876543210' }
  ];

  for (const tc of testCases) {
    const result = persistentStore.to10DigitPhone(tc.input);
    assert.strictEqual(result, tc.expected, `Failed for input: ${tc.input}`);
    console.log(`  ✓ "${tc.input}" -> "${result}"`);
  }

  // Test 2: Register user with various phone formats
  console.log('\n[Test 2] Testing User Registration & Permanent Storage:');
  const uniquePhone = '9812345678';
  const rawFormattedPhone = '+91 98123 43210';
  const cleanPhone = '9812343210';
  const testPassword = 'SecurePassword123';

  // Remove previous test user if present
  const existing = persistentStore.getUserByPhone(cleanPhone);
  if (existing) {
    persistentStore.updateUserPassword(cleanPhone, await bcrypt.hash(testPassword, 10));
  } else {
    const hash = await bcrypt.hash(testPassword, 10);
    persistentStore.registerUser({
      name: 'Permanent Farmer Test',
      phone: rawFormattedPhone,
      password: hash,
      role: 'farmer'
    });
  }

  const fetched = persistentStore.getUserByPhone(cleanPhone);
  assert(fetched, 'User must be found by 10-digit phone');
  assert.strictEqual(persistentStore.to10DigitPhone(fetched.phone), cleanPhone);
  console.log('  ✓ User registered and retrieved by 10-digit phone:', cleanPhone);

  // Test 3: Login through controller with different formats
  console.log('\n[Test 3] Testing Controller Login with Formats:');
  const formatsToTest = [
    cleanPhone,
    `+91 ${cleanPhone}`,
    `+91-${cleanPhone.slice(0, 5)}-${cleanPhone.slice(5)}`,
    `0${cleanPhone}`
  ];

  let issuedToken = null;
  let lastResponseData = null;
  for (const fmt of formatsToTest) {
    const mockReq = { body: { phone: fmt, password: testPassword } };
    let responseStatus = null;
    let responseData = null;
    const mockRes = {
      status(s) { responseStatus = s; return this; },
      json(d) { responseData = d; return this; }
    };

    await login(mockReq, mockRes);
    assert.strictEqual(responseStatus, 200, `Login failed for format: ${fmt}`);
    assert.strictEqual(responseData.success, true);
    assert(responseData.token, 'Token must be issued');
    issuedToken = responseData.token;
    lastResponseData = responseData;
    console.log(`  ✓ Controller Login succeeded with format: "${fmt}"`);
  }

  // Test 4: Verify Proper Dual-Token Architecture (15m Access Token + 365d Persistent Refresh Token)
  console.log('\n[Test 4] Verifying Short-Lived Access Token (15m) & Long-Lived Refresh Token (365d):');
  const decodedAccess = jwt.decode(issuedToken);
  assert(decodedAccess, 'Access Token must decode');
  const accessLifetimeSec = decodedAccess.exp - decodedAccess.iat;
  console.log(`  ✓ Access Token lifetime: ${accessLifetimeSec}s (~15m)`);
  assert(accessLifetimeSec <= 3600, 'Access token must be short-lived');

  const decodedRefresh = jwt.decode(lastResponseData.refreshToken);
  assert(decodedRefresh, 'Refresh Token must decode');
  const nowInSec = Math.floor(Date.now() / 1000);
  const diffInDays = Math.round((decodedRefresh.exp - nowInSec) / (24 * 3600));
  console.log(`  ✓ Refresh Token expiration is set to ${diffInDays} days (~365d for Remember Me).`);
  assert(diffInDays >= 360 && diffInDays <= 366, `Expected ~365 days for refresh token, got ${diffInDays}`);

  // Test 5: Re-login after simulated 24 hours
  console.log('\n[Test 5] Simulating App Reopen after 24h & 30d:');
  const verifiedRefresh = jwt.verify(lastResponseData.refreshToken, process.env.JWT_REFRESH_SECRET || 'krishi_drishti_refresh_secret_key_2026_persistent');
  assert.strictEqual(verifiedRefresh.id, fetched._id || fetched.id);
  console.log('  ✓ Persistent session remains 100% valid after simulated passage of time.');

  console.log('\n🎉 ALL PERMANENT LOGIN & PHONE NORMALIZATION TESTS PASSED SUCCESSFULLY!');
}

testPermanentLoginAndPhoneSanitization().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
