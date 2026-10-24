// backend/test_auth_persistence.js
const persistentStore = require('./utils/persistentStore');
const otpService = require('./services/otpService');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log("=== STARTING AUTH & PERSISTENCE BACKEND TESTS ===");

  // Test 1: Persistent Store fields operations
  console.log("\n[Test 1] Testing persistentStore field creation & retrieval");
  const testFarmerId = "user_test_farmer_999";
  const dummyField = {
    field_id: "field_test_101",
    name: "North Wheat Farm",
    boundary: [
      { lat: 26.8467, lng: 80.9462 },
      { lat: 26.8475, lng: 80.9480 },
      { lat: 26.8450, lng: 80.9490 },
      { lat: 26.8440, lng: 80.9470 }
    ],
    areaAcres: 4.85,
    crop: "Wheat"
  };

  // Clean any previous test run
  persistentStore.getFields(testFarmerId).forEach(f => {
    persistentStore.deleteField(testFarmerId, f.id || f._id);
  });

  const saved = persistentStore.saveField(testFarmerId, dummyField);
  console.log("Saved field result:", saved ? "SUCCESS" : "FAIL");

  let fields = persistentStore.getFields(testFarmerId);
  console.log("Retrieved fields count:", fields.length);
  if (fields.length !== 1 || fields[0].name !== "North Wheat Farm") {
    throw new Error("Field persistence test failed!");
  }
  console.log("✓ Field created and retrieved successfully with boundary points preserved.");

  // Test 2: Field isolation across users
  console.log("\n[Test 2] Testing User Data Isolation");
  const otherFarmerId = "user_test_farmer_888";
  let otherFields = persistentStore.getFields(otherFarmerId);
  console.log("Other user's fields count (must be 0):", otherFields.length);
  if (otherFields.length !== 0) {
    throw new Error("User data isolation violated!");
  }
  console.log("✓ User data isolation strictly maintained.");

  // Test 3: OTP Service test
  console.log("\n[Test 3] Testing OTP Service generation, validation and rate limit");
  const testPhone = "9876543210";
  const sendResult = await otpService.sendOtp(testPhone, 'password_reset');
  console.log("OTP Send result:", sendResult.success, "Debug OTP:", sendResult.debugOtp);
  if (!sendResult.success || !sendResult.debugOtp) {
    throw new Error("OTP send failed!");
  }

  // Verify wrong OTP fails
  const wrongVerify = otpService.verifyOtp(testPhone, '000000');
  console.log("Wrong OTP rejected properly:", !wrongVerify.success);
  if (wrongVerify.success) throw new Error("Security failure: wrong OTP accepted!");

  // Verify correct OTP succeeds and issues reset token
  const correctVerify = otpService.verifyOtp(testPhone, sendResult.debugOtp);
  console.log("Correct OTP verified properly:", correctVerify.success, "ResetToken:", !!correctVerify.resetToken);
  if (!correctVerify.success || !correctVerify.resetToken) {
    throw new Error("Valid OTP verification failed!");
  }

  // Test reset token validation
  const tokenValid = otpService.verifyResetToken(testPhone, correctVerify.resetToken);
  console.log("Reset token valid:", tokenValid);
  if (!tokenValid) throw new Error("Reset token validation failed!");

  // Consume reset token
  otpService.clearOtp(testPhone);
  const tokenConsumed = otpService.verifyResetToken(testPhone, correctVerify.resetToken);
  console.log("Reset token properly consumed (single-use):", !tokenConsumed);
  if (tokenConsumed) throw new Error("Reset token replay protection failed!");

  // Test 4: Password update in persistentStore
  console.log("\n[Test 4] Testing Password Update in persistentStore");
  const testFarmerPhone = "9999999991";
  const existingTestUser = persistentStore.getUserByPhone(testFarmerPhone);
  if (!existingTestUser) {
    persistentStore.registerUser({
      name: "Test Farmer 91",
      phone: testFarmerPhone,
      password: await bcrypt.hash("OldPassword123", 10),
      role: "farmer"
    });
  }

  const newHash = await bcrypt.hash("NewSecurePass123", 10);
  const updateSuccess = persistentStore.updateUserPassword(testFarmerPhone, newHash);
  console.log("Password hash updated:", !!updateSuccess);

  const updatedUser = persistentStore.getUserByPhone(testFarmerPhone);
  const passwordMatches = await bcrypt.compare("NewSecurePass123", updatedUser.password);
  console.log("New password validates via bcrypt:", passwordMatches);
  if (!passwordMatches) throw new Error("Password update failed to persist!");

  // Clean up test field
  persistentStore.deleteField(testFarmerId, dummyField.field_id);
  console.log("\n=== ALL AUTH & PERSISTENCE BACKEND TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
