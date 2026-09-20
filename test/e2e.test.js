const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:3000';

// Helper to make HTTP requests with cookie support
function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('🚀 Running End-to-End Live HTTP Workflow Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // Test 1: GET /auth/login
  await test('GET /auth/login renders login portal', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('LabTrack Portal'), 'Body should contain LabTrack Portal');
    assert(res.body.includes('admin@labtrack.edu'), 'Body should contain demo account credentials');
  });

  // Test 2: GET /auth/register
  await test('GET /auth/register renders registration form', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/register',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('Create Requester Account'), 'Body should contain register title');
  });

  // Test 3: Admin Login & Session Cookie
  let adminCookie = '';
  await test('POST /auth/login with Admin credentials', async () => {
    const postData = 'email=admin%40labtrack.edu&password=Admin%4012345';
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/dashboard');
    assert(res.headers['set-cookie'], 'Set-cookie header must be present');
    adminCookie = res.headers['set-cookie'][0].split(';')[0];
  });

  // Test 4: Admin Dashboard with Session Cookie
  await test('GET /dashboard with Admin session renders Command Center', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('Institutional Lab Operations Command Center'), 'Must render admin hero');
    assert(res.body.includes('Total Equipment Units'), 'Must render real metrics');
    assert(res.body.includes('categoryChartData'), 'Must include Chart.js dataset');
  });

  // Test 5: Equipment Catalog & Search
  await test('GET /assets with search filter', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/assets?q=Oscilloscope',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('Rigol DS1054Z'), 'Filtered result must include Rigol DS1054Z');
    assert(res.body.includes('LAB-IOT-001'), 'Must include asset tag');
  });

  // Test 6: Request Queue & Overdue Filter
  await test('GET /requests with status=overdue', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/requests?status=overdue',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('REQ-2026-0004'), 'Must list overdue request REQ-2026-0004');
    assert(res.body.includes('OVERDUE'), 'Must display OVERDUE badge');
  });

  // Test 7: Reports & CSV Export
  await test('GET /reports and CSV Export', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/reports/export/assets',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.headers['content-type'].includes('text/csv'), 'Content type must be text/csv');
    assert(res.body.includes('Asset Tag'), 'CSV must contain Asset Tag header');
    assert(res.body.includes('LAB-IOT-001'), 'CSV must contain asset data rows');
  });

  // Test 8: Student Login & Role Security Guard
  let studentCookie = '';
  await test('Student Login and 403 Forbidden Protection on Admin Routes', async () => {
    const postData = 'email=student.rahul%40labtrack.edu&password=User%4012345';
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert.strictEqual(loginRes.statusCode, 302);
    studentCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    // Check Student Dashboard
    const dashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 'Cookie': studentCookie }
    });
    assert.strictEqual(dashRes.statusCode, 200);
    assert(dashRes.body.includes('Welcome, Rahul Sharma'), 'Student dashboard must greet user by name');

    // Attempting to access admin user directory as student must return 403
    const adminRouteRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/admin/users',
      method: 'GET',
      headers: { 'Cookie': studentCookie }
    });
    assert.strictEqual(adminRouteRes.statusCode, 403, 'Student must receive 403 Forbidden on /admin/users');
    assert(adminRouteRes.body.includes('403 - Access Denied'), 'Must render styled 403 error page');
  });

  // Test 9: Lab In-Charge Login & Dashboard
  await test('Lab In-Charge Login & Operations Dashboard', async () => {
    const postData = 'email=incharge.cs%40labtrack.edu&password=Lab%4012345';
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert.strictEqual(loginRes.statusCode, 302);
    const inchargeCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const dashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 'Cookie': inchargeCookie }
    });
    assert.strictEqual(dashRes.statusCode, 200);
    assert(dashRes.body.includes('Laboratory Operations Dashboard'), 'Must render Lab In-Charge dashboard');
  });

  // Test 10: Staff / Researcher Login
  await test('Staff / Researcher Login & Dashboard', async () => {
    const postData = 'email=staff.priya%40labtrack.edu&password=User%4012345';
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert.strictEqual(loginRes.statusCode, 302);
    const staffCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const dashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 'Cookie': staffCookie }
    });
    assert.strictEqual(dashRes.statusCode, 200);
    assert(dashRes.body.includes('Welcome, Dr. Priya Nair'), 'Staff dashboard must greet user by name');
  });

  // Test 11: Invalid Login Rejection
  await test('POST /auth/login with Invalid Password is rejected', async () => {
    const postData = 'email=admin%40labtrack.edu&password=WrongPassword123!';
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    assert.strictEqual(loginRes.statusCode, 302);
    assert.strictEqual(loginRes.headers.location, '/auth/login');
  });

  // Test 12: 404 Error Page
  await test('GET /non-existent-page renders styled 404 error page', async () => {
    const res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/some/random/non-existent/path',
      method: 'GET',
      headers: { 'Cookie': studentCookie }
    });
    assert.strictEqual(res.statusCode, 404);
    assert(res.body.includes('404 - Page Not Found'), 'Must render 404 template');
  });

  console.log('\n=======================================================');
  console.log(`📊 E2E Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
