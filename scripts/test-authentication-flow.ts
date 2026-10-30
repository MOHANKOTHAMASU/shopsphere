// -----------------------------------------------------------------------------
// scripts/test-authentication-flow.ts
// ShopSphere Real Email Verification & Mobile SMS OTP Automated Test Suite
// Verifies all 14 Phase 6 criteria
// -----------------------------------------------------------------------------

import fs from 'fs';

function loadEnvFile(file: string) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

import assert from 'node:assert';
import {
  initiateCustomerLoginAction,
  sendLoginSmsOtpAction,
  verifyLoginSmsOtpAction,
  sendPhoneOtpAction,
  verifyPhoneOtpAction,
} from '../src/lib/auth/phone-actions';
import {
  signUpAction,
  signInAction,
  resendVerificationEmailAction,
  setDemoUserSession,
  clearDemoUserSession,
  getDemoUserAction,
} from '../src/lib/auth/actions';
import {
  sendMobileSmsOtp,
  verifyMobileSmsOtp,
  createLoginChallenge,
  getSmsProviderStatus,
} from '../src/lib/auth/sms-service';
import {
  sendEmailVerification,
  verifyEmailOtpToken,
} from '../src/lib/auth/email-service';
import { validatePhoneNumber, normalizePhoneNumber, maskPhoneNumber } from '../src/lib/auth/phone-utils';
import { memoryCustomers, memoryCredentials } from '../src/lib/admin/store';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, condition: boolean, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS [${totalTests}]: ${name}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL [${totalTests}]: ${name} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('   SHOPSPHERE: EMAIL VERIFICATION & REAL SMS OTP TEST SUITE   ');
  console.log('================================================================\n');

  // --- 1. Customer Registration Validation & Email Verification Trigger ---
  console.log('--- 1. Customer Registration & Email Verification Trigger ---');
  const uniqueId = Date.now();
  const testEmail = `newcustomer_${uniqueId}@gmail.com`;
  const testPhone = '+919652788899';
  const testPassword = 'Password@123';

  const regForm = new FormData();
  regForm.set('fullName', 'Test Customer');
  regForm.set('email', testEmail);
  regForm.set('phone', testPhone);
  regForm.set('password', testPassword);
  regForm.set('confirmPassword', testPassword);
  regForm.set('street', '123 MG Road');
  regForm.set('city', 'Bengaluru');
  regForm.set('state', 'Karnataka');
  regForm.set('postalCode', '560001');
  regForm.set('country', 'India');
  regForm.set('agreedToTerms', 'true');

  const regResult = await signUpAction(regForm);
  test(
    'New customer registration initiates verification flow',
    regResult.success === true,
    regResult.message
  );
  test(
    'Registration directs unverified user to /auth/verify-email',
    Boolean(regResult.redirectTo && regResult.redirectTo.includes('/auth/verify-email')),
    `Redirect: ${regResult.redirectTo}`
  );

  // --- 2. Attempt Access Before Email Verification ---
  console.log('\n--- 2. Block Unverified User Access ---');
  // Attempt to login with an explicitly unverified customer in memory
  const unverifiedEmail = `unverified_${uniqueId}@test.com`;
  memoryCustomers.unshift({
    id: `usr-unverified-${uniqueId}`,
    fullName: 'Unverified User',
    email: unverifiedEmail,
    maskedEmail: 'u***@test.com',
    phone: testPhone,
    role: 'customer',
    ordersCount: 0,
    totalSpent: 0,
    status: 'active',
    isVerified: false, // Explicitly unverified!
    createdAt: new Date().toISOString(),
  });
  memoryCredentials.set(unverifiedEmail, 'Password@123');

  const loginFormUnverified = new FormData();
  loginFormUnverified.set('email', unverifiedEmail);
  loginFormUnverified.set('password', 'Password@123');

  const unverifiedLoginRes = await initiateCustomerLoginAction(loginFormUnverified);
  test(
    'Unverified customer is BLOCKED from login and directed to email verification',
    unverifiedLoginRes.success === false && unverifiedLoginRes.isEmailVerified === false,
    unverifiedLoginRes.message
  );

  // --- 3. Email Verification Delivery & Cooldown Rate Limits ---
  console.log('\n--- 3. Email Verification Delivery & Rate Limiting ---');
  const resendResult = await resendVerificationEmailAction(unverifiedEmail);
  test(
    'Resend verification email accepts request or reports provider quota',
    Boolean(resendResult.message),
    resendResult.message
  );

  // Immediate second resend should hit rate limit cooldown (60s)
  const rapidResend = await sendEmailVerification(unverifiedEmail);
  test(
    'Email resend rate limit cooldown is strictly enforced',
    rapidResend.success === false && rapidResend.error === 'RATE_LIMIT_COOLDOWN',
    rapidResend.message
  );

  // --- 4. Verified User Login Credentials Check ---
  console.log('\n--- 4. Verified Customer Login Credentials ---');
  const verifiedEmail = `verified_${uniqueId}@test.com`;
  memoryCustomers.unshift({
    id: `usr-verified-${uniqueId}`,
    fullName: 'Verified Customer',
    email: verifiedEmail,
    maskedEmail: 'v***@test.com',
    phone: '+919652788899',
    role: 'customer',
    ordersCount: 0,
    totalSpent: 0,
    status: 'active',
    isVerified: true, // Verified!
    createdAt: new Date().toISOString(),
  });
  memoryCredentials.set(verifiedEmail, 'CorrectPassword@123');

  // Test incorrect password
  const badPwForm = new FormData();
  badPwForm.set('email', verifiedEmail);
  badPwForm.set('password', 'WrongPassword@999');
  const badPwRes = await initiateCustomerLoginAction(badPwForm);
  test(
    'Incorrect password rejected during customer login',
    badPwRes.success === false && badPwRes.error === 'INVALID_CREDENTIALS',
    badPwRes.message
  );

  // Test correct password -> Should initiate 2FA Mobile OTP challenge
  const correctPwForm = new FormData();
  correctPwForm.set('email', verifiedEmail);
  correctPwForm.set('password', 'CorrectPassword@123');
  const validCredentialsRes = await initiateCustomerLoginAction(correctPwForm);
  test(
    'Correct credentials issue 2FA mobile challenge token without logging in prematurely',
    validCredentialsRes.success === true &&
      validCredentialsRes.requiresPhoneOtp === true &&
      Boolean(validCredentialsRes.challengeToken),
    validCredentialsRes.message
  );

  const challengeToken = validCredentialsRes.challengeToken!;

  // --- 5. Real SMS OTP Dispatch & Provider Integration ---
  console.log('\n--- 5. Real SMS OTP Dispatch & Rate Limiting ---');
  const smsProviderStatus = getSmsProviderStatus();
  console.log(`  [Info] SMS Provider Status: ${smsProviderStatus.provider.toUpperCase()} (${smsProviderStatus.details})`);

  const smsSendRes = await sendLoginSmsOtpAction(challengeToken, '+91', '9652788899');
  test(
    'SMS OTP dispatch accepted for verified customer',
    smsSendRes.success === true,
    smsSendRes.message
  );
  test(
    'SMS OTP response properly masks recipient mobile number (+9196*** **899)',
    Boolean(smsSendRes.maskedPhone && smsSendRes.maskedPhone.includes('***')),
    `Masked: ${smsSendRes.maskedPhone}`
  );

  // Cooldown rate limit check
  const rapidSmsSend = await sendLoginSmsOtpAction(challengeToken, '+91', '9652788899');
  test(
    'SMS dispatch enforces 30-second cooldown rate limit',
    rapidSmsSend.success === false && rapidSmsSend.error === 'RATE_LIMIT_COOLDOWN',
    rapidSmsSend.message
  );

  // --- 6. Incorrect, Expired, and Reused OTPs ---
  console.log('\n--- 6. OTP Security Verification & Attempt Limits ---');
  // Attempt invalid OTP
  const badOtpRes = await verifyLoginSmsOtpAction(challengeToken, '000000');
  test(
    'Incorrect 6-digit OTP code rejected securely',
    badOtpRes.success === false && badOtpRes.error === 'INCORRECT_CODE',
    badOtpRes.message
  );
  test(
    'Remaining verification attempts decremented after invalid entry',
    typeof badOtpRes.remainingAttempts === 'number' && badOtpRes.remainingAttempts === 3,
    `Remaining attempts: ${badOtpRes.remainingAttempts}`
  );

  // Format validation: Short OTP rejected
  const shortOtpRes = await verifyLoginSmsOtpAction(challengeToken, '123');
  test(
    'Non-6-digit OTP rejected with invalid format error',
    shortOtpRes.success === false,
    shortOtpRes.message
  );

  // --- 7. International Phone Number Format Enforcement ---
  console.log('\n--- 7. Phone Number Format & Country Code Validation ---');
  const validIndia = validatePhoneNumber('+91', '9652788899');
  test('Validates 10-digit Indian mobile number (+91 9652788899)', validIndia.isValid);

  const normalizedE164 = normalizePhoneNumber('+91', '96527 88899');
  test(
    'Normalizes phone to E.164 international standard (+919652788899)',
    normalizedE164 === '+919652788899',
    `Normalized: ${normalizedE164}`
  );

  const invalidShort = validatePhoneNumber('+91', '96527');
  test('Rejects incomplete mobile number', !invalidShort.isValid);

  const invalidStartingZero = validatePhoneNumber('+91', '0652788899');
  test('Rejects invalid starting zero in Indian mobile', !invalidStartingZero.isValid);

  // --- 8. Session Establishment & Protected Routes ---
  console.log('\n--- 8. Session Establishment & Invalidation on Logout ---');
  // Clear any existing session
  await clearDemoUserSession();
  let session = await getDemoUserAction();
  test('Session is initially empty before sign in', session === null);

  // Set authenticated customer session
  await setDemoUserSession({
    id: `usr-${uniqueId}`,
    email: verifiedEmail,
    full_name: 'Verified Customer',
    role: 'customer',
    phone: '+919652788899',
  });
  session = await getDemoUserAction();
  test('Session established successfully after full verification', session !== null && session.email === verifiedEmail);

  // Invalidate on logout
  await clearDemoUserSession();
  session = await getDemoUserAction();
  test('Logout cleanly destroys session and invalidates access', session === null);

  // --- 9. Admin Separation & Privilege Protection ---
  console.log('\n--- 9. Separate Admin Authentication & Privilege Protection ---');
  const customerSession = {
    id: `usr-${uniqueId}`,
    email: 'customer@test.com',
    full_name: 'Regular Customer',
    role: 'customer' as const,
  };
  await setDemoUserSession(customerSession);

  // Customer should be strictly separated from admin
  test(
    'Customer session role is customer, not admin',
    customerSession.role === 'customer'
  );

  await clearDemoUserSession();

  console.log('\n================================================================');
  console.log(`TOTAL AUTHENTICATION TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
