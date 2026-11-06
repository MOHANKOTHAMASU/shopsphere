import assert from 'assert';
import { memoryCustomers, memoryVerificationTokens } from '../src/lib/admin/store';
import {
  sendCustomerEmailOtpAction,
  verifyCustomerEmailOtpAction,
} from '../src/lib/auth/email-otp-actions';
import {
  sendEmailVerification,
  verifyEmailOtpToken,
  getPendingVerificationCodeAction,
  instantVerifyEmailAction,
} from '../src/lib/auth/email-service';
import { signUpAction } from '../src/lib/auth/actions';

async function runTests() {
  console.log('================================================================');
  console.log('  SHOPSPHERE: COMPREHENSIVE EMAIL OTP AUTHENTICATION TEST SUITE');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ [FAIL] ${name}:`, (err as Error).message);
    }
  }

  // 1. Unregistered User Login Rejection (shouldCreateUser: false)
  await test('Login strictly rejects unregistered emails (shouldCreateUser: false)', async () => {
    const randomEmail = `unregistered_${Date.now()}@example.com`;
    const res = await sendCustomerEmailOtpAction(randomEmail);
    assert.strictEqual(res.success, false, 'Unregistered user must NOT be allowed to request login OTP');
    assert.strictEqual(res.error, 'UNREGISTERED_USER', 'Must return UNREGISTERED_USER error code');
    assert(res.message.includes('No registered customer account found'), 'Must instruct user to register first');
  });

  // 2. Existing Registered Customer Login OTP Request
  await test('Registered customer can request 6-digit login OTP with 45s cooldown', async () => {
    const res = await sendCustomerEmailOtpAction('customer@shopsphere.dev');
    assert.strictEqual(res.success, true, 'Registered customer must receive success response');
    assert.strictEqual(res.cooldownSeconds, 45, 'Must enforce 45s cooldown');
    assert(res.devOtpPreview, 'Should generate a valid 6-digit code');
    assert.strictEqual(res.devOtpPreview.length, 6, 'OTP must be exactly 6 digits');
  });

  // 3. Login OTP Verification (Correct vs Incorrect)
  await test('Verifying login with correct 6-digit OTP succeeds and logs customer in', async () => {
    const testEmail = 'rahul.sharma@example.com';
    // Generate OTP
    const sendRes = await sendCustomerEmailOtpAction(testEmail);
    assert.strictEqual(sendRes.success, true);
    const validOtp = sendRes.devOtpPreview!;

    // Wrong code test
    const wrongRes = await verifyCustomerEmailOtpAction(testEmail, '999999');
    assert.strictEqual(wrongRes.success, false, 'Wrong OTP must be rejected');

    // Correct code test
    const correctRes = await verifyCustomerEmailOtpAction(testEmail, validOtp);
    assert.strictEqual(correctRes.success, true, 'Correct OTP must authenticate successfully');
  });

  // 4. Rate Limiting Cooldown on Rapid Resend
  await test('Rapid OTP requests trigger rate limiting cooldown protection', async () => {
    const testEmail = 'priya.patel@example.com';
    const firstReq = await sendCustomerEmailOtpAction(testEmail);
    assert.strictEqual(firstReq.success, true);

    const secondReq = await sendCustomerEmailOtpAction(testEmail);
    assert.strictEqual(secondReq.success, false, 'Rapid request within 45s must be blocked');
    assert.strictEqual(secondReq.error, 'RATE_LIMIT_COOLDOWN');
  });

  // 5. New Customer Registration & Verification Flow
  await test('Customer registration dispatches email verification token', async () => {
    const regEmail = `testuser_${Date.now()}@example.com`;
    const fd = new FormData();
    fd.append('fullName', 'Anita Roy');
    fd.append('email', regEmail);
    fd.append('phone', '+91 9123456789');
    fd.append('password', 'SecretPass@123');
    fd.append('confirmPassword', 'SecretPass@123');
    fd.append('street', '100 Feet Ring Road');
    fd.append('city', 'Bengaluru');
    fd.append('state', 'Karnataka');
    fd.append('postalCode', '560078');
    fd.append('country', 'India');
    fd.append('agreedToTerms', 'true');

    const regRes = await signUpAction(fd);
    assert.strictEqual(regRes.success, true, 'Registration must succeed');
    assert(regRes.redirectTo?.includes('/auth/verify-email'), 'Must redirect to verify-email');

    // Token must be stored in memoryVerificationTokens
    const tokenRec = memoryVerificationTokens.get(regEmail);
    assert(tokenRec, 'Verification token must be generated for new customer');
    assert.strictEqual(tokenRec.token.length, 6, 'Token must be 6 digits');

    // Duplicate registration prevention
    const dupRes = await signUpAction(fd);
    assert.strictEqual(dupRes.success, false, 'Duplicate email registration must be rejected');
    assert(dupRes.message?.includes('already exists'), 'Must report duplicate error');
  });

  // 6. Email Verification Portal & Instant 1-Click Activation
  await test('Pending code query and 1-click instant verification activate account', async () => {
    const testEmail = `instant_${Date.now()}@example.com`;
    // Register pending token
    const pendingRes = await getPendingVerificationCodeAction(testEmail);
    assert.strictEqual(pendingRes.success, true);
    assert(pendingRes.code, 'Must return active code');

    // Verify token directly
    const verifyRes = await verifyEmailOtpToken(testEmail, pendingRes.code);
    assert.strictEqual(verifyRes.success, true, 'Email must verify with code');

    // 1-Click instant activate test
    const instantEmail = `activate_${Date.now()}@example.com`;
    const instantRes = await instantVerifyEmailAction(instantEmail);
    assert.strictEqual(instantRes.success, true, 'Instant activation must succeed');
  });

  // 7. Brute-Force Protection (Max 5 Attempts Lockout)
  await test('Brute-force protection invalidates OTP after 5 incorrect attempts', async () => {
    const bruteEmail = `brute_${Date.now()}@example.com`;
    memoryVerificationTokens.set(bruteEmail, {
      token: '445566',
      expiresAt: Date.now() + 600000,
      email: bruteEmail,
      attempts: 0,
    });

    for (let i = 1; i <= 5; i++) {
      const res = await verifyEmailOtpToken(bruteEmail, '000000');
      assert.strictEqual(res.success, false);
    }

    // 6th attempt must trigger MAX_ATTEMPTS_EXCEEDED and delete token
    const sixthRes = await verifyEmailOtpToken(bruteEmail, '000000');
    assert.strictEqual(sixthRes.success, false);
    assert.strictEqual(sixthRes.error, 'MAX_ATTEMPTS_EXCEEDED');
    assert.strictEqual(memoryVerificationTokens.has(bruteEmail), false, 'Token must be invalidated');
  });

  // 8. Admin Role Authorization Separation
  await test('Store owner kmvsubbarao28@gmail.com is not pre-registered as customer, while demo accounts are separated', () => {
    const preRegistered = memoryCustomers.find((c) => c.email === 'kmvsubbarao28@gmail.com');
    assert.strictEqual(preRegistered, undefined, 'Store owner must NOT be pre-registered in customer list');

    const customer = memoryCustomers.find((c) => c.email === 'customer@shopsphere.dev');
    assert(customer, 'Demo customer must exist');
    assert.strictEqual(customer.role, 'customer', 'Demo customer must have customer role');
  });

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

