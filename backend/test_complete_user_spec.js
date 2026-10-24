const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const persistentStore = require('./utils/persistentStore');
const { register, login, refreshSession, logoutUser } = require('./controllers/authController');
const { protect } = require('./middleware/auth');

async function runCompleteUserSpecificationTests() {
  console.log('================================================================');
  console.log('  FASAL DRISHTI: COMPREHENSIVE AUTH & FARM DATA PERSISTENCE TESTS');
  console.log('================================================================\n');

  const testPhone = '9870011223';
  const testPassword = 'FasalSecurePassword2026';
  let userId = null;
  let authToken = null;
  let refreshToken = null;

  // Helper mock response
  const createMockRes = () => {
    let statusCode = 200;
    let responseData = null;
    return {
      status(code) { statusCode = code; return this; },
      json(data) { responseData = data; return this; },
      getStatusCode() { return statusCode; },
      getData() { return responseData; }
    };
  };

  // -------------------------------------------------------------------------
  // TEST 1: Register -> Verify Account -> Logout -> Login with SAME credentials
  // -------------------------------------------------------------------------
  console.log('[TEST 1] Register -> Logout -> Login with same phone/password:');
  const existingUser = persistentStore.getUserByPhone(testPhone);
  if (!existingUser) {
    const regReq = {
      body: {
        name: 'KIPM Field Farmer',
        phone: testPhone,
        password: testPassword,
        role: 'farmer',
        mainCrop: 'Paddy',
        farmSize: 3.85,
        soilType: 'Alluvial Loam / बलुई दोमट मिट्टी'
      }
    };
    const regRes = createMockRes();
    await register(regReq, regRes);
    assert.strictEqual(regRes.getStatusCode(), 201, 'Registration should return 201 Created');
    assert.strictEqual(regRes.getData()?.success, true, 'Registration must be successful');
    assert(regRes.getData()?.token, 'Token must be issued on registration');
    userId = regRes.getData().user.id || regRes.getData().user._id;
  } else {
    userId = existingUser.id || existingUser._id;
    persistentStore.updateUserPassword(testPhone, await bcrypt.hash(testPassword, 10));
  }

  assert(userId, 'User ID must be valid');
  console.log('  ✓ User registered in persistent store with ID:', userId);

  // Perform Logout
  const logoutReq = { body: { refreshToken: 'rt_dummy_test' }, user: { _id: userId, id: userId } };
  const logoutRes = createMockRes();
  await logoutUser(logoutReq, logoutRes);
  assert.strictEqual(logoutRes.getStatusCode(), 200);
  console.log('  ✓ Logout completed successfully. Session cleared.');

  // Login with SAME phone and password
  const loginReq = { body: { phone: testPhone, password: testPassword } };
  const loginRes = createMockRes();
  await login(loginReq, loginRes);
  assert.strictEqual(loginRes.getStatusCode(), 200, 'Login must succeed with 200');
  assert.strictEqual(loginRes.getData()?.success, true);
  authToken = loginRes.getData().accessToken || loginRes.getData().token;
  refreshToken = loginRes.getData().refreshToken;
  assert(authToken, 'Access token must be returned on login');
  assert(refreshToken, 'Refresh token must be returned on login');
  console.log('  ✓ Re-login with same phone + password succeeded seamlessly!');

  // -------------------------------------------------------------------------
  // TEST 2: Long Period / Token Lifetime & Graceful Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Access Token Lifetime & No Auto-Logout:');
  const decoded = jwt.decode(authToken);
  const lifetimeSec = decoded.exp - decoded.iat;
  const lifetimeDays = Math.round(lifetimeSec / (24 * 3600));
  console.log(`  ✓ Access Token lifetime configured to: ${lifetimeDays} days (never auto-drops user).`);
  assert(lifetimeDays >= 30, 'Access token must be long-lived (>30 days)');

  // Simulate an expired token passing through middleware
  const expiredSecret = process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming';
  const artificiallyExpiredToken = jwt.sign(
    { id: String(userId), type: 'access' },
    expiredSecret,
    { expiresIn: 1 } // 1 second
  );
  await new Promise(r => setTimeout(r, 1100)); // wait for it to expire

  const mockProtectedReq = {
    headers: { authorization: `Bearer ${artificiallyExpiredToken}` }
  };
  const mockProtectedRes = createMockRes();
  let nextCalled = false;
  await protect(mockProtectedReq, mockProtectedRes, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true, 'Expired token for valid registered user must decode gracefully and allow request');
  assert(mockProtectedReq.user, 'req.user must be populated');
  assert.strictEqual(String(mockProtectedReq.user._id || mockProtectedReq.user.id), String(userId));
  console.log('  ✓ Middleware verified: Expired token gracefully authenticated without 401 logout!');

  // -------------------------------------------------------------------------
  // TEST 3: User Remains in Database (Never forced to re-register)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] User permanence across restarts & reloads:');
  persistentStore.reload();
  const foundUser = persistentStore.getUserByPhone(testPhone);
  assert(foundUser, 'User must remain in persistent database after disk reload');
  assert.strictEqual(persistentStore.to10DigitPhone(foundUser.phone), testPhone);
  console.log('  ✓ User account safely persisted in DB. Re-registration NOT required.');

  // -------------------------------------------------------------------------
  // TEST 4 & 5: KIPM Paddy Farm Data, Boundary & Coordinates Permanence
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4 & 5] KIPM Paddy Farm Data & Boundary Persistence:');
  const userFields = persistentStore.getFields(userId);
  assert(Array.isArray(userFields) && userFields.length > 0, 'User must have fields');

  const kipmField = userFields.find(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm') || f.name?.toLowerCase().includes('kipm'));
  assert(kipmField, 'KIPM Paddy Farm must be permanently associated with user');
  assert.strictEqual(kipmField.crop, 'Paddy');
  assert(Array.isArray(kipmField.points) && kipmField.points.length >= 4, 'KIPM boundary must have at least 4 corners');
  
  // Verify exact coordinates: GIDA Gorakhpur, UP
  const expectedP1 = { lat: 26.76920, lng: 83.22950 };
  const p1 = kipmField.points[0];
  assert.strictEqual(Number(p1.lat.toFixed(4)), Number(expectedP1.lat.toFixed(4)), 'Latitude of Corner 1 must match');
  assert.strictEqual(Number(p1.lng.toFixed(4)), Number(expectedP1.lng.toFixed(4)), 'Longitude of Corner 1 must match');
  console.log(`  ✓ KIPM Paddy Farm found with ${kipmField.points.length} boundary points:`, kipmField.points[0]);
  console.log(`  ✓ Area: ${kipmField.areaAcres || kipmField.farmArea} acres | Crop: ${kipmField.crop} | Stage: ${kipmField.cropStage}`);

  // -------------------------------------------------------------------------
  // TEST 6: Save Custom Farm -> Logout -> Login -> Custom Farm & KIPM Intact
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Create Custom Field -> Logout -> Login -> Verify All Fields:');
  const customField = {
    name: 'Sector B Basmati Block',
    fieldName: 'Sector B Basmati Block',
    crop: 'Paddy',
    cropVariety: 'Pusa 1121',
    areaAcres: 2.5,
    farmArea: '2.5',
    points: [
      { lat: 26.7710, lng: 83.2320 },
      { lat: 26.7725, lng: 83.2335 },
      { lat: 26.7705, lng: 83.2340 },
      { lat: 26.7695, lng: 83.2325 }
    ]
  };
  persistentStore.saveField(userId, customField);
  
  // Logout user
  await logoutUser(logoutReq, logoutRes);

  // Re-login
  const reLoginRes = createMockRes();
  await login(loginReq, reLoginRes);
  assert.strictEqual(reLoginRes.getStatusCode(), 200);

  const reloadedFields = persistentStore.getFields(userId);
  assert(reloadedFields.length >= 2, 'Must have at least 2 fields after re-login');
  const hasCustom = reloadedFields.some(f => f.fieldName === 'Sector B Basmati Block' || f.name === 'Sector B Basmati Block');
  const hasKipm = reloadedFields.some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm'));
  assert(hasCustom, 'Custom farm must be preserved after logout and login');
  assert(hasKipm, 'KIPM Paddy Farm must remain preserved after logout and login');
  console.log('  ✓ Both KIPM Paddy Farm and user custom farm are preserved across logout/login cycle!');

  // -------------------------------------------------------------------------
  // TEST 7: Wrong Password Fails Normally
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] Security: Wrong Password Rejection:');
  const wrongLoginReq = { body: { phone: testPhone, password: 'WrongPassword999' } };
  const wrongLoginRes = createMockRes();
  await login(wrongLoginReq, wrongLoginRes);
  assert.strictEqual(wrongLoginRes.getStatusCode(), 401, 'Wrong password must return 401');
  assert.strictEqual(wrongLoginRes.getData()?.code, 'WRONG_PASSWORD');
  console.log('  ✓ Wrong password correctly rejected with 401 WRONG_PASSWORD.');

  // -------------------------------------------------------------------------
  // TEST 8: Dashboard Resolution Contains Real Farms & Crops
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] Dashboard Resolution for User:');
  const dashboard = persistentStore.getDashboardForUser(userId);
  assert(dashboard, 'Dashboard must exist for user');
  assert.strictEqual(dashboard.farmer.id, userId);
  assert(dashboard.farm, 'Dashboard must contain user farm');
  assert(dashboard.currentCrop, 'Dashboard must contain current crop');
  console.log(`  ✓ Dashboard farm resolved to: "${dashboard.farm.name || dashboard.farm.farmName}"`);
  console.log(`  ✓ Dashboard current crop: "${dashboard.currentCrop.cropName}" (${dashboard.currentCrop.cropStage})`);

  console.log('\n================================================================');
  console.log('  ALL SPECIFICATION VERIFICATION TESTS PASSED SUCCESSFULLY! (8/8)');
  console.log('================================================================');
}

runCompleteUserSpecificationTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
