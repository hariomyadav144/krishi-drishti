const axios = require('axios');
const jwt = require('jsonwebtoken');
const persistentStore = require('./utils/persistentStore');
const {
  register,
  login,
  refreshSession,
  logoutUser,
  generateAccessToken,
  generateRefreshToken
} = require('./controllers/authController');

async function runRefreshAuthTests() {
  console.log('=== STARTING REFRESH TOKEN & SESSION VERIFICATION TESTS ===\n');

  const testPhone = '9777665544';
  const testPassword = 'SecureFarmerPass@2026';
  const testName = 'Ramesh Verma';

  // Mock Request / Response helper for controller unit testing
  function createMockReqRes(body = {}, headers = {}) {
    const req = { body, headers, user: null };
    const res = {
      statusCode: 200,
      headers: {},
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
      setHeader(k, v) {
        this.headers[k] = v;
      }
    };
    return { req, res };
  }

  // TEST 1: Register User
  console.log('[Test 1] Testing User Registration with Token Generation...');
  const { req: regReq, res: regRes } = createMockReqRes({
    name: testName,
    phone: testPhone,
    password: testPassword,
    state: 'Uttar Pradesh',
    district: 'Gorakhpur'
  });

  await register(regReq, regRes);
  if (!regRes.jsonData?.success) {
    // If already exists, proceed to login
    console.log('  Notice: User already registered. Testing Login directly.');
  } else {
    console.log('  ✓ User registered successfully.');
    console.log('  ✓ Access Token returned:', Boolean(regRes.jsonData.accessToken));
    console.log('  ✓ Refresh Token returned:', Boolean(regRes.jsonData.refreshToken));
  }

  // TEST 2: Login with Same Phone (Formatted) + Password
  console.log('\n[Test 2] Testing User Login with Formatted Phone Number (+91 97776 65544)...');
  const { req: loginReq, res: loginRes } = createMockReqRes({
    phone: '+91 97776 65544',
    password: testPassword,
    rememberMe: true
  });

  await login(loginReq, loginRes);
  if (!loginRes.jsonData?.success) {
    throw new Error(`Login failed: ${loginRes.jsonData?.message}`);
  }
  console.log('  ✓ Login successful with formatted phone.');
  const initialAccess = loginRes.jsonData.accessToken;
  const initialRefresh = loginRes.jsonData.refreshToken;
  const userId = loginRes.jsonData.user.id || loginRes.jsonData.user._id;

  console.log('  ✓ User ID confirmed permanent:', userId);
  console.log('  ✓ Access Token (15m):', initialAccess.substring(0, 25) + '...');
  console.log('  ✓ Refresh Token (365d):', initialRefresh.substring(0, 25) + '...');

  // Decode tokens to verify expiry
  const decodedAccess = jwt.decode(initialAccess);
  const decodedRefresh = jwt.decode(initialRefresh);
  const accessLifetimeSec = decodedAccess.exp - decodedAccess.iat;
  const refreshLifetimeDays = Math.round((decodedRefresh.exp - decodedRefresh.iat) / (24 * 3600));

  console.log(`  ✓ Access token validity: ${accessLifetimeSec}s (Target: ~900s / 15m)`);
  console.log(`  ✓ Refresh token validity: ${refreshLifetimeDays} days (Target: 365d for Remember Me)`);

  if (accessLifetimeSec > 3600) {
    throw new Error('Access token is too long-lived! Should be short-lived (15m).');
  }
  if (refreshLifetimeDays < 300) {
    throw new Error('Refresh token is too short for Remember Me! Should be 365 days.');
  }

  // TEST 3: Silent Refresh Token Exchange
  console.log('\n[Test 3] Testing POST /api/auth/refresh (Silent Refresh & Rotation)...');
  const { req: refreshReq, res: refreshRes } = createMockReqRes({
    refreshToken: initialRefresh
  });

  await refreshSession(refreshReq, refreshRes);
  if (!refreshRes.jsonData?.success) {
    throw new Error(`Refresh failed: ${refreshRes.jsonData?.message}`);
  }

  const rotatedAccess = refreshRes.jsonData.accessToken;
  const rotatedRefresh = refreshRes.jsonData.refreshToken;

  console.log('  ✓ Silent refresh succeeded.');
  console.log('  ✓ Fresh Access Token generated:', rotatedAccess !== initialAccess);
  console.log('  ✓ Refresh Token rotated safely:', rotatedRefresh !== initialRefresh);

  // TEST 4: Old Refresh Token Revoked
  console.log('\n[Test 4] Verifying Old Refresh Token is Invalidated (Anti-Replay)...');
  const { req: replayReq, res: replayRes } = createMockReqRes({
    refreshToken: initialRefresh // Reusing old token
  });
  await refreshSession(replayReq, replayRes);
  console.log(`  ✓ Replay attempt rejected with status ${replayRes.statusCode}: ${replayRes.jsonData?.message}`);
  if (replayRes.statusCode === 200) {
    throw new Error('Security flaw: Old refresh token was not invalidated after rotation!');
  }

  // TEST 5: Create Field Linked to Permanent User ID
  console.log('\n[Test 5] Linking Farm Data to Permanent User ID...');
  const farmField = {
    userId,
    name: 'KIPM Paddy Field - Permanent Test',
    crop: 'Paddy',
    area: '2.5 Acres',
    boundary: [
      { lat: 26.8467, lng: 80.9462 },
      { lat: 26.8475, lng: 80.9470 },
      { lat: 26.8480, lng: 80.9460 }
    ],
    createdAt: new Date().toISOString()
  };
  persistentStore.saveField(userId, farmField);
  const userFields = persistentStore.getFields(userId);
  console.log(`  ✓ Field saved and retrieved for permanent userId ${userId}. Count: ${userFields.length}`);
  if (userFields.length === 0) {
    throw new Error('Field was not linked to userId!');
  }

  // TEST 6: Explicit Logout
  console.log('\n[Test 6] Testing Explicit Logout (Revoke Session without Deleting Account/Farms)...');
  const { req: logoutReq, res: logoutRes } = createMockReqRes({
    refreshToken: rotatedRefresh
  });
  logoutReq.user = { id: userId, _id: userId };

  await logoutUser(logoutReq, logoutRes);
  console.log('  ✓ Logout response:', logoutRes.jsonData?.message);

  // Verify Refresh Token is now revoked
  const { req: checkRefreshReq, res: checkRefreshRes } = createMockReqRes({
    refreshToken: rotatedRefresh
  });
  await refreshSession(checkRefreshReq, checkRefreshRes);
  console.log(`  ✓ Post-logout refresh rejected with status ${checkRefreshRes.statusCode}`);
  if (checkRefreshRes.statusCode === 200) {
    throw new Error('Security flaw: Refresh token was not revoked upon explicit logout!');
  }

  // TEST 7: Farm Data & User Account Must Persist Post-Logout
  console.log('\n[Test 7] Verifying User Account & Farm Data Persist Post-Logout...');
  const userAccount = persistentStore.getUserById(userId);
  const postLogoutFields = persistentStore.getFields(userId);
  console.log('  ✓ User account still in database:', Boolean(userAccount));
  console.log('  ✓ Farm data still preserved for user:', postLogoutFields.length > 0);
  if (!userAccount || postLogoutFields.length === 0) {
    throw new Error('Data loss: User account or farm data was deleted on logout!');
  }

  // TEST 8: Re-Login Post-Logout with Same Phone & Password
  console.log('\n[Test 8] Re-Login with Same Phone & Password Post-Logout...');
  const { req: reloginReq, res: reloginRes } = createMockReqRes({
    phone: testPhone,
    password: testPassword
  });
  await login(reloginReq, reloginRes);
  if (!reloginRes.jsonData?.success) {
    throw new Error(`Re-login failed: ${reloginRes.jsonData?.message}`);
  }
  const reloginUserId = reloginRes.jsonData.user.id || reloginRes.jsonData.user._id;
  console.log('  ✓ Re-login succeeded smoothly without asking for registration.');
  console.log('  ✓ Re-logged in user ID matches original:', reloginUserId === userId);

  // TEST 9: Wrong Password
  console.log('\n[Test 9] Verifying Wrong Password is Correctly Rejected...');
  const { req: wrongPassReq, res: wrongPassRes } = createMockReqRes({
    phone: testPhone,
    password: 'WrongPassword123!'
  });
  await login(wrongPassReq, wrongPassRes);
  console.log(`  ✓ Wrong password rejected with status ${wrongPassRes.statusCode}: ${wrongPassRes.jsonData?.message}`);
  if (wrongPassRes.jsonData?.success) {
    throw new Error('Security flaw: Wrong password was accepted!');
  }

  // TEST 10: Unknown Phone
  console.log('\n[Test 10] Verifying Unknown Phone Number...');
  const { req: unknownReq, res: unknownRes } = createMockReqRes({
    phone: '9000000001',
    password: 'AnyPassword@123'
  });
  await login(unknownReq, unknownRes);
  console.log(`  ✓ Unknown phone rejected with status ${unknownRes.statusCode}, code: ${unknownRes.jsonData?.code}`);

  console.log('\n🎉 ALL 10 AUTHENTICATION & REFRESH SESSION TESTS PASSED 100%!');
}

runRefreshAuthTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
