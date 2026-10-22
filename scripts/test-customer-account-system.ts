// -----------------------------------------------------------------------------
// scripts/test-customer-account-system.ts
// ShopSphere Customer Account System Comprehensive Automated Verification Suite
// -----------------------------------------------------------------------------

import {
  normalizePhoneNumber,
  maskPhoneNumber,
  validatePhoneNumber,
  DEVELOPMENT_TEST_OTP,
} from '../src/lib/auth/phone-utils';
import {
  sendPhoneOtpAction,
  verifyPhoneOtpAction,
  registerPhoneVerifiedCustomerAction,
} from '../src/lib/auth/phone-actions';
import {
  getRewardsSummaryAction,
  redeemRewardPointsAction,
} from '../src/lib/rewards/actions';
import {
  createSupportTicketAction,
  getCustomerSupportTicketsAction,
} from '../src/lib/support/actions';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  \x1b[32m✔ PASS\x1b[0m: [${name}] - ${details}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: [${name}] - ${details}`);
  }
}

async function runCustomerAccountSystemTests() {
  console.log('\n================================================================');
  console.log('   SHOPSPHERE CUSTOMER ACCOUNT SYSTEM AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Phone Normalization & Masking
  // ---------------------------------------------------------------------------
  console.log('--- 1. Phone Normalization & Masking ---');
  const normalizedIN = normalizePhoneNumber('+91', '9876543210');
  assert(normalizedIN === '+919876543210', 'Phone Normalization (+91)', `Expected +919876543210, got ${normalizedIN}`);

  const masked = maskPhoneNumber(normalizedIN);
  assert(masked.includes('*** **'), 'Phone Masking', `Masked format ${masked} contains proper redaction`);

  // ---------------------------------------------------------------------------
  // 2. Phone Number Validation (India & International)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Phone Number Validation ---');
  const validIN = validatePhoneNumber('+91', '9876543210');
  assert(validIN.isValid === true, 'Valid Indian Number', '10-digit starting with 9 accepted');

  const invalidINShort = validatePhoneNumber('+91', '987654321');
  assert(invalidINShort.isValid === false, 'Invalid Indian Number (short)', invalidINShort.error || '');

  const invalidINLeading = validatePhoneNumber('+91', '4876543210');
  assert(invalidINLeading.isValid === false, 'Invalid Indian Number (bad prefix)', invalidINLeading.error || '');

  const validUS = validatePhoneNumber('+1', '4155552671');
  assert(validUS.isValid === true, 'Valid US Number', '10-digit US number accepted');

  // ---------------------------------------------------------------------------
  // 3. Step 1: Send Phone OTP
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Step 1: Send OTP Flow ---');
  const testPhone = '9811122233';
  const sendRes = await sendPhoneOtpAction('+91', testPhone);
  assert(sendRes.success === true, 'Send OTP Success', `Message: ${sendRes.message}, OTP: ${sendRes.testOtp}`);
  assert(sendRes.isNewUser === true, 'Detects New Customer', 'Phone not previously registered');
  assert(sendRes.testOtp === DEVELOPMENT_TEST_OTP, 'Development Test OTP', `Matches test OTP ${DEVELOPMENT_TEST_OTP}`);

  // ---------------------------------------------------------------------------
  // 4. Rate Limiting on Immediate Resend
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Rate Limiting Protection ---');
  const rateLimitRes = await sendPhoneOtpAction('+91', testPhone);
  assert(rateLimitRes.success === false, 'Resend Cooldown Enforced', rateLimitRes.message);

  // ---------------------------------------------------------------------------
  // 5. Step 2: Negative OTP Verification Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Negative OTP Verification ---');
  const wrongOtpRes = await verifyPhoneOtpAction('+91', testPhone, '000000');
  assert(wrongOtpRes.success === false, 'Rejects Incorrect OTP', wrongOtpRes.message);
  assert((wrongOtpRes.remainingAttempts ?? 0) < 5, 'Decrements Remaining Attempts', `Remaining: ${wrongOtpRes.remainingAttempts}`);

  // ---------------------------------------------------------------------------
  // 6. Step 2: Positive OTP Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Positive OTP Verification ---');
  const verifyRes = await verifyPhoneOtpAction('+91', testPhone, DEVELOPMENT_TEST_OTP);
  assert(verifyRes.success === true, 'Verifies Test OTP', verifyRes.message);
  assert(verifyRes.isNewUser === true, 'Directs New Customer to Registration', 'Flag isNewUser is true');
  assert(verifyRes.redirectTo?.includes('/auth/register') === true, 'Redirect URL to Register', verifyRes.redirectTo || '');

  // ---------------------------------------------------------------------------
  // 7. Step 3: Registration with Phone Lock & Customer Demographics
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. New Customer Registration Flow ---');
  const regFormData = new FormData();
  regFormData.set('fullName', 'Anita Verma');
  regFormData.set('countryCode', '+91');
  regFormData.set('phone', testPhone);
  regFormData.set('email', 'anita.verma@example.com');
  regFormData.set('gender', 'Female');
  regFormData.set('dateOfBirth', '1995-08-15');
  regFormData.set('addressLine1', 'Flat 402, Green Meadows');
  regFormData.set('addressLine2', 'Near Metro Station');
  regFormData.set('landmark', 'Opposite City Mall');
  regFormData.set('city', 'Bengaluru');
  regFormData.set('state', 'Karnataka');
  regFormData.set('postalCode', '560001');
  regFormData.set('country', 'India');

  const regRes = await registerPhoneVerifiedCustomerAction(regFormData);
  assert(regRes.success === true, 'Register Customer with Verified Phone', regRes.message);
  assert(regRes.customer?.name === 'Anita Verma', 'Customer Profile Created', `Customer ID: ${regRes.customer?.id}`);
  assert(regRes.customer?.phone === '+919811122233', 'Verified Phone Attached to Customer', regRes.customer?.phone || '');

  // ---------------------------------------------------------------------------
  // 8. Returning Customer Login Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Returning Customer Phone Login Flow ---');
  // Send OTP to existing customer
  const returningSendRes = await sendPhoneOtpAction('+91', testPhone);
  assert(returningSendRes.success === true || returningSendRes.message.includes('wait'), 'Returning Customer OTP Request', returningSendRes.message);

  // Verify OTP for existing customer
  const returningVerifyRes = await verifyPhoneOtpAction('+91', testPhone, DEVELOPMENT_TEST_OTP);
  assert(returningVerifyRes.success === true, 'Returning Customer Authenticated', returningVerifyRes.message);
  assert(returningVerifyRes.isNewUser === false, 'Recognized Existing Customer', 'Flag isNewUser is false');
  assert(!returningVerifyRes.redirectTo?.includes('/auth/register'), 'Redirects Directly to Account/Home', returningVerifyRes.redirectTo || '');

  // ---------------------------------------------------------------------------
  // 9. Negative Registration Tests (Validation & Duplicate Phone)
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Negative Registration Tests ---');
  // Attempt duplicate registration
  const dupFormData = new FormData();
  dupFormData.set('fullName', 'Duplicate User');
  dupFormData.set('countryCode', '+91');
  dupFormData.set('phone', testPhone);
  dupFormData.set('email', 'dup@example.com');
  dupFormData.set('gender', 'Female');
  dupFormData.set('addressLine1', 'Test Address');
  dupFormData.set('city', 'Bengaluru');
  dupFormData.set('state', 'Karnataka');
  dupFormData.set('postalCode', '560001');
  dupFormData.set('country', 'India');

  const dupRes = await registerPhoneVerifiedCustomerAction(dupFormData);
  assert(dupRes.success === false, 'Prevents Duplicate Phone Registration', dupRes.message);

  // Invalid PIN Code test
  const badPinFormData = new FormData();
  badPinFormData.set('fullName', 'Bad Pin User');
  badPinFormData.set('countryCode', '+91');
  badPinFormData.set('phone', '9876500099');
  badPinFormData.set('email', 'badpin@example.com');
  badPinFormData.set('addressLine1', 'Test Address');
  badPinFormData.set('city', 'Bengaluru');
  badPinFormData.set('state', 'Karnataka');
  badPinFormData.set('postalCode', '1234'); // 4 digits instead of 6
  badPinFormData.set('country', 'India');

  const badPinRes = await registerPhoneVerifiedCustomerAction(badPinFormData);
  assert(badPinRes.success === false, 'Rejects Invalid 4-Digit Indian PIN Code', badPinRes.errors?.postalCode || badPinRes.message);

  // ---------------------------------------------------------------------------
  // 10. Rewards & SuperCoins Club
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Rewards & SuperCoins Club Tests ---');
  const rewardsRes = await getRewardsSummaryAction();
  assert(rewardsRes.success === true, 'Fetch Rewards Summary', `Available Points: ${rewardsRes.rewards.availablePoints}`);
  assert(rewardsRes.rewards.availablePoints >= 0, 'Non-negative Available Balance', `Balance: ${rewardsRes.rewards.availablePoints}`);
  assert(['Silver', 'Gold', 'Platinum'].includes(rewardsRes.rewards.tier), 'Valid Rewards Tier', `Tier: ${rewardsRes.rewards.tier}`);

  // Test Points Redemption
  const minRedeemRes = await redeemRewardPointsAction(20);
  assert(minRedeemRes.success === false, 'Enforces Minimum Redemption Threshold (50 pts)', minRedeemRes.message);

  // ---------------------------------------------------------------------------
  // 11. 24/7 Customer Support Helpdesk
  // ---------------------------------------------------------------------------
  console.log('\n--- 11. 24/7 Customer Support Tests ---');
  const ticketFormData = new FormData();
  ticketFormData.set('name', 'Priya Patel');
  ticketFormData.set('email', 'priya.patel@example.com');
  ticketFormData.set('phone', '+91 98765 12345');
  ticketFormData.set('category', 'Orders & Tracking');
  ticketFormData.set('orderNumber', 'ORD-20261018-001');
  ticketFormData.set('subject', 'Package arrived in open condition');
  ticketFormData.set('message', 'The outer seal was tampered upon arrival. Need immediate replacement.');
  ticketFormData.set('priority', 'urgent');

  const ticketRes = await createSupportTicketAction(ticketFormData);
  assert(ticketRes.success === true, 'Create Support Ticket', `Ticket Number: ${ticketRes.ticketNumber}`);
  assert(ticketRes.ticketNumber?.startsWith('TKT-') === true, 'Ticket Number Format Standard', ticketRes.ticketNumber || '');

  const userTicketsRes = await getCustomerSupportTicketsAction();
  assert(userTicketsRes.success === true && userTicketsRes.tickets.length >= 1, 'Customer Can Retrieve Their Tickets', `Retrieved ${userTicketsRes.tickets.length} tickets`);

  // ---------------------------------------------------------------------------
  // Final Test Summary
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCustomerAccountSystemTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
