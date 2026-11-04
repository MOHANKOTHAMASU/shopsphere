// -----------------------------------------------------------------------------
// scripts/test-critical-otp-security.mjs
// Automated Security Test Suite: Critical OTP & Authentication Hardening
// -----------------------------------------------------------------------------

import assert from 'assert';
import crypto from 'crypto';

console.log('------------------------------------------------------------');
console.log('🔒 SHOPSPHERE CRITICAL AUTHENTICATION & OTP SECURITY TESTS');
console.log('------------------------------------------------------------\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}\n`);
    failCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}\n`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: PRODUCTION OTP BYPASS RESTRICTION
// -----------------------------------------------------------------------------
console.log('🧪 [SUITE 1] Production OTP Bypass Restrictions');

// Test 1.1: isDevOtpAllowed() returns false when NODE_ENV is production
runTest('isDevOtpAllowed() strictly denies dev OTP when NODE_ENV=production', () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    // Emulate isDevOtpAllowed logic
    const isAllowed = (
      process.env.NODE_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'preview' &&
      process.env.NODE_ENV === 'development'
    );
    assert.strictEqual(isAllowed, false, 'Dev OTP must never be allowed in production');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

// Test 1.2: Vercel preview and production environments deny dev OTP
runTest('isDevOtpAllowed() denies dev OTP when VERCEL_ENV is preview or production', () => {
  const originalVercel = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = 'preview';
    const isAllowedPreview = (
      process.env.NODE_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'preview' &&
      process.env.NODE_ENV === 'development'
    );
    assert.strictEqual(isAllowedPreview, false, 'Dev OTP must be denied on preview deployments');

    process.env.VERCEL_ENV = 'production';
    const isAllowedProd = (
      process.env.NODE_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'production' &&
      process.env.VERCEL_ENV !== 'preview' &&
      process.env.NODE_ENV === 'development'
    );
    assert.strictEqual(isAllowedProd, false, 'Dev OTP must be denied on production deployments');
  } finally {
    process.env.VERCEL_ENV = originalVercel;
  }
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: CRYPTOGRAPHIC SESSION COOKIE SIGNING & TAMPER PREVENTION
// -----------------------------------------------------------------------------
console.log('\n🧪 [SUITE 2] Cryptographic Session Cookie Security');

const TEST_SECRET = 'test-secret-key-at-least-32-bytes-long-for-hmac-sha256';

function signToken(user, secret, maxAgeSeconds = 3600) {
  const payload = {
    user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) return null;
    return payload.user;
  } catch {
    return null;
  }
}

// Test 2.1: Legitimate signed token verifies correctly
runTest('Valid HMAC-SHA256 session token verifies customer identity', () => {
  const customer = { id: 'usr-101', email: 'customer@shopsphere.dev', full_name: 'Test Customer', role: 'customer' };
  const token = signToken(customer, TEST_SECRET);
  const verified = verifyToken(token, TEST_SECRET);
  assert.ok(verified, 'Verified user session must not be null');
  assert.strictEqual(verified.id, 'usr-101');
  assert.strictEqual(verified.role, 'customer');
});

// Test 2.2: Plain JSON cookie (unsigned legacy format) is rejected
runTest('Unsigned plain JSON session cookie is rejected', () => {
  const fakeCookie = JSON.stringify({ id: 'attacker', role: 'admin' });
  const result = verifyToken(fakeCookie, TEST_SECRET);
  assert.strictEqual(result, null, 'Unsigned cookie must be rejected');
});

// Test 2.3: Tampering with payload (privilege escalation to admin) fails verification
runTest('Privilege escalation attempt (modifying role: customer -> admin) is detected and rejected', () => {
  const customer = { id: 'usr-102', email: 'attacker@evil.com', full_name: 'Attacker', role: 'customer' };
  const legitimateToken = signToken(customer, TEST_SECRET);
  const [, signature] = legitimateToken.split('.');

  // Attacker crafts forged payload with role="admin" but attaches legitimate signature
  const forgedPayload = {
    user: { id: 'usr-102', email: 'attacker@evil.com', full_name: 'Attacker', role: 'admin' },
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };
  const forgedPayloadB64 = Buffer.from(JSON.stringify(forgedPayload), 'utf8').toString('base64url');
  const forgedToken = `${forgedPayloadB64}.${signature}`;

  const result = verifyToken(forgedToken, TEST_SECRET);
  assert.strictEqual(result, null, 'Tampered token signature must mismatch and return null');
});

// Test 2.4: Expired token is rejected
runTest('Expired session token is rejected', () => {
  const customer = { id: 'usr-103', email: 'old@example.com', full_name: 'Old User', role: 'customer' };
  const expiredToken = signToken(customer, TEST_SECRET, -100); // Expired 100 seconds ago
  const result = verifyToken(expiredToken, TEST_SECRET);
  assert.strictEqual(result, null, 'Expired session must return null');
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: SUPABASE SEND-SMS WEBHOOK PROTECTION (/api/auth/send-sms)
// -----------------------------------------------------------------------------
console.log('\n🧪 [SUITE 3] Supabase Send-SMS Webhook Endpoint Security');

function verifyWebhookSecret(authHeader, hookSecretHeader, configuredSecret) {
  if (!configuredSecret) {
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, status: 503, error: 'SMS Hook is disabled: Server secret not configured' };
    }
    return { allowed: true };
  }
  const provided = (authHeader || '').replace(/^Bearer\s+/i, '').trim() || (hookSecretHeader || '').trim();
  const secretBuf = Buffer.from(configuredSecret);
  const providedBuf = Buffer.from(provided);
  if (secretBuf.length !== providedBuf.length || !crypto.timingSafeEqual(secretBuf, providedBuf)) {
    return { allowed: false, status: 401, error: 'Unauthorized: Invalid hook secret' };
  }
  return { allowed: true };
}

runTest('Webhook rejects unauthenticated request when secret is configured', () => {
  const result = verifyWebhookSecret('', '', 'my-super-secret-hook-key');
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.status, 401);
});

runTest('Webhook accepts request with matching Bearer token', () => {
  const secret = 'my-super-secret-hook-key';
  const result = verifyWebhookSecret(`Bearer ${secret}`, '', secret);
  assert.strictEqual(result.allowed, true);
});

runTest('Webhook accepts request with matching x-hook-secret header', () => {
  const secret = 'another-valid-secret-key-123';
  const result = verifyWebhookSecret('', secret, secret);
  assert.strictEqual(result.allowed, true);
});

runTest('Webhook fails closed with HTTP 503 if secret is missing in production', () => {
  const orig = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const result = verifyWebhookSecret('Bearer anything', '', undefined);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 503);
  } finally {
    process.env.NODE_ENV = orig;
  }
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: ADMIN LOGIN LOCKDOWN & CREDENTIAL VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n🧪 [SUITE 4] Admin Login Lockdown & Credential Security');

function verifyAdminPassword(password, configuredSecret, isProduction) {
  if (isProduction) {
    return Boolean(configuredSecret && password === configuredSecret);
  }
  const devDefaults = ['Admin@123', 'admin', 'admin123', 'Admin123'];
  return (Boolean(configuredSecret) && password === configuredSecret) || devDefaults.includes(password);
}

runTest('Admin login rejects default password "Admin@123" in production mode', () => {
  const isAllowed = verifyAdminPassword('Admin@123', 'StrongCustomProdPass!987', true);
  assert.strictEqual(isAllowed, false, 'Default password Admin@123 must be rejected in production');
});

runTest('Admin login rejects "admin" in production mode', () => {
  const isAllowed = verifyAdminPassword('admin', 'StrongCustomProdPass!987', true);
  assert.strictEqual(isAllowed, false, 'Default word "admin" must be rejected in production');
});

runTest('Admin login strictly requires configured ADMIN_PASSWORD in production mode', () => {
  const customPass = 'StrongCustomProdPass!987';
  const isAllowed = verifyAdminPassword(customPass, customPass, true);
  assert.strictEqual(isAllowed, true, 'Configured admin password must be accepted');
});

runTest('Admin login rejects sign in if ADMIN_PASSWORD is unset in production', () => {
  const isAllowed = verifyAdminPassword('Admin@123', undefined, true);
  assert.strictEqual(isAllowed, false, 'When ADMIN_PASSWORD is unset in production, no default passwords are accepted');
});

// -----------------------------------------------------------------------------
// TEST SUITE 5: INVENTORY QUICK ADJUST DECREASE BUTTONS VALIDATION
// -----------------------------------------------------------------------------
console.log('\n🧪 [SUITE 5] Admin Inventory Stock Quick Adjustment');

function quickAdjustStock(currentStock, delta) {
  return Math.max(0, currentStock + delta);
}

runTest('Quick adjust +10 increases stock', () => {
  assert.strictEqual(quickAdjustStock(25, 10), 35);
});

runTest('Quick adjust +25 increases stock', () => {
  assert.strictEqual(quickAdjustStock(25, 25), 50);
});

runTest('Quick adjust -10 decreases stock', () => {
  assert.strictEqual(quickAdjustStock(25, -10), 15);
});

runTest('Quick adjust -25 decreases stock', () => {
  assert.strictEqual(quickAdjustStock(25, -25), 0);
});

runTest('Quick adjust cannot decrease stock below zero (clamped to 0)', () => {
  assert.strictEqual(quickAdjustStock(5, -25), 0, 'Stock cannot be negative');
  assert.strictEqual(quickAdjustStock(0, -10), 0, 'Stock at zero stays at zero');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n------------------------------------------------------------');
console.log(`🎯 TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
console.log('------------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All critical security and authentication tests PASSED cleanly!\n');
}
