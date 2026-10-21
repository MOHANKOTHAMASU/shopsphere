const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   SHOPSPHERE PHASE 5: CHECKOUT & ORDER TEST SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. HTTP Endpoint status checks
  console.log('--- 1. Testing Checkout & Account HTTP Routes ---');
  try {
    const checkoutRes = await fetch(`${BASE_URL}/checkout`);
    assert(checkoutRes.status === 200, `GET /checkout returned HTTP 200 (status: ${checkoutRes.status})`);

    const ordersRes = await fetch(`${BASE_URL}/account/orders`);
    assert(ordersRes.status === 200, `GET /account/orders returned HTTP 200 (status: ${ordersRes.status})`);

    const addressesRes = await fetch(`${BASE_URL}/account/addresses`);
    assert(addressesRes.status === 200, `GET /account/addresses returned HTTP 200 (status: ${addressesRes.status})`);
  } catch (err: unknown) {
    console.error('Network error during HTTP route testing:', (err as Error).message);
    failed++;
  }

  // 2. Test server action functions directly
  console.log('\n--- 2. Testing Server Actions (via dynamic import) ---');
  const {
    validateCouponAction,
    createOrderAction,
    getOrderDetailsAction,
    cancelOrderAction,
  } = await import('../src/lib/orders/actions');

  const {
    getAddressesAction,
    saveAddressAction,
    deleteAddressAction,
  } = await import('../src/lib/addresses/actions');

  // A. Address CRUD Test
  console.log('\n--- 3. Testing Address Data Access & Management ---');
  const initialAddrRes = await getAddressesAction();
  assert(initialAddrRes.success && Array.isArray(initialAddrRes.addresses), 'getAddressesAction returns array of addresses');

  const testAddress = {
    id: 'addr-test-1',
    userId: 'user-test-1',
    fullName: 'Priya Sharma',
    phone: '+91 98111 22233',
    street: '15, Indiranagar 100ft Road',
    apartment: 'Apt 201',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    isDefault: true,
    type: 'Home' as const,
  };

  const saveRes = await saveAddressAction(testAddress);
  assert(saveRes.success && !!saveRes.address?.id, `saveAddressAction successfully creates address (ID: ${saveRes.address?.id})`);
  const createdAddressId = saveRes.address?.id;

  // Edit the address
  const editRes = await saveAddressAction({
    id: createdAddressId,
    fullName: 'Priya Sharma (Work)',
    phone: '+91 98111 22233',
    street: '15, Indiranagar 100ft Road, Phase 2',
    apartment: 'Floor 3',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    isDefault: false,
    type: 'Work' as const,
  });
  assert(editRes.success && editRes.address?.fullName === 'Priya Sharma (Work)', 'saveAddressAction successfully updates existing address');

  // B. Coupon Validation Tests
  console.log('\n--- 4. Testing Coupon Validation Engine ---');
  const invalidCouponRes = await validateCouponAction('INVALIDCODE99', 5000);
  assert(invalidCouponRes.valid === false, 'Invalid coupon correctly rejected with valid: false');

  const lowSpendCouponRes = await validateCouponAction('WELCOME500', 1500);
  assert(lowSpendCouponRes.valid === false, 'WELCOME500 correctly rejected below minimum spend threshold of 2999');

  const highSpendCouponRes = await validateCouponAction('WELCOME500', 4000);
  assert(highSpendCouponRes.valid === true && highSpendCouponRes.discount === 500, `WELCOME500 correctly applied flat discount: ₹${highSpendCouponRes.discount}`);

  const percentCouponRes = await validateCouponAction('SHOPSPHERE10', 2000);
  assert(percentCouponRes.valid === true && percentCouponRes.discount === 200, `SHOPSPHERE10 correctly applies 10% discount: ₹${percentCouponRes.discount}`);

  // C. Stock Validation & Insufficient Stock Handling
  console.log('\n--- 5. Testing Stock Validation & Prevention of Overselling ---');
  const oversizedOrderPayload = {
    idempotencyKey: `idemp-oversize-${Date.now()}`,
    shippingAddress: editRes.address || testAddress,
    paymentMethod: 'cod' as const,
    items: [
      {
        productId: 'prod-1',
        quantity: 999999, // Insufficient stock
      },
    ],
  };

  const oversizedRes = await createOrderAction(oversizedOrderPayload);
  assert(oversizedRes.success === false && !!oversizedRes.error?.toLowerCase().includes('stock'), `Insufficient stock order rejected safely: "${oversizedRes.error}"`);

  // D. Successful Order Placement (Cash on Delivery)
  console.log('\n--- 6. Testing Successful Order Placement (COD) ---');
  const validIdempotencyKey = `idemp-valid-${Date.now()}`;
  const validOrderPayload = {
    idempotencyKey: validIdempotencyKey,
    shippingAddress: editRes.address || testAddress,
    paymentMethod: 'cod' as const,
    couponCode: 'SHOPSPHERE10',
    items: [
      {
        productId: 'prod-1',
        quantity: 1,
      },
    ],
  };

  const validOrderRes = await createOrderAction(validOrderPayload);
  assert(validOrderRes.success === true && !!validOrderRes.order?.orderNumber, `Order created successfully: ${validOrderRes.order?.orderNumber}`);
  assert(validOrderRes.order?.paymentMethod === 'cod', 'Payment method is COD');
  assert(validOrderRes.order?.paymentStatus === 'unpaid', 'Unverified COD order is marked as unpaid (not paid)');
  assert(validOrderRes.order?.status === 'confirmed' || validOrderRes.order?.status === 'pending', `Order status is valid: ${validOrderRes.order?.status}`);

  const placedOrder = validOrderRes.order!;

  // E. Idempotency Test (Repeated Submissions)
  console.log('\n--- 7. Testing Idempotency on Repeated Submission ---');
  const repeatedRes = await createOrderAction(validOrderPayload);
  assert(repeatedRes.success === true, 'Repeated submission succeeds');
  assert(repeatedRes.order?.orderNumber === placedOrder?.orderNumber, `Idempotency enforced: same order returned (${repeatedRes.order?.orderNumber} === ${placedOrder?.orderNumber})`);

  // F. Order Details Retrieval & Order History
  console.log('\n--- 8. Testing Order Details & Lookup ---');
  const detailsRes = await getOrderDetailsAction(placedOrder.id);
  assert(detailsRes.success && detailsRes.order?.id === placedOrder.id, `getOrderDetailsAction retrieved order by ID: ${detailsRes.order?.orderNumber}`);

  const detailsByNumberRes = await getOrderDetailsAction(placedOrder.orderNumber);
  assert(detailsByNumberRes.success && detailsByNumberRes.order?.orderNumber === placedOrder.orderNumber, `getOrderDetailsAction retrieved order by orderNumber: ${detailsByNumberRes.order?.orderNumber}`);

  // Test success page with order number
  const successPageRes = await fetch(`${BASE_URL}/checkout/success?orderNumber=${placedOrder.orderNumber}`);
  assert(successPageRes.status === 200, `GET /checkout/success?orderNumber=${placedOrder.orderNumber} returned HTTP 200`);

  // G. Order Cancellation & Stock Restoration
  console.log('\n--- 9. Testing Order Cancellation & Stock Restoration ---');
  const cancelRes = await cancelOrderAction(placedOrder.id, 'Customer changed mind');
  assert(cancelRes.success === true, `cancelOrderAction succeeded: ${cancelRes.message}`);

  const postCancelDetails = await getOrderDetailsAction(placedOrder.id);
  assert(postCancelDetails.order?.status === 'cancelled', `Order status transitioned to 'cancelled' (status: ${postCancelDetails.order?.status})`);
  assert(postCancelDetails.order?.cancellationReason === 'Customer changed mind', `Cancellation reason stored: "${postCancelDetails.order?.cancellationReason}"`);

  // Attempting to cancel already cancelled order
  const repeatCancelRes = await cancelOrderAction(placedOrder.id, 'Trying again');
  assert(repeatCancelRes.success === false, `Attempting to cancel already cancelled order rejected safely: "${repeatCancelRes.error}"`);

  // Cleanup: delete test address
  if (createdAddressId) {
    const deleteRes = await deleteAddressAction(createdAddressId);
    assert(deleteRes.success, 'deleteAddressAction cleanly removed test address');
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
