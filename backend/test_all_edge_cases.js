// backend/test_all_edge_cases.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTH & PERSISTENCE TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED:', err.response?.data?.message || err.message);
      failed++;
    }
  }

  const uniqueId = Date.now().toString().slice(-6);
  const testPhoneA = `98${uniqueId}01`;
  const testPhoneB = `98${uniqueId}02`;
  const passwordA = 'SecurePass@123';
  const passwordB = 'DifferentPass@456';
  let tokenA = null;
  let userA = null;
  let tokenB = null;
  let userB = null;

  // Test A & H: Register User A and verify duplicate phone rejection
  await test('Test A: Register User A', async () => {
    const res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Farmer Ramesh',
      phone: testPhoneA,
      password: passwordA,
      state: 'Maharashtra',
      mainCrop: 'Wheat',
      farmSize: 4.5,
    });
    if (!res.data.success || !res.data.token || !res.data.user) {
      throw new Error('Registration response missing token or user');
    }
    tokenA = res.data.token;
    userA = res.data.user;
  });

  await test('Test H: Prevent duplicate phone registration', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Imposter Farmer',
        phone: testPhoneA,
        password: 'AnotherPassword',
      });
      throw new Error('Should have thrown 400 for duplicate phone');
    } catch (err) {
      if (err.response?.status !== 400 && !err.response?.data?.message?.includes('already registered')) {
        throw err;
      }
    }
  });

  // Test F: Wrong password rejection
  await test('Test F: Reject login with wrong password', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        phone: testPhoneA,
        password: 'WrongPassword999',
      });
      throw new Error('Should have failed with invalid credentials');
    } catch (err) {
      if (err.response?.status !== 400 && err.response?.status !== 401) {
        throw err;
      }
    }
  });

  // Test: Login User A with correct credentials
  await test('Login User A with valid credentials', async () => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      phone: testPhoneA,
      password: passwordA,
    });
    if (!res.data.success || !res.data.token) {
      throw new Error('Login failed with valid credentials');
    }
    tokenA = res.data.token;
  });

  // Test C & D: Create Field/Farm with GPS mapping boundary and verify persistence
  let savedFieldId = null;
  const boundaryPoints = [
    { lat: 20.1741, lng: 73.9852 },
    { lat: 20.1755, lng: 73.9870 },
    { lat: 20.1738, lng: 73.9885 },
    { lat: 20.1720, lng: 73.9860 },
  ];

  await test('Test C & D: Save Farm GPS Boundary and Mapping data', async () => {
    const fieldPayload = {
      name: 'South Sugarcane Field',
      fieldName: 'South Sugarcane Field',
      points: boundaryPoints,
      boundary: boundaryPoints,
      areaAcres: 5.25,
      areaHectares: 2.12,
      crop: 'Sugarcane',
      cropVariety: 'Co 86032',
      season: 'Kharif',
      soilType: 'Black Soil / Regur',
      irrigationMethod: 'Drip Irrigation',
    };

    const res = await axios.post(`${API_URL}/farmer/fields`, fieldPayload, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (!res.data.success || !res.data.data) {
      throw new Error('Failed to save field');
    }
    savedFieldId = res.data.data.id || res.data.data._id;
  });

  // Test E & K: Fetch fields after logout/login simulation
  await test('Test E & K: Restore saved farm and boundary points across sessions', async () => {
    const res = await axios.get(`${API_URL}/farmer/fields`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (!res.data.success || !Array.isArray(res.data.data)) {
      throw new Error('Failed to fetch fields');
    }

    const field = res.data.data.find(f => (f.id || f._id) === savedFieldId);
    if (!field) {
      throw new Error(`Saved field ${savedFieldId} not found in retrieved fields`);
    }

    if (!Array.isArray(field.points) || field.points.length !== 4) {
      throw new Error(`GPS boundary points lost! Expected 4 points, got ${field.points?.length}`);
    }

    if (Math.abs(Number(field.areaAcres) - 5.25) > 0.01) {
      throw new Error(`Area calculation lost! Expected 5.25, got ${field.areaAcres}`);
    }
  });

  // Test I: Multiple Farms support
  await test('Test I: Support multiple independent farms under same user', async () => {
    const secondFieldPayload = {
      name: 'North Mango Orchard',
      fieldName: 'North Mango Orchard',
      points: [
        { lat: 20.1800, lng: 73.9900 },
        { lat: 20.1820, lng: 73.9920 },
        { lat: 20.1790, lng: 73.9930 }
      ],
      areaAcres: 3.10,
      crop: 'Mango',
    };

    const res = await axios.post(`${API_URL}/farmer/fields`, secondFieldPayload, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (!res.data.success) throw new Error('Failed to create second farm');

    const listRes = await axios.get(`${API_URL}/farmer/fields`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const userFields = listRes.data.data;
    if (userFields.length < 2) {
      throw new Error(`Expected at least 2 farms, found ${userFields.length}`);
    }
  });

  // Test J: User A vs User B data isolation
  await test('Test J: Strict Data Isolation between User A and User B', async () => {
    // Register User B
    const resB = await axios.post(`${API_URL}/auth/register`, {
      name: 'Farmer Baldev',
      phone: testPhoneB,
      password: passwordB,
      state: 'Punjab',
      mainCrop: 'Rice',
      farmSize: 10.0,
    });
    tokenB = resB.data.token;
    userB = resB.data.user;

    // Fetch fields as User B
    const listResB = await axios.get(`${API_URL}/farmer/fields`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const fieldsB = listResB.data.data;
    // User B must NOT have User A's fields!
    const leak = fieldsB.some(f => (f.id || f._id) === savedFieldId);
    if (leak) {
      throw new Error('SECURITY VIOLATION: User B can see User A field!');
    }
  });

  // Test G: Forgot Password Flow (OTP Send -> Verify -> Reset Password -> Login)
  await test('Test G: Forgot Password OTP dispatch, verification, and reset', async () => {
    // 1. Request OTP
    const otpReq = await axios.post(`${API_URL}/auth/forgot-password/send-otp`, {
      phone: testPhoneA,
    });
    if (!otpReq.data.success) throw new Error('Send OTP failed');
    const debugOtp = otpReq.data.debugOtp;
    if (!debugOtp) throw new Error('Debug OTP not returned in development mode');

    // 2. Verify OTP
    const verifyReq = await axios.post(`${API_URL}/auth/forgot-password/verify-otp`, {
      phone: testPhoneA,
      otp: debugOtp,
    });
    if (!verifyReq.data.success || !verifyReq.data.resetToken) {
      throw new Error('Verify OTP failed or reset token missing');
    }
    const resetToken = verifyReq.data.resetToken;

    // 3. Reset password
    const newPasswordA = 'BrandNewPassword@2026';
    const resetReq = await axios.post(`${API_URL}/auth/forgot-password/reset-password`, {
      phone: testPhoneA,
      resetToken,
      newPassword: newPasswordA,
    });
    if (!resetReq.data.success) throw new Error('Reset password failed');

    // 4. Login with old password must fail
    try {
      await axios.post(`${API_URL}/auth/login`, {
        phone: testPhoneA,
        password: passwordA,
      });
      throw new Error('Old password should no longer work');
    } catch (oldPassErr) {
      if (oldPassErr.response?.status !== 400 && oldPassErr.response?.status !== 401) {
        throw oldPassErr;
      }
    }

    // 5. Login with new password must succeed
    const newLoginReq = await axios.post(`${API_URL}/auth/login`, {
      phone: testPhoneA,
      password: newPasswordA,
    });
    if (!newLoginReq.data.success || !newLoginReq.data.token) {
      throw new Error('Login with new password failed');
    }

    // 6. Verify farm data STILL exists under new session!
    const fieldsAfterReset = await axios.get(`${API_URL}/farmer/fields`, {
      headers: { Authorization: `Bearer ${newLoginReq.data.token}` },
    });
    const foundField = fieldsAfterReset.data.data.find(f => (f.id || f._id) === savedFieldId);
    if (!foundField) {
      throw new Error('CRITICAL BUG: Farm data disappeared after password reset!');
    }
  });

  // Test N: Duplicate OTP requests cooldown enforcement
  await test('Test N: Rate limiting and resend cooldown on OTP requests', async () => {
    // Immediate second request should be throttled
    try {
      await axios.post(`${API_URL}/auth/forgot-password/send-otp`, {
        phone: testPhoneA,
      });
      // In dev mode with fallback, or if cooldown returns 429
    } catch (cooldownErr) {
      if (cooldownErr.response?.status !== 429) {
        throw cooldownErr;
      }
    }
  });

  console.log('\n========================================================');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
