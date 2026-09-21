const http = require('http');
const { app } = require('./server');

// Helper to make HTTP requests to test server
function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('FASAL DRISHTI - AUTHENTICATION & USER DATA ISOLATION TESTS');
  console.log('====================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // ---------------------------------------------------------
    // TEST 1: Register Farmer A
    // ---------------------------------------------------------
    console.log('--- TEST 1: Register Farmer Alpha ---');
    const regResA = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
    }, {
      name: 'Farmer Alpha',
      phone: '9111111111',
      email: 'alpha@farm.in',
      password: 'Password@123',
      role: 'farmer',
      crop: 'Wheat',
      farmSize: 7.5,
      location: 'Punjab Alpha Village',
    });

    assert(regResA.status === 201, `Registration A status is 201 (got ${regResA.status})`);
    assert(regResA.body.success === true, 'Registration A returned success');
    assert(regResA.body.token, 'Registration A returned JWT token');
    assert(regResA.body.user && regResA.body.user.name === 'Farmer Alpha', `User A name matches "Farmer Alpha" (got ${regResA.body?.user?.name})`);
    assert(regResA.body.user && regResA.body.user.phone === '9111111111', `User A phone matches "9111111111"`);
    const tokenA = regResA.body.token;
    const userIdA = regResA.body.user.id || regResA.body.user._id;

    // ---------------------------------------------------------
    // TEST 2: Register Farmer B
    // ---------------------------------------------------------
    console.log('\n--- TEST 2: Register Farmer Beta ---');
    const regResB = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
    }, {
      name: 'Farmer Beta',
      phone: '9222222222',
      email: 'beta@farm.in',
      password: 'Password@456',
      role: 'farmer',
      crop: 'Rice',
      farmSize: 3.0,
      location: 'Bihar Beta Village',
    });

    assert(regResB.status === 201, `Registration B status is 201 (got ${regResB.status})`);
    assert(regResB.body.success === true, 'Registration B returned success');
    assert(regResB.body.token, 'Registration B returned JWT token');
    assert(regResB.body.user && regResB.body.user.name === 'Farmer Beta', `User B name matches "Farmer Beta"`);
    assert(regResB.body.user && regResB.body.user.phone === '9222222222', `User B phone matches "9222222222"`);
    const tokenB = regResB.body.token;
    const userIdB = regResB.body.user.id || regResB.body.user._id;

    assert(userIdA !== userIdB, `User IDs are strictly unique: ${userIdA} !== ${userIdB}`);

    // ---------------------------------------------------------
    // TEST 3: Login Farmer A & Verify Isolated Dashboard Data
    // ---------------------------------------------------------
    console.log('\n--- TEST 3: Login Farmer A & Check Isolated Data ---');
    const loginResA = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
    }, {
      phone: '9111111111',
      password: 'Password@123',
    });

    assert(loginResA.status === 200, `Login A status is 200 (got ${loginResA.status})`);
    assert(loginResA.body.user && loginResA.body.user.name === 'Farmer Alpha', 'Login A identified Farmer Alpha');

    const meResA = await makeRequest(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(meResA.status === 200, `Auth Me A status is 200`);
    assert(meResA.body.user && meResA.body.user.name === 'Farmer Alpha', `Auth Me returned Farmer Alpha`);
    assert(meResA.body.farm && meResA.body.farm.farmSize === 7.5, `Auth Me farm size is 7.5 (Alpha's farm)`);

    const dashResA = await makeRequest(server, {
      method: 'GET',
      path: '/api/farmer/dashboard',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(dashResA.status === 200, 'Farmer A Dashboard status is 200');
    assert(dashResA.body.data && dashResA.body.data.farmer.name === 'Farmer Alpha', 'Farmer A Dashboard has farmer name "Farmer Alpha"');
    assert(dashResA.body.data && dashResA.body.data.farmer.phone === '9111111111', 'Farmer A Dashboard has farmer phone "9111111111"');
    assert(dashResA.body.data && dashResA.body.data.currentCrop && dashResA.body.data.currentCrop.cropName === 'Wheat', `Farmer A currentCrop is Wheat (got ${dashResA.body.data?.currentCrop?.cropName})`);
    assert(!dashResA.body.data?.farmer?.name?.includes('Rameshwar'), 'Farmer A data NEVER contains Rameshwar Patil');
    assert(!dashResA.body.data?.farmer?.name?.includes('Beta'), 'Farmer A data NEVER leaks Farmer Beta');

    // ---------------------------------------------------------
    // TEST 4: Login Farmer B & Verify Isolated Dashboard Data
    // ---------------------------------------------------------
    console.log('\n--- TEST 4: Login Farmer B & Check Isolated Data ---');
    const loginResB = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
    }, {
      phone: '9222222222',
      password: 'Password@456',
    });

    assert(loginResB.status === 200, `Login B status is 200 (got ${loginResB.status})`);
    assert(loginResB.body.user && loginResB.body.user.name === 'Farmer Beta', 'Login B identified Farmer Beta');

    const dashResB = await makeRequest(server, {
      method: 'GET',
      path: '/api/farmer/dashboard',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(dashResB.status === 200, 'Farmer B Dashboard status is 200');
    assert(dashResB.body.data && dashResB.body.data.farmer.name === 'Farmer Beta', 'Farmer B Dashboard has farmer name "Farmer Beta"');
    assert(dashResB.body.data && dashResB.body.data.farmer.phone === '9222222222', 'Farmer B Dashboard has farmer phone "9222222222"');
    assert(dashResB.body.data && dashResB.body.data.currentCrop && dashResB.body.data.currentCrop.cropName === 'Rice', `Farmer B currentCrop is Rice (got ${dashResB.body.data?.currentCrop?.cropName})`);
    assert(!dashResB.body.data?.farmer?.name?.includes('Rameshwar'), 'Farmer B data NEVER contains Rameshwar Patil');
    assert(!dashResB.body.data?.farmer?.name?.includes('Alpha'), 'Farmer B data NEVER leaks Farmer Alpha');

    // ---------------------------------------------------------
    // TEST 5: Verify Invalid Credentials Rejection & Exact Codes
    // ---------------------------------------------------------
    console.log('\n--- TEST 5: Verify Invalid Credentials Rejection ---');
    const invalidPassRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
    }, {
      phone: '9111111111',
      password: 'WrongPassword!',
    });
    assert(invalidPassRes.status === 401, `Invalid password correctly returns 401 (got ${invalidPassRes.status})`);
    assert(invalidPassRes.body.code === 'WRONG_PASSWORD', 'Invalid password returns code: WRONG_PASSWORD');

    const unknownUserRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
    }, {
      phone: '9999999999',
      password: 'AnyPassword',
    });
    assert(unknownUserRes.status === 404, `Unknown user correctly returns 404 (got ${unknownUserRes.status})`);
    assert(unknownUserRes.body.code === 'ACCOUNT_NOT_FOUND', 'Unknown user returns code: ACCOUNT_NOT_FOUND');

    // ---------------------------------------------------------
    // TEST 6: Duplicate Registration Handling
    // ---------------------------------------------------------
    console.log('\n--- TEST 6: Duplicate Registration Rejection ---');
    const dupPhoneRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
    }, {
      name: 'Duplicate Alpha',
      phone: '9111111111', // Same as Alpha
      password: 'Password@999',
    });
    assert(dupPhoneRes.status === 400, `Duplicate phone returns 400 (got ${dupPhoneRes.status})`);
    assert(dupPhoneRes.body.code === 'PHONE_EXISTS', 'Duplicate phone returns code: PHONE_EXISTS');

    const dupEmailRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
    }, {
      name: 'Duplicate Email Person',
      phone: '9333333333',
      email: 'alpha@farm.in', // Same as Alpha
      password: 'Password@999',
    });
    assert(dupEmailRes.status === 400, `Duplicate email returns 400 (got ${dupEmailRes.status})`);
    assert(dupEmailRes.body.code === 'EMAIL_EXISTS', 'Duplicate email returns code: EMAIL_EXISTS');

    // ---------------------------------------------------------
    // TEST 7: New Farmer with No Initial Farm Data Starts Empty
    // ---------------------------------------------------------
    console.log('\n--- TEST 7: New Farmer Without Farm Info Starts Clean ---');
    const regResC = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
    }, {
      name: 'Brand New Farmer',
      phone: '9444444444',
      password: 'Password@new',
    });
    assert(regResC.status === 201, 'Brand new farmer registered');
    const tokenC = regResC.body.token;

    const dashResC = await makeRequest(server, {
      method: 'GET',
      path: '/api/farmer/dashboard',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(dashResC.body.data.farmer.name === 'Brand New Farmer', 'Dashboard reflects Brand New Farmer name');
    assert(dashResC.body.data.farm.farmSize === 0, 'New farmer farmSize is 0 (not 4.5 or 5.5)');
    assert(!dashResC.body.data.currentCrop, 'New farmer currentCrop is empty (not Tomato or Wheat)');
    assert(!dashResC.body.data.profile.village, 'New farmer village is empty (not Pimpalgaon)');

    // ---------------------------------------------------------
    // TEST 8: Demo Mode Isolation
    // ---------------------------------------------------------
    console.log('\n--- TEST 8: Demo Mode Isolation ---');
    const demoLoginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
    }, {
      phone: '9876543210',
      password: 'password123',
    });
    assert(demoLoginRes.status === 200, `Demo login returns 200`);
    assert(demoLoginRes.body.user && demoLoginRes.body.user.name.includes('Rameshwar'), 'Demo user is Rameshwar Patil');

    // Re-verify Farmer A data is still intact and not corrupted by demo login
    const dashResA2 = await makeRequest(server, {
      method: 'GET',
      path: '/api/farmer/dashboard',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(dashResA2.body.data.farmer.name === 'Farmer Alpha', 'Farmer A data remained completely isolated after demo run');
    assert(dashResA2.body.data.currentCrop.cropName === 'Wheat', 'Farmer A crop remains Wheat');

  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');
  process.exit(failCount > 0 ? 1 : 0);
}

runTests();
