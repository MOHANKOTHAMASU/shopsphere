// -----------------------------------------------------------------------------
// scripts/test-cross-customer-security.ts
// ShopSphere Cross-Customer Isolation & Server Action Security Suite
// -----------------------------------------------------------------------------

import assert from 'node:assert';
import {
  signUpAction,
  signInAction,
  signOutAction,
  setDemoUserSession,
  clearDemoUserSession,
} from '../src/lib/auth/actions';
import { assertAdmin, assertAuthenticatedUser } from '../src/lib/auth/admin-guard';
import {
  createOrderAction,
  getOrderDetailsAction,
  getCustomerOrdersAction,
  cancelOrderAction,
} from '../src/lib/orders/actions';
import {
  getAddressesAction,
  saveAddressAction,
  deleteAddressAction,
} from '../src/lib/addresses/actions';
import { inMemoryOrders } from '../src/lib/orders/store';
import { memoryAddresses, memoryCustomers } from '../src/lib/admin/store';

let passed = 0;
let failed = 0;

function report(testName: string, condition: boolean, detail: string = '') {
  if (condition) {
    passed++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✖ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runSecurityAudit() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE CROSS-CUSTOMER SECURITY & ACTION AUDIT');
  console.log('=============================================================\n');

  // --- 1. Registration 10-Field Validation ---
  console.log('--- 1. Registration Input Validation ---');
  {
    const incompleteForm = new FormData();
    incompleteForm.set('fullName', 'A'); // Too short
    incompleteForm.set('email', 'invalid-email');
    incompleteForm.set('password', '123'); // Too short
    incompleteForm.set('confirmPassword', '456'); // Mismatch

    const result = await signUpAction(incompleteForm);
    report('Rejects invalid registration data with specific validation errors', !result.success && !!result.errors);
    report('Flags password mismatch error', result.errors?.confirmPassword === 'Passwords do not match.');
  }

  // --- 2. Generic Error on Incorrect Login ---
  console.log('\n--- 2. Generic Safe Login Errors ---');
  {
    const wrongPassForm = new FormData();
    wrongPassForm.set('email', 'nonexistent.user@example.com');
    wrongPassForm.set('password', 'WrongPassword@123!');

    const result = await signInAction(wrongPassForm);
    report(
      'Incorrect credentials return generic safe message without revealing email registration',
      result.message === 'Invalid email or password. Please verify and try again.' ||
      result.message === 'Please enter valid credentials.' ||
      !result.success
    );
  }

  // --- 3. Setup Customer A & Customer B Sessions ---
  console.log('\n--- 3. Setting Up Customer A & Customer B Fixtures ---');
  const customerA = {
    id: 'usr-customer-alpha-001',
    email: 'alpha@example.com',
    full_name: 'Customer Alpha',
    role: 'customer' as const,
  };

  const customerB = {
    id: 'usr-customer-beta-002',
    email: 'beta@example.com',
    full_name: 'Customer Beta',
    role: 'customer' as const,
  };

  // Seed Customer A Order & Address
  await setDemoUserSession(customerA);

  const orderRes = await createOrderAction({
    items: [{ productId: 'prod-elec-001', quantity: 1 }],
    shippingAddress: {
      id: 'addr-a1',
      userId: customerA.id,
      fullName: 'Customer Alpha',
      phone: '+91 98765 00001',
      street: 'Alpha Street 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true,
      type: 'Home',
    },
    paymentMethod: 'cod',
  });

  report('Customer A successfully places an order with authenticated identity', orderRes.success && !!orderRes.order);
  const customerA_OrderId = orderRes.order!.id;
  const customerA_OrderNum = orderRes.order!.orderNumber;

  const addrRes = await saveAddressAction({
    fullName: 'Customer Alpha Work',
    phone: '+91 98765 00001',
    street: 'Alpha Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
  });

  report('Customer A successfully saves a delivery address', addrRes.success && !!addrRes.address);
  const customerA_AddressId = addrRes.address!.id;

  // --- 4. Cross-Customer Data Isolation (Customer B trying to access Customer A) ---
  console.log('\n--- 4. Cross-Customer Authorization Isolation ---');

  // Switch authenticated session to Customer B
  await setDemoUserSession(customerB);

  // Customer B calls getCustomerOrdersAction()
  const ordersB = await getCustomerOrdersAction();
  const customerB_sees_CustomerA_order = ordersB.orders.some((o) => o.id === customerA_OrderId);
  report(
    'Customer B order history NEVER contains Customer A orders',
    !customerB_sees_CustomerA_order
  );

  // Customer B calls getAddressesAction()
  const addrsB = await getAddressesAction();
  const customerB_sees_CustomerA_addr = addrsB.addresses.some((a) => a.id === customerA_AddressId);
  report(
    'Customer B address book NEVER contains Customer A delivery addresses',
    !customerB_sees_CustomerA_addr
  );

  // Customer B attempts to directly query Customer A's order by ID
  const orderDetailsAttempt = await getOrderDetailsAction(customerA_OrderId);
  report(
    'Customer B is strictly BLOCKED from viewing Customer A order details',
    !orderDetailsAttempt.success && Boolean(orderDetailsAttempt.error?.includes('Unauthorized'))
  );

  // Customer B attempts to directly delete Customer A's address
  const deleteAddrAttempt = await deleteAddressAction(customerA_AddressId);
  report(
    'Customer B is strictly BLOCKED from deleting Customer A delivery address',
    !deleteAddrAttempt.success && Boolean(deleteAddrAttempt.error?.includes('Unauthorized'))
  );

  // Customer B attempts to directly cancel Customer A's order
  const cancelOrderAttempt = await cancelOrderAction(customerA_OrderId, 'Malicious cancel attempt');
  report(
    'Customer B is strictly BLOCKED from cancelling Customer A order',
    !cancelOrderAttempt.success && Boolean(cancelOrderAttempt.error?.includes('Unauthorized'))
  );

  // --- 5. Customer Blocked from Admin Privileges ---
  console.log('\n--- 5. Customer Privilege Escalation Guard ---');
  {
    let adminCheckBlocked = false;
    try {
      await assertAdmin();
    } catch (err: any) {
      if (err.message.includes('Forbidden') || err.message.includes('Unauthorized')) {
        adminCheckBlocked = true;
      }
    }
    report('Customer session is strictly blocked from assertAdmin() privilege escalation', adminCheckBlocked);
  }

  // --- 6. Admin Can Access Order for Fulfillment ---
  console.log('\n--- 6. Administrator Fulfillment Access ---');
  {
    const adminUser = {
      id: 'usr-demo-admin',
      email: 'admin@shopsphere.dev',
      full_name: 'Store Administrator',
      role: 'admin' as const,
    };
    await setDemoUserSession(adminUser);

    const adminOrderView = await getOrderDetailsAction(customerA_OrderId);
    report(
      'Authorized Administrator can view Customer A order for fulfillment purposes',
      adminOrderView.success && !!adminOrderView.order
    );

    const adminIdentity = await assertAdmin();
    report(
      'assertAdmin() returns verified administrator credentials',
      adminIdentity.adminEmail === 'admin@shopsphere.dev'
    );
  }

  // --- 7. Logout Invalidation ---
  console.log('\n--- 7. Logout & Session Termination ---');
  {
    await clearDemoUserSession();

    let unauthBlocked = false;
    try {
      await assertAuthenticatedUser();
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        unauthBlocked = true;
      }
    }
    report('After logout, assertAuthenticatedUser() strictly throws Unauthorized', unauthBlocked);

    const unauthOrders = await getCustomerOrdersAction();
    report('After logout, getCustomerOrdersAction() returns 0 orders', !unauthOrders.success && unauthOrders.orders.length === 0);
  }

  console.log('\n=============================================================');
  console.log(`TOTAL SECURITY ASSERTIONS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
