const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const persistentStore = require('./utils/persistentStore');

async function testFullHttpLifecycle() {
  console.log('=== STARTING END-TO-END HTTP REFRESH & PERSISTENCE VERIFICATION ===\n');

  // Spin up express on port 5009
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  const server = app.listen(5009);
  console.log('[Server] In-process test backend running on http://127.0.0.1:5009');

  const BASE_URL = 'http://127.0.0.1:5009/api';
  const testPhone = '9666554433';
  const testPassword = 'FarmerSecret#2026';

  try {
    // 1. Register
    console.log('\n[Step 1] Registering farmer via HTTP...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Santosh Kumar',
      phone: testPhone,
      password: testPassword,
      state: 'Uttar Pradesh',
      district: 'Gorakhpur'
    });
    console.log('  ✓ Registered:', regRes.data.success, 'UID:', regRes.data.user.id || regRes.data.user._id);
    const userId = regRes.data.user.id || regRes.data.user._id;

    // 2. Save farm field to persistent store under userId
    console.log('\n[Step 2] Attaching farm data to permanent userId...');
    persistentStore.saveField(userId, {
      name: 'KIPM Paddy Field - Sector A',
      crop: 'Paddy',
      area: '3.2 Acres',
      boundary: [{ lat: 26.85, lng: 80.95 }, { lat: 26.86, lng: 80.96 }]
    });
    const fieldsBefore = persistentStore.getFields(userId);
    console.log(`  ✓ Farm saved. Total fields for user ${userId}:`, fieldsBefore.length);

    // 3. Login with Remember Me
    console.log('\n[Step 3] Logging in with Remember Me checked...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '+91 96665 54433', // phone formatting test
      password: testPassword,
      rememberMe: true
    });

    if (!loginRes.data.success) throw new Error('Login failed: ' + loginRes.data.message);
    const { accessToken, refreshToken } = loginRes.data;
    console.log('  ✓ Received Access Token & Refresh Token');

    // 4. Verify /auth/me with valid Access Token
    console.log('\n[Step 4] Accessing GET /api/auth/me with initial access token...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('  ✓ Authorized! Farmer name:', meRes.data.user.name);

    // 5. Expired token simulation
    console.log('\n[Step 5] Simulating token expiry (manufacturing expired JWT)...');
    const JWT_SECRET = process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming';
    const expiredToken = jwt.sign(
      { id: userId, type: 'access', iat: Math.floor(Date.now() / 1000) - 200 },
      JWT_SECRET,
      { expiresIn: 60 } // expired
    );

    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      throw new Error('Expired token should have been rejected!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('  ✓ Expired token rejected with 401 TOKEN_EXPIRED:', err.response.data.code);
      } else {
        throw err;
      }
    }

    // 6. Silent Refresh
    console.log('\n[Step 6] Executing silent refresh via POST /api/auth/refresh...');
    const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    });
    if (!refreshRes.data.success) throw new Error('Refresh failed: ' + refreshRes.data.message);
    const newAccessToken = refreshRes.data.accessToken;
    const newRefreshToken = refreshRes.data.refreshToken;
    console.log('  ✓ Silent refresh succeeded! New access token received.');

    // 7. Replay /auth/me with newly refreshed token
    console.log('\n[Step 7] Replaying original request with newly refreshed access token...');
    const replayRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    console.log('  ✓ Request replayed successfully! Session uninterrupted. User:', replayRes.data.user.name);

    // 8. Explicit Logout
    console.log('\n[Step 8] Farmer explicitly logs out...');
    const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, {
      refreshToken: newRefreshToken
    });
    console.log('  ✓ Logout response:', logoutRes.data.message);

    // 9. Verify Refresh Token is now revoked
    console.log('\n[Step 9] Verifying revoked session cannot refresh again...');
    try {
      await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: newRefreshToken
      });
      throw new Error('Revoked session should not refresh!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('  ✓ Revoked session properly rejected with 401:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 10. Re-login after explicit logout with same phone and password
    console.log('\n[Step 10] Re-logging in after explicit logout with same credentials...');
    const reloginRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: testPhone,
      password: testPassword
    });
    if (!reloginRes.data.success) throw new Error('Re-login failed: ' + reloginRes.data.message);
    console.log('  ✓ Re-login succeeded smoothly without registration!');

    // 11. Verify farm data survived entire lifecycle
    console.log('\n[Step 11] Verifying all farm data survived logout & re-login...');
    const fieldsAfter = persistentStore.getFields(userId);
    console.log(`  ✓ Farm count for user ${userId}:`, fieldsAfter.length);
    if (fieldsAfter.length === 0) throw new Error('Farm data lost!');

    console.log('\n🎉 ALL 11 END-TO-END HTTP TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
    console.log('[Server] In-process test backend stopped.');
  }
}

testFullHttpLifecycle().catch(err => {
  console.error('\n❌ HTTP LIFECYCLE TEST FAILED:', err.message);
  process.exit(1);
});
