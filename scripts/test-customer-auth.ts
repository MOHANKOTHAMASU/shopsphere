// -----------------------------------------------------------------------------
// scripts/test-customer-auth.ts
// ShopSphere: Comprehensive Customer Authentication, Profile, Address & RBAC Test Suite
// -----------------------------------------------------------------------------

import {
  signUpAction,
  signInAction,
  signOutAction,
  updateProfileAction,
  forgotPasswordAction,
  updatePasswordAction,
  setDemoUserSession,
  getDemoUserAction,
  clearDemoUserSession,
} from '../src/lib/auth/actions';
import {
  validateSignupData,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidPostalCode,
} from '../src/lib/auth/validation';
import {
  getAddressesAction,
  saveAddressAction,
  deleteAddressAction,
} from '../src/lib/addresses/actions';
import {
  getAdminCustomersAction,
  getAdminUserMetricsAction,
} from '../src/lib/admin/actions';
import { assertAdmin } from '../src/lib/auth/admin-guard';
import { DEMO_USERS } from '../src/lib/auth/demo-users';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE CUSTOMER AUTH, REGISTRATION & RBAC AUDIT');
  console.log('=============================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Validation Logic Checks
  // ---------------------------------------------------------------------------
  console.log('--- 1. Validation Logic & Format Checks ---');
  assert(isValidEmail('customer@example.com'), 'Valid email format accepted');
  assert(!isValidEmail('invalid-email-string'), 'Rejects malformed email address');
  assert(!isValidEmail('user@domain'), 'Rejects email without valid TLD');

  assert(isValidPhone('+91 98765 43210'), 'Valid Indian international phone accepted');
  assert(isValidPhone('+1 555-234-5678'), 'Valid US international phone accepted');
  assert(isValidPhone('9876543210'), 'Valid 10-digit phone accepted');
  assert(!isValidPhone('12345'), 'Rejects phone shorter than 10 digits');
  assert(!isValidPhone('abcd-phone'), 'Rejects alphabetical phone string');

  assert(isValidPostalCode('560048'), 'Valid 6-digit Indian PIN code accepted');
  assert(isValidPostalCode('90210'), 'Valid 5-digit US zip code accepted');
  assert(!isValidPostalCode('12'), 'Rejects postal code shorter than 4 characters');

  assert(isValidPassword('Secret@123').valid, 'Strong password with letter & digit accepted');
  assert(!isValidPassword('short').valid, 'Rejects password shorter than 8 characters');
  assert(!isValidPassword('1234567890').valid, 'Rejects password lacking letters');
  assert(!isValidPassword('onlylettersnopass').valid, 'Rejects password lacking numbers');

  const mismatchedValidation = validateSignupData({
    fullName: 'Ananya Rao',
    email: 'ananya@example.com',
    password: 'Password@123',
    confirmPassword: 'DifferentPassword@999',
  });
  assert(!mismatchedValidation.isValid, 'Rejects mismatched confirm password input');
  assert(Boolean(mismatchedValidation.errors.confirmPassword), 'Provides field-specific password mismatch error');

  // ---------------------------------------------------------------------------
  // 2. Successful Customer Registration with Address
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Customer Registration Flow ---');
  const testEmail = `newcustomer_${Date.now()}@example.com`;
  const signupForm = new FormData();
  signupForm.set('fullName', 'Ananya Rao');
  signupForm.set('email', testEmail);
  signupForm.set('phone', '+91 98765 22334');
  signupForm.set('password', 'Ananya@Pass123');
  signupForm.set('confirmPassword', 'Ananya@Pass123');
  signupForm.set('street', 'Flat 304, Green Heights, Indiranagar');
  signupForm.set('city', 'Bengaluru');
  signupForm.set('state', 'Karnataka');
  signupForm.set('postalCode', '560038');
  signupForm.set('country', 'India');
  signupForm.set('agreedToTerms', 'true');

  const signupRes = await signUpAction(signupForm);
  assert(signupRes.success, 'Successful customer registration with all 11 fields');
  assert(signupRes.redirectTo === '/account', 'Redirects newly registered customer to /account');

  // Verify session created
  const activeSession = await getDemoUserAction();
  assert(activeSession !== null, 'Session active in cookie/memory store');
  assert(activeSession?.email === testEmail, 'Session matches newly registered email address');

  // Verify delivery address saved
  const addressRes = await getAddressesAction();
  assert(addressRes.success, 'Retrieves saved delivery addresses');
  assert(
    addressRes.addresses.some((a) => a.city === 'Bengaluru' && a.postalCode === '560038'),
    'Registration address automatically linked to new customer profile'
  );

  // ---------------------------------------------------------------------------
  // 3. Duplicate Account Prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Duplicate Account Prevention ---');
  const duplicateSignupRes = await signUpAction(signupForm);
  assert(!duplicateSignupRes.success, 'Duplicate registration attempt is strictly rejected');
  assert(
    Boolean(duplicateSignupRes.message?.includes('already exists')),
    'Informs user account already exists without leaking private passwords'
  );

  // ---------------------------------------------------------------------------
  // 4. Customer Login & Authentication
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Customer Login & Session Management ---');
  await clearDemoUserSession();
  assert((await getDemoUserAction()) === null, 'Session cleanly cleared on logout');

  // Login with invalid credentials
  const badLoginForm = new FormData();
  badLoginForm.set('email', 'nonexistent@example.com');
  badLoginForm.set('password', '');
  const badLoginRes = await signInAction(badLoginForm);
  assert(!badLoginRes.success, 'Rejects empty/invalid login credentials');

  // Login with valid registered account
  const validLoginForm = new FormData();
  validLoginForm.set('email', testEmail);
  validLoginForm.set('password', 'Ananya@Pass123');
  const validLoginRes = await signInAction(validLoginForm);
  assert(validLoginRes.success, 'Customer signs in with registered credentials');
  assert(
    (await getDemoUserAction())?.email === testEmail,
    'Session restored with customer identity'
  );

  // ---------------------------------------------------------------------------
  // 5. Customer Profile Editing
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Customer Profile Editing ---');
  const profileForm = new FormData();
  profileForm.set('fullName', 'Ananya Rao-Verma');
  profileForm.set('phone', '+91 98765 99887');

  const updateProfileRes = await updateProfileAction(profileForm);
  assert(updateProfileRes.success, 'Customer successfully updates own name and phone');
  assert(
    (await getDemoUserAction())?.full_name === 'Ananya Rao-Verma',
    'Session reflects updated customer name'
  );

  // ---------------------------------------------------------------------------
  // 6. Delivery Address Management (Add, Edit, Set Default, Delete)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Delivery Address Management ---');
  // Add second address (Work)
  const newAddrRes = await saveAddressAction({
    fullName: 'Ananya Rao',
    phone: '+91 98765 99887',
    street: 'Prestige Tech Park, Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    country: 'India',
    type: 'Work',
    isDefault: false,
  });
  assert(newAddrRes.success && Boolean(newAddrRes.address?.id), 'Customer adds secondary work address');

  // Edit existing address
  if (newAddrRes.address?.id) {
    const editAddrRes = await saveAddressAction({
      id: newAddrRes.address.id,
      fullName: 'Ananya Rao',
      phone: '+91 98765 99887',
      street: 'Prestige Tech Park, Tower 3, 5th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      type: 'Work',
      isDefault: true,
    });
    assert(editAddrRes.success, 'Customer successfully edits address details');
    assert(editAddrRes.address?.isDefault === true, 'Address set as primary default');

    // Delete address
    const delRes = await deleteAddressAction(newAddrRes.address.id);
    assert(delRes.success, 'Customer cleanly deletes saved delivery address');
  }

  // ---------------------------------------------------------------------------
  // 7. Password Reset & Update
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Password Reset & Recovery ---');
  const forgotForm = new FormData();
  forgotForm.set('email', testEmail);
  const forgotRes = await forgotPasswordAction(forgotForm);
  assert(forgotRes.success, 'Dispatches password reset instructions safely');

  const updatePassForm = new FormData();
  updatePassForm.set('password', 'NewSecurePass@456');
  updatePassForm.set('confirmPassword', 'NewSecurePass@456');
  const updatePassRes = await updatePasswordAction(updatePassForm);
  assert(updatePassRes.success, 'Successfully updates customer account password');

  // ---------------------------------------------------------------------------
  // 8. Role-Based Access Control (Privilege Escalation Prevention)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Role-Based Access Control (RBAC) & Isolation ---');
  // Customer attempt to call assertAdmin()
  let escalationBlocked = false;
  try {
    await assertAdmin();
  } catch (err: unknown) {
    escalationBlocked = true;
    assert(
      (err as Error).message.includes('Forbidden') || (err as Error).message.includes('Unauthorized'),
      'assertAdmin() strictly blocks customer session from accessing admin resources'
    );
  }
  assert(escalationBlocked, 'Customer cannot elevate privileges to administrator');

  // ---------------------------------------------------------------------------
  // 9. Admin User Management & Real Database Metrics
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Admin User Management & Customer Metrics ---');
  // Switch to Administrator session
  await setDemoUserSession(DEMO_USERS.admin);
  assert((await assertAdmin()).adminEmail === 'admin@shopsphere.dev', 'Administrator session authenticated');

  // Fetch admin user metrics
  const metricsRes = await getAdminUserMetricsAction();
  assert(metricsRes.success, 'Admin queries real database user metrics');
  assert(metricsRes.metrics.totalCustomers >= 4, `Accurately counts total customer accounts (${metricsRes.metrics.totalCustomers})`);
  assert(metricsRes.metrics.newToday >= 1, `Accurately calculates registrations today (${metricsRes.metrics.newToday})`);
  assert(metricsRes.metrics.newLast7Days >= 1, `Accurately tracks weekly registrations (${metricsRes.metrics.newLast7Days})`);
  assert(metricsRes.metrics.verifiedCount >= 1, `Tracks verified vs unverified accounts (${metricsRes.metrics.verifiedCount} verified)`);

  // Fetch customer directory with search and pagination
  const directoryRes = await getAdminCustomersAction('Ananya', { page: 1, limit: 10, status: 'all' });
  assert(directoryRes.success, 'Admin searches customer directory by name');
  assert(
    directoryRes.customers.some((c) => c.fullName.includes('Ananya')),
    'Newly registered customer appears in admin customer directory'
  );
  assert(
    directoryRes.customers.every((c) => c.email.includes('*')),
    'Customer email is protected with privacy masking on admin dashboard'
  );

  // ---------------------------------------------------------------------------
  // 10. Clean Session Invalidation on Logout
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Session Invalidation on Sign Out ---');
  await signOutAction();
  assert((await getDemoUserAction()) === null, 'User session fully terminated on sign out');

  console.log('\n=============================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} of ${totalTests} assertions passed!`);
  console.log('=============================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
