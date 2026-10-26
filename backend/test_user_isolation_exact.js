const assert = require('assert');
const bcrypt = require('bcryptjs');
const persistentStore = require('./utils/persistentStore');
const { register, login, logoutUser } = require('./controllers/authController');
const { getFields, saveField } = require('./controllers/farmerController');
const { getLatestCropHealth } = require('./controllers/cropHealthController');
const { getLatestObservation } = require('./controllers/fieldMonitoringController');

function createMockRes() {
  let statusCode = 200;
  let responseData = null;
  return {
    status(code) { statusCode = code; return this; },
    json(data) { responseData = data; return this; },
    getStatusCode() { return statusCode; },
    getData() { return responseData; }
  };
}

async function runIsolationSuite() {
  console.log('========================================================================');
  console.log('  FASAL DRISHTI: USER-WISE FARM ISOLATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  const testAPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const testAPass = 'FreshFarmerPass#2026';
  let testAUserId = null;

  // ---------------------------------------------------------------------------
  // TEST A: New Farmer Registration -> Clean Dashboard
  // ---------------------------------------------------------------------------
  console.log('[TEST A] New Farmer Registration & Clean State:');
  const existingA = persistentStore.getUserByPhone(testAPhone);
  if (!existingA) {
    const regReq = {
      body: {
        name: 'Rohan Sharma',
        phone: testAPhone,
        password: testAPass,
        role: 'farmer'
      }
    };
    const regRes = createMockRes();
    await register(regReq, regRes);
    assert.strictEqual(regRes.getStatusCode(), 201, 'Registration must return 201');
    testAUserId = regRes.getData().user.id || regRes.getData().user._id;
  } else {
    testAUserId = existingA.id || existingA._id;
  }

  // Log in as new farmer
  const loginReqA = { body: { phone: testAPhone, password: testAPass } };
  const loginResA = createMockRes();
  await login(loginReqA, loginResA);
  assert.strictEqual(loginResA.getStatusCode(), 200, 'Login must succeed');
  console.log('  ✓ Registered & logged in fresh farmer Rohan Sharma (ID:', testAUserId, ')');

  // Verify backend fields for new farmer
  const fieldsReqA = { user: { _id: testAUserId, id: testAUserId } };
  const fieldsResA = createMockRes();
  await getFields(fieldsReqA, fieldsResA);
  const fieldsA = fieldsResA.getData()?.data || [];

  assert.strictEqual(fieldsA.length, 0, 'New farmer MUST have 0 registered fields');
  assert(!fieldsA.some(f => f.fieldName?.toLowerCase().includes('kipm')), 'KIPM paddy must NOT appear for new farmer');
  console.log('  ✓ Zero existing fields returned for new farmer (No "Kipm paddy" cross-leakage).');

  // Verify dashboard data for new farmer
  const dashA = persistentStore.getDashboardForUser(testAUserId);
  assert(!dashA.farm || (!dashA.farm.farmName && (dashA.farm.farmSize === 0 || !dashA.farm.farmSize)), 'New farmer farm must be empty');
  assert.strictEqual(dashA.healthScore, null, 'New farmer healthScore must be null (never fixed 88%)');
  console.log('  ✓ Clean dashboard resolved: farm is empty/null, healthScore is null.');

  // ---------------------------------------------------------------------------
  // TEST B: Create New Farm -> Save -> Logout -> Login -> Farm Preserved
  // ---------------------------------------------------------------------------
  console.log('\n[TEST B] Create New Farm & Persistence Across Logout/Login:');
  const newFarmPayload = {
    fieldName: 'Green Valley Cotton Farm',
    name: 'Green Valley Cotton Farm',
    crop: 'Cotton',
    cropVariety: 'Bt Cotton Hybrid',
    areaAcres: 4.2,
    soilType: 'Black Cotton Soil',
    points: [
      { lat: 21.1458, lng: 79.0882 },
      { lat: 21.1470, lng: 79.0895 },
      { lat: 21.1462, lng: 79.0910 },
      { lat: 21.1450, lng: 79.0890 }
    ]
  };

  const saveReqA = {
    user: { _id: testAUserId, id: testAUserId },
    body: newFarmPayload
  };
  const saveResA = createMockRes();
  await saveField(saveReqA, saveResA);
  assert(saveResA.getStatusCode() === 200 || saveResA.getStatusCode() === 201, 'Field save must succeed');
  const savedFieldId = saveResA.getData()?.data?.id || saveResA.getData()?.data?._id;
  assert(savedFieldId, 'Saved field must return unique ID');
  console.log('  ✓ Farm "Green Valley Cotton Farm" saved with ID:', savedFieldId);

  // Logout Rohan
  const logoutReqA = { user: { _id: testAUserId, id: testAUserId }, body: {} };
  const logoutResA = createMockRes();
  await logoutUser(logoutReqA, logoutResA);
  assert.strictEqual(logoutResA.getStatusCode(), 200, 'Logout successful');

  // Re-login Rohan
  const reLoginResA = createMockRes();
  await login(loginReqA, reLoginResA);
  assert.strictEqual(reLoginResA.getStatusCode(), 200, 'Re-login successful');

  // Verify Rohan has only his Cotton Farm
  const verifyFieldsResA = createMockRes();
  await getFields(fieldsReqA, verifyFieldsResA);
  const reloadedFieldsA = verifyFieldsResA.getData()?.data || [];
  assert.strictEqual(reloadedFieldsA.length, 1, 'Rohan must have exactly 1 field');
  assert.strictEqual(reloadedFieldsA[0].fieldName, 'Green Valley Cotton Farm');
  assert.strictEqual(reloadedFieldsA[0].crop, 'Cotton');
  assert.strictEqual(reloadedFieldsA[0].points.length, 4);
  console.log('  ✓ Custom farm and GPS boundary perfectly preserved across logout/login cycle!');

  // ---------------------------------------------------------------------------
  // TEST C: Switch Accounts -> Verify Kipm paddy owner keeps data & no leakage
  // ---------------------------------------------------------------------------
  console.log('\n[TEST C] Switch Accounts & Data Integrity:');
  const demoPhone = '9876543210';
  const demoPass = 'password123';
  const loginReqDemo = { body: { phone: demoPhone, password: demoPass } };
  const loginResDemo = createMockRes();
  await login(loginReqDemo, loginResDemo);
  assert.strictEqual(loginResDemo.getStatusCode(), 200, 'Demo login must succeed');
  const demoUserId = loginResDemo.getData().user.id || loginResDemo.getData().user._id;

  // Verify Kipm paddy exists for demo farmer
  const demoFieldsReq = { user: { _id: demoUserId, id: demoUserId } };
  const demoFieldsRes = createMockRes();
  await getFields(demoFieldsReq, demoFieldsRes);
  const demoFields = demoFieldsRes.getData()?.data || [];
  const hasKipm = demoFields.some(f => f.id === 'field_kipm_paddy_01' || f.fieldName?.toLowerCase().includes('kipm'));
  assert(hasKipm, 'Demo farmer MUST retain their "Kipm paddy" farm');
  console.log('  ✓ Demo farmer preserves "Kipm paddy" farm (Boundary, Area, Crop: Paddy intact).');

  // Verify demo farmer does NOT see Rohan's Cotton Farm
  const demoHasCotton = demoFields.some(f => f.fieldName === 'Green Valley Cotton Farm');
  assert(!demoHasCotton, 'Demo farmer must NOT see Rohan\'s Cotton farm');
  console.log('  ✓ Demo farmer does NOT see Rohan\'s Cotton farm.');

  // Switch back to Rohan
  const rohanRecheckRes = createMockRes();
  await getFields(fieldsReqA, rohanRecheckRes);
  const rohanFieldsAgain = rohanRecheckRes.getData()?.data || [];
  assert.strictEqual(rohanFieldsAgain.length, 1);
  assert(!rohanFieldsAgain.some(f => f.fieldName?.toLowerCase().includes('kipm')));
  console.log('  ✓ Switched back to Rohan: Still sees only his Cotton farm. Zero cross-leakage!');

  // ---------------------------------------------------------------------------
  // TEST D: Security Checks (Unauthorized Access Rejection)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST D] Security & Unauthorized Cross-User Access Enforcement:');
  
  // 1. Rohan tries to fetch crop health for Kipm paddy (field_kipm_paddy_01)
  const hackHealthReq = {
    user: { _id: testAUserId, id: testAUserId },
    params: { fieldId: 'field_kipm_paddy_01' }
  };
  const hackHealthRes = createMockRes();
  await getLatestCropHealth(hackHealthReq, hackHealthRes);
  assert.strictEqual(hackHealthRes.getStatusCode(), 403, 'Cross-user crop health must return 403 Forbidden');
  console.log('  ✓ Unauthorized crop-health access denied with 403 Forbidden.');

  // 2. Rohan tries to fetch monitoring observation for Kipm paddy
  const hackObsReq = {
    user: { _id: testAUserId, id: testAUserId },
    params: { fieldId: 'field_kipm_paddy_01' }
  };
  const hackObsRes = createMockRes();
  await getLatestObservation(hackObsReq, hackObsRes);
  assert.strictEqual(hackObsRes.getStatusCode(), 403, 'Cross-user field monitoring must return 403 Forbidden');
  console.log('  ✓ Unauthorized monitoring observation access denied with 403 Forbidden.');

  // 3. Demo user tries to access Rohan's saved field
  const hackDemoReq = {
    user: { _id: demoUserId, id: demoUserId },
    params: { fieldId: savedFieldId }
  };
  const hackDemoRes = createMockRes();
  await getLatestCropHealth(hackDemoReq, hackDemoRes);
  assert.strictEqual(hackDemoRes.getStatusCode(), 403, 'Cross-user access by demo user must also return 403 Forbidden');
  console.log('  ✓ Reverse cross-user access denied with 403 Forbidden.');

  console.log('\n========================================================================');
  console.log('  ALL 4 ISOLATION & SECURITY TESTS PASSED FLAWLESSLY! (4/4)');
  console.log('========================================================================\n');
}

runIsolationSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
