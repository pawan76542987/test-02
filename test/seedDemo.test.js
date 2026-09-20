const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');

async function testDemoAuth() {
  console.log('🧪 Testing Production-Safe Demo Account Authentication...');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_asset_management';
  await mongoose.connect(uri);

  const demoAccounts = [
    { email: 'admin@labtrack.edu', password: 'Admin@12345', role: 'admin' },
    { email: 'incharge.cs@labtrack.edu', password: 'Lab@12345', role: 'lab_incharge' },
    { email: 'incharge.ece@labtrack.edu', password: 'Lab@12345', role: 'lab_incharge' },
    { email: 'student.rahul@labtrack.edu', password: 'User@12345', role: 'student' },
    { email: 'student.ananya@labtrack.edu', password: 'User@12345', role: 'student' },
    { email: 'staff.priya@labtrack.edu', password: 'User@12345', role: 'staff' }
  ];

  let passed = 0;
  let failed = 0;

  for (const acc of demoAccounts) {
    try {
      const user = await User.findOne({ email: acc.email });
      assert(user, `User ${acc.email} should exist in database`);
      assert.strictEqual(user.role, acc.role, `User ${acc.email} role should be ${acc.role}`);
      assert.strictEqual(user.isActive, true, `User ${acc.email} should be active`);

      const isValidPassword = await user.comparePassword(acc.password);
      assert.strictEqual(isValidPassword, true, `Password for ${acc.email} must match '${acc.password}'`);

      const isWrongPassword = await user.comparePassword('IncorrectPass!99');
      assert.strictEqual(isWrongPassword, false, `Wrong password for ${acc.email} must be rejected`);

      console.log(`  ✅ PASSED: Verified demo user [${acc.role}] ${acc.email}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${acc.email} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Demo Auth Test Results: ${passed} Passed, ${failed} Failed\n`);
  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testDemoAuth().catch(err => {
  console.error('Fatal Demo Test Error:', err);
  process.exit(1);
});
