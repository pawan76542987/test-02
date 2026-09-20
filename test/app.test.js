const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');
const inventoryService = require('../services/inventoryService');
const requestService = require('../services/requestService');
const statsService = require('../services/statsService');

async function runTests() {
  console.log('🧪 Starting Automated LabTrack Verification Suite...');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_asset_management';
  await mongoose.connect(uri);

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

  // 1. Test User Authentication & Password Hashing
  await test('User Password Hashing & Verification', async () => {
    const admin = await User.findOne({ email: 'admin@labtrack.edu' });
    assert(admin, 'Admin user should exist in DB');
    const isCorrect = await admin.comparePassword('Admin@12345');
    assert.strictEqual(isCorrect, true, 'Valid password should verify successfully');
    const isWrong = await admin.comparePassword('WrongPassword');
    assert.strictEqual(isWrong, false, 'Wrong password should fail');
    assert.strictEqual(admin.toJSON().password, undefined, 'toJSON should never expose hashed password');
  });

  // 2. Test Asset Inventory Invariants
  await test('Asset Stock Invariants & Available Stock Calculation', async () => {
    const asset = await Asset.findOne({ assetTag: 'LAB-IOT-001' });
    assert(asset, 'Rigol Oscilloscope asset should exist');
    assert(asset.availableQuantity <= asset.totalQuantity, 'Available quantity cannot exceed total quantity');
    const sum = asset.availableQuantity + asset.issuedQuantity + asset.damagedQuantity + asset.maintenanceQuantity + asset.lostQuantity;
    assert.strictEqual(sum, asset.totalQuantity, 'Sum of all unit states must equal total quantity');
  });

  // 3. Test Atomic Over-Issue Prevention
  await test('Over-Issue Prevention Guard', async () => {
    const asset = await Asset.findOne({ assetTag: 'LAB-IOT-001' });
    const hugeQuantity = asset.availableQuantity + 100;
    let threw = false;
    try {
      await inventoryService.issueAsset(asset._id, hugeQuantity);
    } catch (err) {
      threw = true;
      assert(err.message.includes('stock is only') || err.message.includes('exceeds') || err.message.includes('Cannot issue'), 'Should give clear error message');
    }
    assert.strictEqual(threw, true, 'Over-issuing must throw an exception');
  });

  // 4. Test Dynamic Overdue Detection
  await test('Dynamic Overdue Calculation Virtual', async () => {
    const overdueReq = await IssueRequest.findOne({ requestCode: 'REQ-2026-0004' });
    assert(overdueReq, 'Sample overdue request REQ-2026-0004 must exist');
    assert.strictEqual(overdueReq.status, 'issued', 'Overdue item status must be issued');
    assert.strictEqual(overdueReq.isOverdue, true, 'isOverdue virtual must return true for past return date');
    assert(overdueReq.daysOverdue >= 3, 'daysOverdue should be at least 3');
  });

  // 5. Test State Machine Transition Enforcement
  await test('Invalid State Transition Prevention', async () => {
    const rejectedReq = await IssueRequest.findOne({ requestCode: 'REQ-2026-0007' });
    assert(rejectedReq, 'Rejected request should exist');
    let threw = false;
    try {
      const admin = await User.findOne({ role: 'admin' });
      await requestService.approveRequest(rejectedReq._id, admin._id);
    } catch (err) {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Approving a rejected request must be rejected by service');
  });

  // 6. Test Admin Statistics Aggregation
  await test('Admin Dashboard MongoDB Aggregation Pipeline', async () => {
    const stats = await statsService.getAdminStats();
    assert(stats.totalAssets > 0, 'Total assets must be > 0');
    assert(stats.totalUnits > 0, 'Total units must be > 0');
    assert(stats.categoryStats.length > 0, 'Category stats must contain aggregation items');
    assert(stats.labStats.length > 0, 'Lab stats must contain aggregation items');
    assert(stats.overdueCount > 0, 'Overdue count must accurately match overdue request items');
  });

  console.log('=======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  await mongoose.disconnect();
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
