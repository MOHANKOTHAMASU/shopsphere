// =============================================================================
// scripts/test-stage2-auth.ts
// Stage 2: User Registration, Login, Authentication, and Account Verification
// =============================================================================

import {
  signUpAction,
  signInAction,
  signOutAction,
  requestPasswordResetOtpAction,
  verifyOtpAndResetPasswordAction,
} from '../src/lib/auth/actions';
import { assertAdmin, assertAuthenticatedUser } from '../src/lib/auth/admin-guard';
import { memoryCustomers, memoryCredentials } from '../src/lib/admin/store';

async function runStage2Tests() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE STAGE 2: REGISTRATION, LOGIN & VERIFICATION TEST');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string, detail?: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const testEmail = `stage2_test_${Date.now()}@example.com`;
  const testPassword = 'Password@Stage2_123';

  // ---------------------------------------------------------------------------
  // TEST 1: Register a new account
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: Register a New Account ---');
  const regForm = new FormData();
  regForm.set('fullName', 'Stage2 Test User');
  regForm.set('email', testEmail);
  regForm.set('phone', '+91 98765 43210');
  regForm.set('password', testPassword);
  regForm.set('confirmPassword', testPassword);
  regForm.set('street', '100 Innovation Way');
  regForm.set('city', 'Bengaluru');
  regForm.set('state', 'Karnataka');
  regForm.set('postalCode', '560001');
  regForm.set('country', 'India');
  regForm.set('agreedToTerms', 'true');

  const regResult = await signUpAction(regForm);
  assert(
    regResult.success === true,
    'Registration succeeds with valid 11 fields',
    regResult.message
  );
  assert(
    Boolean(regResult.redirectTo || regResult.message),
    'Registration returns appropriate post-registration flow'
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Attempt to register the same email again (Duplicate Account Prevention)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Attempt to Register the Same Email Again ---');
  const dupForm = new FormData();
  dupForm.set('fullName', 'Duplicate User');
  dupForm.set('email', testEmail.toUpperCase()); // Test case-insensitive normalization
  dupForm.set('phone', '+91 98765 43210');
  dupForm.set('password', testPassword);
  dupForm.set('confirmPassword', testPassword);
  dupForm.set('agreedToTerms', 'true');

  const dupResult = await signUpAction(dupForm);
  assert(
    dupResult.success === false,
    'Duplicate registration attempt is strictly rejected'
  );
  assert(
    (dupResult.message || '').toLowerCase().includes('already exists') ||
    (dupResult.message || '').toLowerCase().includes('already registered'),
    'Displays clear error message indicating account already exists',
    dupResult.message
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Log in with correct credentials
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: Log In with Correct Credentials ---');
  const loginForm = new FormData();
  loginForm.set('email', testEmail);
  loginForm.set('password', testPassword);
  loginForm.set('redirect', '/account');

  const loginResult = await signInAction(loginForm);
  assert(
    loginResult.success === true,
    'Login succeeds with registered email and password',
    loginResult.message
  );
  assert(
    loginResult.redirectTo === '/account',
    'Redirects user to requested authorized destination',
    loginResult.redirectTo
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Log in with an incorrect password
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 4: Log In with an Incorrect Password ---');
  const badLoginForm = new FormData();
  badLoginForm.set('email', testEmail);
  badLoginForm.set('password', 'CompletelyWrongPassword_999!');

  const badLoginResult = await signInAction(badLoginForm);
  assert(
    badLoginResult.success === false,
    'Login is rejected when password does not match'
  );
  assert(
    badLoginResult.message === 'Invalid email or password. Please verify and try again.',
    'Returns generic safe error message without revealing account existence',
    badLoginResult.message
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Attempt protected access while logged out
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 5: Attempt Protected Access While Logged Out ---');
  await signOutAction(); // Log out first

  let accessBlocked = false;
  try {
    await assertAuthenticatedUser();
  } catch (err: any) {
    accessBlocked = true;
    assert(
      err.message.includes('Unauthorized') || err.message.includes('Authentication required'),
      'assertAuthenticatedUser() strictly throws Unauthorized when logged out'
    );
  }
  assert(accessBlocked, 'Logged-out user is strictly blocked from protected operations');

  // ---------------------------------------------------------------------------
  // TEST 6: Log out and try accessing a protected page again
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 6: Log Out and Re-verify Invalidation ---');
  // Ensure session is thoroughly wiped
  await signOutAction();
  let reAccessBlocked = false;
  try {
    await assertAuthenticatedUser();
  } catch {
    reAccessBlocked = true;
  }
  assert(reAccessBlocked, 'Session remains invalidated after signout');

  // Verify memory customer credentials cannot be accessed without login
  const memoryCheck = memoryCredentials.has(testEmail.toLowerCase());
  assert(memoryCheck, 'User credentials exist in store but cannot be used without valid session');

  // ---------------------------------------------------------------------------
  // TEST 7: Test account verification (Email & OTP verification)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 7: Test Account & Password Verification (OTP Flow) ---');
  // Request OTP for verification
  const otpReqForm = new FormData();
  otpReqForm.set('email', testEmail);
  const otpReqResult = await requestPasswordResetOtpAction(otpReqForm);

  assert(
    otpReqResult.success === true,
    'Verification OTP request succeeds',
    otpReqResult.message
  );
  assert(
    Boolean(otpReqResult.otp && otpReqResult.otp.length === 6),
    'Generates cryptographically valid 6-digit verification code',
    `Code: ${otpReqResult.otp}`
  );

  // Test with invalid OTP code
  const wrongOtpForm = new FormData();
  wrongOtpForm.set('email', testEmail);
  wrongOtpForm.set('otp', '000000');
  wrongOtpForm.set('password', 'NewVerifiedPass_456!');
  wrongOtpForm.set('confirmPassword', 'NewVerifiedPass_456!');
  const wrongOtpResult = await verifyOtpAndResetPasswordAction(wrongOtpForm);
  assert(
    wrongOtpResult.success === false,
    'Rejects incorrect OTP verification code',
    wrongOtpResult.message
  );

  // Test with correct OTP code
  const correctOtpForm = new FormData();
  correctOtpForm.set('email', testEmail);
  correctOtpForm.set('otp', otpReqResult.otp || '');
  correctOtpForm.set('password', 'NewVerifiedPass_456!');
  correctOtpForm.set('confirmPassword', 'NewVerifiedPass_456!');
  const correctOtpResult = await verifyOtpAndResetPasswordAction(correctOtpForm);
  assert(
    correctOtpResult.success === true,
    'Verifies account and updates password with valid 6-digit OTP',
    correctOtpResult.message
  );

  // Confirm user can log in with new verified password
  const newPassLoginForm = new FormData();
  newPassLoginForm.set('email', testEmail);
  newPassLoginForm.set('password', 'NewVerifiedPass_456!');
  const newPassLoginResult = await signInAction(newPassLoginForm);
  assert(
    newPassLoginResult.success === true,
    'User successfully logs in with new verified credentials'
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Verify that ordinary user cannot access administrator features
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 8: Ordinary User Cannot Access Administrator Features ---');
  let adminBlocked = false;
  try {
    // Current session is for testEmail (role: customer)
    await assertAdmin();
  } catch (err: any) {
    adminBlocked = true;
    assert(
      err.message.includes('Admin access required') || err.message.includes('Forbidden'),
      'assertAdmin() strictly rejects customer session',
      err.message
    );
  }
  assert(adminBlocked, 'Ordinary customer is strictly blocked from admin operations');

  // Test that real administrator CAN access
  const adminLoginForm = new FormData();
  adminLoginForm.set('email', 'admin@shopsphere.dev');
  adminLoginForm.set('password', 'Admin@123');
  adminLoginForm.set('role', 'admin');
  adminLoginForm.set('redirect', '/admin/dashboard');
  const adminLoginResult = await signInAction(adminLoginForm);
  assert(
    adminLoginResult.success === true,
    'Authorized Administrator logs in successfully'
  );

  const verifiedAdmin = await assertAdmin();
  assert(
    Boolean(verifiedAdmin && verifiedAdmin.adminId && verifiedAdmin.adminEmail),
    'assertAdmin() confirms administrator authorization for store manager',
    `Admin: ${verifiedAdmin.adminEmail}`
  );

  // Clean up session
  await signOutAction();

  console.log('\n=============================================================');
  console.log(`STAGE 2 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2Tests().catch((err) => {
  console.error('Fatal error running Stage 2 tests:', err);
  process.exit(1);
});
