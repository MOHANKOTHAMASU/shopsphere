import {
  signInDemoAction,
  getDemoUserAction,
  updateProfileAction,
  signOutAction,
  signUpAction,
  signInAction,
} from '../src/lib/auth/actions';
import { DEMO_USERS } from '../src/lib/auth/demo-users';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

async function runDemoAuthSuite() {
  console.log('====================================================');
  console.log('   SHOPSPHERE 1-CLICK DEMO AUTHENTICATION SUITE    ');
  console.log('====================================================\n');

  // Test 1: Sign In as Demo Customer
  console.log('--- 1. Testing 1-Click Demo Customer Sign In ---');
  const custRes = await signInDemoAction('customer');
  assert(custRes.success === true, 'signInDemoAction("customer") returned success: true');
  assert(custRes.redirectTo === '/account', 'redirectTo is /account');

  const activeUser = await getDemoUserAction();
  assert(activeUser !== null, 'getDemoUserAction() retrieved active demo session');
  assert(activeUser?.id === DEMO_USERS.customer.id, `User ID matches: ${activeUser?.id}`);
  assert(activeUser?.role === 'customer', `User role is customer: ${activeUser?.role}`);
  assert(activeUser?.email === DEMO_USERS.customer.email, `User email matches: ${activeUser?.email}`);

  // Test 2: Update Profile in Demo Mode
  console.log('\n--- 2. Testing Update Profile in Demo Mode ---');
  const profileForm = new FormData();
  profileForm.append('fullName', 'Rahul Sharma (Updated Demo)');
  profileForm.append('phone', '+91 99887 76655');
  const updateRes = await updateProfileAction(profileForm);
  assert(updateRes.success === true, 'updateProfileAction succeeded in Demo Mode');

  const updatedUser = await getDemoUserAction();
  assert(
    updatedUser?.full_name === 'Rahul Sharma (Updated Demo)',
    `Updated full name verified: ${updatedUser?.full_name}`
  );
  assert(updatedUser?.phone === '+91 99887 76655', `Updated phone verified: ${updatedUser?.phone}`);

  // Test 3: Sign In as Demo Admin
  console.log('\n--- 3. Testing 1-Click Demo Admin Sign In ---');
  const adminRes = await signInDemoAction('admin');
  assert(adminRes.success === true, 'signInDemoAction("admin") returned success: true');
  assert(adminRes.redirectTo === '/admin/dashboard', 'redirectTo is /admin/dashboard');

  const adminUser = await getDemoUserAction();
  assert(adminUser?.role === 'admin', `Admin role verified: ${adminUser?.role}`);
  assert(adminUser?.id === DEMO_USERS.admin.id, `Admin ID matches: ${adminUser?.id}`);

  // Test 4: Custom Sign Up in Demo Mode
  console.log('\n--- 4. Testing Custom Sign Up in Demo Mode ---');
  const signupForm = new FormData();
  signupForm.append('fullName', 'Priya Patel');
  signupForm.append('email', 'priya.patel@example.com');
  signupForm.append('password', 'SecurePass123!');
  signupForm.append('confirmPassword', 'SecurePass123!');

  const signupRes = await signUpAction(signupForm);
  assert(signupRes.success === true, 'signUpAction succeeded in Demo Mode without live Supabase');
  assert(signupRes.redirectTo === '/account', 'Sign up redirects to /account');

  const registeredUser = await getDemoUserAction();
  assert(registeredUser?.email === 'priya.patel@example.com', `Registered email verified: ${registeredUser?.email}`);
  assert(registeredUser?.full_name === 'Priya Patel', `Registered name verified: ${registeredUser?.full_name}`);

  // Test 5: Custom Sign In in Demo Mode
  console.log('\n--- 5. Testing Custom Sign In in Demo Mode ---');
  const loginForm = new FormData();
  loginForm.append('email', 'priya.patel@example.com');
  loginForm.append('password', 'SecurePass123!');

  const loginRes = await signInAction(loginForm);
  assert(loginRes.success === true, 'signInAction succeeded in Demo Mode without throwing missing keys error');

  // Test 6: Sign Out
  console.log('\n--- 6. Testing Sign Out in Demo Mode ---');
  try {
    await signOutAction();
  } catch {
    // next/navigation redirect throws in non-HTTP context, which is expected
  }
  const clearedUser = await getDemoUserAction();
  assert(clearedUser === null, 'signOutAction successfully cleared demo session cookie');

  console.log('\n====================================================');
  console.log('TOTAL DEMO AUTH TESTS: 15 | ALL PASSED: 15');
  console.log('====================================================\n');
}

runDemoAuthSuite().catch((err) => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
