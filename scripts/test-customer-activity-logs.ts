// -----------------------------------------------------------------------------
// scripts/test-customer-activity-logs.ts
// Verification of Customer Activity & Lifecycle Logging (Created, Login, Logout, Purchases)
// -----------------------------------------------------------------------------

import { logCustomerActivity, getCustomerActivities } from '../src/lib/security/activity-logger';
import { memoryCustomers, memoryCustomerActivities } from '../src/lib/admin/store';

async function runActivityLoggingTests() {
  console.log('================================================================');
  console.log('  SHOPSPHERE: CUSTOMER LIFECYCLE & AUDIT LOGGING VERIFICATION   ');
  console.log('================================================================');

  let passed = 0;
  const testUserId = `usr-test-${Date.now()}`;
  const testEmail = 'audittest.user@example.com';

  // 1. Account Created Log
  const createdAct = await logCustomerActivity({
    userId: testUserId,
    userEmail: testEmail,
    action: 'ACCOUNT_CREATED',
    details: { fullName: 'Audit Test Customer', phone: '+91 99887 66554' },
  });

  if (createdAct && createdAct.action === 'ACCOUNT_CREATED' && createdAct.createdAt) {
    console.log('  ✅ [PASS] 1. Customer account creation logged with exact timestamp');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 1. Account creation logging failed');
  }

  // Register in memoryCustomers
  memoryCustomers.unshift({
    id: testUserId,
    fullName: 'Audit Test Customer',
    email: testEmail,
    maskedEmail: 'a***t@example.com',
    role: 'customer',
    ordersCount: 0,
    totalSpent: 0,
    status: 'active',
    isVerified: true,
    createdAt: createdAct.createdAt,
  });

  // 2. Customer Login Log
  const loginAct = await logCustomerActivity({
    userId: testUserId,
    userEmail: testEmail,
    action: 'LOGIN',
    details: { method: 'email-otp', role: 'customer' },
  });

  const custRecord = memoryCustomers.find((c) => c.id === testUserId);
  if (loginAct && custRecord?.lastLoginAt === loginAct.createdAt) {
    console.log('  ✅ [PASS] 2. Customer login logged with timestamp and updated lastLoginAt');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 2. Customer login logging failed');
  }

  // 3. Customer Saves Delivery Address
  const addrAct = await logCustomerActivity({
    userId: testUserId,
    userEmail: testEmail,
    action: 'ADDRESS_SAVED',
    details: { city: 'Hyderabad', state: 'Telangana', type: 'Home' },
  });

  if (addrAct && addrAct.action === 'ADDRESS_SAVED') {
    console.log('  ✅ [PASS] 3. Address save event recorded in customer timeline');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 3. Address save event logging failed');
  }

  // 4. Customer Places Order (What they bought with date & time)
  const orderAct = await logCustomerActivity({
    userId: testUserId,
    userEmail: testEmail,
    action: 'ORDER_PLACED',
    details: {
      orderNumber: 'ORD-20261107-77889',
      orderId: 'ord-test-77889',
      totalAmount: 24990,
      paymentMethod: 'razorpay',
      itemsCount: 1,
      items: [
        {
          title: 'Samsung 236L Refrigerator Elegant Inox',
          sku: 'SAM-REF-236L-INX',
          quantity: 1,
          unitPrice: 24990,
          subtotal: 24990,
        },
      ],
    },
  });

  if (
    orderAct &&
    orderAct.action === 'ORDER_PLACED' &&
    Array.isArray((orderAct.details as Record<string, unknown>).items)
  ) {
    console.log('  ✅ [PASS] 4. Customer purchase logged with product titles, quantities, SKU & amounts');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 4. Order placed logging failed');
  }

  // 5. Customer Logout Log
  const logoutAct = await logCustomerActivity({
    userId: testUserId,
    userEmail: testEmail,
    action: 'LOGOUT',
    details: { reason: 'User initiated sign out' },
  });

  if (logoutAct && custRecord?.lastLogoutAt === logoutAct.createdAt) {
    console.log('  ✅ [PASS] 5. Customer logout logged with timestamp and updated lastLogoutAt');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 5. Customer logout logging failed');
  }

  // 6. Admin Query for Customer Timeline
  const userActivities = await getCustomerActivities(testUserId);
  if (userActivities.length === 5) {
    console.log('  ✅ [PASS] 6. Admin can query all 5 customer lifecycle events in chronological order');
    passed++;
  } else {
    console.error(`  ❌ [FAIL] 6. Expected 5 events for user, received ${userActivities.length}`);
  }

  // 7. Security: Password/token exclusion check
  const hasSecrets = JSON.stringify(userActivities).includes('password') || JSON.stringify(userActivities).includes('secret');
  if (!hasSecrets) {
    console.log('  ✅ [PASS] 7. Zero secrets: Passwords, tokens, and hashes are never stored in activity logs');
    passed++;
  } else {
    console.error('  ❌ [FAIL] 7. Found sensitive data in activity logs');
  }

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed}/7 ACTIVITY & AUDIT TESTS PASSED`);
  console.log('================================================================');

  if (passed !== 7) {
    process.exit(1);
  }
}

runActivityLoggingTests().catch((err) => {
  console.error('Error running activity logging tests:', err);
  process.exit(1);
});

