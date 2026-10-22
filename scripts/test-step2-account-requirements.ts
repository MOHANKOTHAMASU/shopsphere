/**
 * scripts/test-step2-account-requirements.ts
 *
 * Dedicated Test Suite for Step 2: Account Requirements Verification
 *
 * Test Scenarios:
 *  1. Verified account logs in successfully.
 *  2. Unverified account is handled according to the configured policy.
 *  3. Restricted account is denied access where applicable.
 *  4. A user cannot bypass the requirements by directly opening a protected URL.
 *  5. A user cannot bypass the requirements by calling a protected API directly.
 *  6. Resending verification works if implemented.
 */

import {
  signInAction,
  signOutAction,
  resendVerificationEmailAction,
  verifyAccountEmailTokenAction,
  setDemoUserSession,
  clearDemoUserSession,
} from '../src/lib/auth/actions';
import {
  assertAuthenticatedUser,
  assertVerifiedUser,
  assertAdmin,
} from '../src/lib/auth/admin-guard';
import { createOrderAction, getCustomerOrdersAction } from '../src/lib/orders/actions';
import { saveAddressAction } from '../src/lib/addresses/actions';
import { memoryCustomers, memoryCredentials } from '../src/lib/admin/store';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    failedChecks++;
    console.error(`  ✖ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

async function runStep2AccountRequirementsTests() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE STEP 2: ACCOUNT REQUIREMENTS VERIFICATION AUDIT');
  console.log('=============================================================\n');

  // Clean initial session
  await clearDemoUserSession();

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Verified Account Logs In Successfully
  // ---------------------------------------------------------------------------
  console.log('--- SCENARIO 1: Verified Account Logs In Successfully ---');

  const verifiedFormData = new FormData();
  verifiedFormData.set('email', 'customer@shopsphere.dev');
  verifiedFormData.set('password', 'Customer@123');
  verifiedFormData.set('redirect', '/account');

  const verifiedLoginRes = await signInAction(verifiedFormData);
  assert(
    verifiedLoginRes.success === true,
    'Verified account logs in successfully with valid credentials',
    `Message: ${verifiedLoginRes.message}`
  );
  assert(
    verifiedLoginRes.redirectTo === '/account',
    'Verified account receives valid redirection to requested authorized destination',
    `RedirectTo: ${verifiedLoginRes.redirectTo}`
  );

  await clearDemoUserSession();

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Unverified Account Handled According to Configured Policy
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Unverified Account Handled According to Policy ---');

  // vikram.j@example.com is configured in store with isVerified: false
  const unverifiedCustomer = memoryCustomers.find((c) => c.email === 'vikram.j@example.com');
  assert(
    unverifiedCustomer !== undefined && unverifiedCustomer.isVerified === false,
    'Database/Store identifies unverified customer record (isVerified: false)'
  );

  const unverifiedFormData = new FormData();
  unverifiedFormData.set('email', 'vikram.j@example.com');
  unverifiedFormData.set('password', 'Customer@123');
  unverifiedFormData.set('redirect', '/account');

  const unverifiedLoginRes = await signInAction(unverifiedFormData);
  assert(
    unverifiedLoginRes.success === false,
    'Unverified customer login is strictly blocked',
    `Success: ${unverifiedLoginRes.success}`
  );
  assert(
    unverifiedLoginRes.message === 'Please verify your email address before continuing.',
    'Displays required exact verification message: "Please verify your email address before continuing."',
    `Actual: "${unverifiedLoginRes.message}"`
  );

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Restricted / Suspended Account Denied Access
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Restricted / Suspended Account Denied Access ---');

  // ananya.suspended@example.com is configured with status: 'suspended'
  const suspendedCustomer = memoryCustomers.find((c) => c.email === 'ananya.suspended@example.com');
  assert(
    suspendedCustomer !== undefined && suspendedCustomer.status === 'suspended',
    'Database/Store identifies restricted account record (status: "suspended")'
  );

  const suspendedFormData = new FormData();
  suspendedFormData.set('email', 'ananya.suspended@example.com');
  suspendedFormData.set('password', 'Suspended@123');
  suspendedFormData.set('redirect', '/account');

  const suspendedLoginRes = await signInAction(suspendedFormData);
  assert(
    suspendedLoginRes.success === false,
    'Restricted / suspended account login is strictly blocked',
    `Success: ${suspendedLoginRes.success}`
  );
  assert(
    typeof suspendedLoginRes.message === 'string' &&
      suspendedLoginRes.message.toLowerCase().includes('suspended'),
    'Displays clear suspension message directing customer to support',
    `Actual: "${suspendedLoginRes.message}"`
  );

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Cannot Bypass Requirements by Directly Opening Protected URL
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Direct URL Access Enforcement (Middleware) ---');

  // 4a: Unauthenticated visitor accessing /account directly
  const unauthReq = new NextRequest('http://localhost:3000/account');
  const unauthRes = await middleware(unauthReq);
  const unauthLocation = unauthRes.headers.get('location') || '';
  assert(
    unauthRes.status === 307 || unauthRes.status === 302,
    'Direct URL visit to /account without valid session triggers redirection',
    `Status: ${unauthRes.status}`
  );
  assert(
    unauthLocation.includes('/auth/login') && unauthLocation.includes('redirect=%2Faccount'),
    'Redirects unauthenticated visitor to /auth/login with return destination',
    `Location: ${unauthLocation}`
  );

  // 4b: Suspended session attempting to open protected URL directly
  const suspendedReq = new NextRequest('http://localhost:3000/account', {
    headers: {
      cookie: `shopsphere_demo_session=${JSON.stringify({
        id: 'usr-customer-04',
        email: 'ananya.suspended@example.com',
        full_name: 'Ananya Verma',
        role: 'customer',
        status: 'suspended',
      })}`,
    },
  });
  const suspendedUrlRes = await middleware(suspendedReq);
  const suspendedLocation = suspendedUrlRes.headers.get('location') || '';
  assert(
    suspendedLocation.includes('/auth/login') && suspendedLocation.includes('error=account-suspended'),
    'Suspended session opening protected URL directly is intercepted and redirected with account-suspended error',
    `Location: ${suspendedLocation}`
  );

  // 4c: Ordinary customer trying to open /admin/dashboard directly
  const customerAdminReq = new NextRequest('http://localhost:3000/admin/dashboard', {
    headers: {
      cookie: `shopsphere_demo_session=${JSON.stringify({
        id: 'usr-customer-01',
        email: 'rahul.sharma@example.com',
        full_name: 'Rahul Sharma',
        role: 'customer',
        status: 'active',
      })}`,
    },
  });
  const customerAdminRes = await middleware(customerAdminReq);
  const customerAdminLoc = customerAdminRes.headers.get('location') || '';
  assert(
    customerAdminLoc.includes('/admin/login') && customerAdminLoc.includes('error=admin-required'),
    'Customer attempting to open /admin/dashboard directly is intercepted with admin-required error',
    `Location: ${customerAdminLoc}`
  );

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Cannot Bypass Requirements by Calling Protected API Directly
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Backend API & Server Action Guard Enforcement ---');

  // 5a: assertAuthenticatedUser with unverified caller
  await setDemoUserSession({
    id: 'usr-customer-03',
    email: 'vikram.j@example.com',
    full_name: 'Vikram Joshi',
    role: 'customer',
  });

  let unverifiedGuardError = '';
  try {
    await assertVerifiedUser();
  } catch (err: unknown) {
    unverifiedGuardError = (err as Error).message;
  }
  assert(
    unverifiedGuardError === 'Please verify your email address before continuing.',
    'assertVerifiedUser() rejects unverified customer with exact verification requirement message',
    `Actual: "${unverifiedGuardError}"`
  );

  // 5b: Calling createOrderAction directly as unverified customer
  const unverifiedOrderRes = await createOrderAction({
    items: [{ productId: 'prod-001', quantity: 1 }],
    shippingAddress: {
      fullName: 'Vikram Joshi',
      phone: '+91 97654 32109',
      street: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    },
    paymentMethod: 'cod',
  });
  assert(
    unverifiedOrderRes.success === false,
    'createOrderAction() strictly blocks unverified customer from placing orders',
    `Success: ${unverifiedOrderRes.success}`
  );
  assert(
    unverifiedOrderRes.error === 'Please verify your email address before continuing.',
    'createOrderAction() returns verification requirement message to unverified caller',
    `Actual: "${unverifiedOrderRes.error}"`
  );

  // 5c: Calling APIs as suspended account
  await setDemoUserSession({
    id: 'usr-customer-04',
    email: 'ananya.suspended@example.com',
    full_name: 'Ananya Verma',
    role: 'customer',
  });

  let suspendedGuardError = '';
  try {
    await assertAuthenticatedUser();
  } catch (err: unknown) {
    suspendedGuardError = (err as Error).message;
  }
  assert(
    suspendedGuardError.includes('Forbidden') && suspendedGuardError.includes('suspended'),
    'assertAuthenticatedUser() strictly throws Forbidden for suspended account',
    `Actual: "${suspendedGuardError}"`
  );

  const suspendedOrderRes = await createOrderAction({
    items: [{ productId: 'prod-001', quantity: 1 }],
    shippingAddress: {
      fullName: 'Ananya Verma',
      phone: '+91 99887 76655',
      street: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
    },
    paymentMethod: 'cod',
  });
  assert(
    suspendedOrderRes.success === false &&
      typeof suspendedOrderRes.error === 'string' &&
      suspendedOrderRes.error.includes('suspended'),
    'createOrderAction() strictly blocks suspended account from order placement',
    `Error: "${suspendedOrderRes.error}"`
  );

  const suspendedAddressRes = await saveAddressAction({
    fullName: 'Ananya Verma',
    phone: '+91 99887 76655',
    street: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
  });
  assert(
    suspendedAddressRes.success === false &&
      typeof suspendedAddressRes.error === 'string' &&
      suspendedAddressRes.error.includes('suspended'),
    'saveAddressAction() strictly blocks suspended account from modifying addresses',
    `Error: "${suspendedAddressRes.error}"`
  );

  // 5d: Calling admin guard as customer
  let adminGuardError = '';
  try {
    await assertAdmin();
  } catch (err: unknown) {
    adminGuardError = (err as Error).message;
  }
  assert(
    adminGuardError.includes('Forbidden') && adminGuardError.includes('Administrative privileges required'),
    'assertAdmin() strictly blocks customer account from administrative operations',
    `Actual: "${adminGuardError}"`
  );

  await clearDemoUserSession();

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Resending Verification & Token Verification Workflow
  // ---------------------------------------------------------------------------
  console.log('\n--- SCENARIO 6: Resending Verification & Account Activation ---');

  // 6a: Reject invalid email format
  const invalidResend = await resendVerificationEmailAction('invalid-email-no-at');
  assert(
    invalidResend.success === false,
    'resendVerificationEmailAction() rejects invalid email format'
  );

  // 6b: Request resend for unverified customer vikram.j@example.com
  const resendResult = await resendVerificationEmailAction('vikram.j@example.com');
  assert(
    resendResult.success === true,
    'resendVerificationEmailAction() successfully generates verification dispatch for unverified account',
    `Message: ${resendResult.message}`
  );
  assert(
    typeof resendResult.otp === 'string' && resendResult.otp.length === 6,
    'Generates cryptographically valid 6-digit verification token for customer',
    `Token: ${resendResult.otp}`
  );

  const generatedToken = resendResult.otp || '';

  // 6c: Reject wrong verification code
  const wrongTokenRes = await verifyAccountEmailTokenAction('vikram.j@example.com', '000000');
  assert(
    wrongTokenRes.success === false,
    'verifyAccountEmailTokenAction() strictly rejects incorrect verification code',
    `Message: ${wrongTokenRes.message}`
  );

  // 6d: Accept correct verification code and activate account
  const correctTokenRes = await verifyAccountEmailTokenAction('vikram.j@example.com', generatedToken);
  assert(
    correctTokenRes.success === true,
    'verifyAccountEmailTokenAction() verifies account with correct code and updates status',
    `Message: ${correctTokenRes.message}`
  );

  // Verify that database/store now marks user as verified
  const updatedCustomer = memoryCustomers.find((c) => c.email === 'vikram.j@example.com');
  assert(
    updatedCustomer?.isVerified === true,
    'Database/Store customer record is now confirmed verified (isVerified: true)'
  );

  // 6e: User can now log in successfully!
  const nowVerifiedFormData = new FormData();
  nowVerifiedFormData.set('email', 'vikram.j@example.com');
  nowVerifiedFormData.set('password', 'Customer@123');
  nowVerifiedFormData.set('redirect', '/account');

  const nowVerifiedLogin = await signInAction(nowVerifiedFormData);
  assert(
    nowVerifiedLogin.success === true,
    'Newly verified customer can now log in successfully',
    `Message: ${nowVerifiedLogin.message}`
  );
  assert(
    nowVerifiedLogin.redirectTo === '/account',
    'Newly verified customer is redirected to /account',
    `RedirectTo: ${nowVerifiedLogin.redirectTo}`
  );

  // 6f: Resend verification on already verified account informs user
  const alreadyVerifiedResend = await resendVerificationEmailAction('vikram.j@example.com');
  assert(
    alreadyVerifiedResend.success === false &&
      alreadyVerifiedResend.message?.includes('already verified'),
    'resendVerificationEmailAction() informs user when account is already verified'
  );

  // Clean up session
  await clearDemoUserSession();

  console.log('\n=============================================================');
  console.log(`STEP 2 AUDIT COMPLETE: ${passedChecks} PASSED, ${failedChecks} FAILED (TOTAL: ${totalChecks})`);
  console.log('=============================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runStep2AccountRequirementsTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
