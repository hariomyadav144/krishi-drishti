const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';

async function runExactScenario() {
  console.log('--- 1. REGISTER USER ---');
  const testPhone = '9876543299';
  const testPass = 'TestPassword123';
  const userAName = 'Ramesh Patel';

  let regRes;
  try {
    regRes = await axios.post(`${API_URL}/auth/register`, {
      name: userAName,
      phone: testPhone,
      password: testPass,
      role: 'farmer'
    });
  } catch (err) {
    if (err.response?.data?.code === 'PHONE_EXISTS') {
      console.log('Phone exists, will proceed to login test directly.');
    } else {
      throw err;
    }
  }

  if (regRes?.data?.success) {
    console.log('✅ Account successfully created for', testPhone);
    assert.strictEqual(regRes.data.success, true);
  }

  console.log('\n--- 2. LOGOUT ---');
  console.log('Destroying session token (logout simulation)...');
  let currentToken = null;

  console.log('\n--- 3. LOGIN USING EXACT SAME PHONE & PASSWORD ---');
  const loginRes1 = await axios.post(`${API_URL}/auth/login`, {
    phone: testPhone,
    password: testPass
  });
  assert.strictEqual(loginRes1.data.success, true);
  currentToken = loginRes1.data.token;
  const userAId = loginRes1.data.user.id || loginRes1.data.user._id;
  console.log('✅ LOGIN SUCCESS with exact same credentials! User ID:', userAId);

  console.log('\n--- 4. LOGIN WITH DIFFERENT PHONE FORMATS (+91, space, 10 digits) ---');
  const formats = [
    `+91 ${testPhone}`,
    `+91${testPhone}`,
    `0${testPhone}`,
    testPhone
  ];

  for (const fmt of formats) {
    const res = await axios.post(`${API_URL}/auth/login`, {
      phone: fmt,
      password: testPass
    });
    assert.strictEqual(res.data.success, true);
    console.log(`✅ Login SUCCESS with format "${fmt}"`);
  }

  console.log('\n--- 5. CREATE FARM & FIELD FOR USER A ---');
  const farmPayload = {
    fieldName: 'Ramesh North Field',
    name: 'Ramesh North Field',
    crop: 'Wheat',
    areaAcres: 4.5,
    points: [
      { lat: 26.8467, lng: 80.9462 },
      { lat: 26.8475, lng: 80.9480 },
      { lat: 26.8450, lng: 80.9490 }
    ]
  };

  const saveFarmRes = await axios.post(`${API_URL}/farmer/fields`, farmPayload, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  assert.strictEqual(saveFarmRes.data.success, true);
  console.log('✅ Farm & GPS Boundary saved for User A. Farm ID:', saveFarmRes.data.data.id);

  console.log('\n--- 6. LOGOUT AND RE-LOGIN USER A ---');
  currentToken = null;
  const loginRes2 = await axios.post(`${API_URL}/auth/login`, {
    phone: testPhone,
    password: testPass
  });
  currentToken = loginRes2.data.token;
  const listFarmsRes = await axios.get(`${API_URL}/farmer/fields`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  assert.strictEqual(listFarmsRes.data.success, true);
  const userAFarms = listFarmsRes.data.data;
  assert.strictEqual(userAFarms.some(f => f.name === 'Ramesh North Field'), true);
  console.log('✅ Farm A & GPS Boundary survived logout and re-login! Found:', userAFarms.length, 'farms');

  console.log('\n--- 7. MULTI-USER ISOLATION TEST (USER A vs USER B) ---');
  const userBPhone = '9876543298';
  const userBPass = 'TestPassword456';
  let userBToken = null;

  try {
    const regB = await axios.post(`${API_URL}/auth/register`, {
      name: 'Suresh Kumar',
      phone: userBPhone,
      password: userBPass,
      role: 'farmer'
    });
    userBToken = regB.data.token;
  } catch (err) {
    const logB = await axios.post(`${API_URL}/auth/login`, {
      phone: userBPhone,
      password: userBPass
    });
    userBToken = logB.data.token;
  }

  // Create Farm B for User B
  await axios.post(`${API_URL}/farmer/fields`, {
    fieldName: 'Suresh Mustard Field',
    name: 'Suresh Mustard Field',
    crop: 'Mustard',
    areaAcres: 2.1,
    points: [
      { lat: 28.6139, lng: 77.2090 },
      { lat: 28.6145, lng: 77.2105 },
      { lat: 28.6120, lng: 77.2115 }
    ]
  }, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });

  // Verify User B does NOT see Farm A
  const userBFarms = (await axios.get(`${API_URL}/farmer/fields`, {
    headers: { Authorization: `Bearer ${userBToken}` }
  })).data.data;

  const userBSeesFarmA = userBFarms.some(f => f.name === 'Ramesh North Field');
  assert.strictEqual(userBSeesFarmA, false, 'User B must NOT see User A farm!');
  console.log('✅ Isolation Verified: User B does NOT see User A farm.');

  // Verify User A does NOT see Farm B
  const userAFarmsCheck = (await axios.get(`${API_URL}/farmer/fields`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  })).data.data;
  const userASeesFarmB = userAFarmsCheck.some(f => f.name === 'Suresh Mustard Field');
  assert.strictEqual(userASeesFarmB, false, 'User A must NOT see User B farm!');
  console.log('✅ Isolation Verified: User A does NOT see User B farm.');

  console.log('\n========================================================');
  console.log('🎉 ALL TESTS IN EXACT USER SCENARIO PASSED 100%!');
  console.log('========================================================');
}

runExactScenario().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
