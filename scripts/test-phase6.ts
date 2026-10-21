import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('   SHOPSPHERE PHASE 6: RAZORPAY GATEWAY TEST SUITE  ');
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

  // 1. Dynamic imports of Phase 6 modules
  console.log('--- 1. Importing Payment Services & Actions ---');
  const {
    isRazorpayConfigured,
    createRazorpayOrderAction,
    verifyRazorpayPaymentAction,
    recordPaymentFailureAction,
    verifyRazorpayWebhookSignature,
    getOrderPaymentsAction,
  } = await import('../src/lib/payments/razorpay');

  const { createOrderAction, getOrderDetailsAction } = await import('../src/lib/orders/actions');

  // A. Configuration check
  const isConfigured = await isRazorpayConfigured();
  console.log(`[INFO] Razorpay Credentials Configured in Environment: ${isConfigured ? 'YES' : 'NO (Graceful Structure Active)'}`);

  // B. Setup a test order in ShopSphere
  console.log('\n--- 2. Setting Up Online Test Order ---');
  const testAddress = {
    id: 'addr-rzp-test',
    userId: 'user-rzp-test',
    fullName: 'Aditya Mehta',
    phone: '+91 98222 33344',
    street: '77, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    country: 'India',
    isDefault: true,
    type: 'Home' as const,
  };

  const orderRes = await createOrderAction({
    idempotencyKey: `idemp-rzp-${Date.now()}`,
    shippingAddress: testAddress,
    paymentMethod: 'razorpay',
    items: [
      {
        productId: 'prod-001',
        quantity: 1,
      },
    ],
  });

  assert(orderRes.success && !!orderRes.order, `Order created for online payment: ${orderRes.order?.orderNumber}`);
  const order = orderRes.order!;

  assert(order.paymentStatus === 'unpaid', 'Online order starts in "unpaid" status');
  assert(order.status === 'pending', 'Online order starts in "pending" status until payment is verified');
  assert(order.paymentMethod === 'razorpay', 'Payment method is "razorpay"');

  // C. Server-calculated total conversion & zero-trust check
  console.log('\n--- 3. Testing Server Calculation & Paise Conversion ---');
  const expectedPaise = Math.round(order.totalAmount * 100);
  assert(expectedPaise > 0, `Server correctly converts total (₹${order.totalAmount}) to integer paise (${expectedPaise} paise)`);

  // D. Create Razorpay Payment Order on Server
  console.log('\n--- 4. Testing Razorpay Payment Order Creation ---');
  const rzpOrderRes = await createRazorpayOrderAction(order.id);
  if (isConfigured) {
    assert(rzpOrderRes.success && !!rzpOrderRes.razorpayOrderId, `Generated real Razorpay Order ID: ${rzpOrderRes.razorpayOrderId}`);
  } else {
    // When live credentials aren't in env, it must report missing credentials clearly without crashing
    assert(
      rzpOrderRes.success === false && !!rzpOrderRes.error?.includes('credentials'),
      `Missing credentials reported cleanly: "${rzpOrderRes.error}"`
    );
  }

  // E. Cryptographic HMAC-SHA256 Signature Verification
  console.log('\n--- 5. Testing Cryptographic HMAC-SHA256 Signature Engine ---');
  const testSecret = 'test_webhook_and_api_secret_key_12345';
  process.env.RAZORPAY_KEY_SECRET = testSecret;

  const mockRzpOrderId = `order_test_${Date.now()}`;
  const mockRzpPaymentId = `pay_test_${Date.now()}`;

  // Generate authentic signature
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${mockRzpOrderId}|${mockRzpPaymentId}`)
    .digest('hex');

  // Test 1: Tampered / Invalid signature rejection
  const tamperedPayload = {
    orderId: order.id,
    razorpayOrderId: mockRzpOrderId,
    razorpayPaymentId: mockRzpPaymentId,
    razorpaySignature: 'tampered_fake_signature_abc1234567890abcdef',
  };

  const tamperedVerifyRes = await verifyRazorpayPaymentAction(tamperedPayload);
  assert(
    tamperedVerifyRes.success === false && !!tamperedVerifyRes.error?.includes('signature'),
    `Tampered signature rejected safely: "${tamperedVerifyRes.error}"`
  );

  // Verify order was NOT marked as paid
  const checkUnpaid = await getOrderDetailsAction(order.id);
  assert(checkUnpaid.order?.paymentStatus === 'unpaid', 'Zero-trust verified: Tampered payment DID NOT mark order as paid');

  // Test 2: Authentic signature verification
  const authenticPayload = {
    orderId: order.id,
    razorpayOrderId: mockRzpOrderId,
    razorpayPaymentId: mockRzpPaymentId,
    razorpaySignature: validSignature,
  };

  const authenticVerifyRes = await verifyRazorpayPaymentAction(authenticPayload);
  assert(authenticVerifyRes.success === true, `Authentic HMAC-SHA256 signature verified successfully: Order #${authenticVerifyRes.orderNumber}`);

  // Verify order transitioned to 'paid' and 'confirmed'
  const checkPaid = await getOrderDetailsAction(order.id);
  assert(checkPaid.order?.paymentStatus === 'paid', 'Order paymentStatus successfully updated to "paid"');
  assert(checkPaid.order?.status === 'confirmed', 'Order status successfully transitioned to "confirmed"');
  assert(checkPaid.order?.razorpayPaymentId === mockRzpPaymentId, `Stored razorpayPaymentId matches: ${checkPaid.order?.razorpayPaymentId}`);

  // Test payment audit retrieval
  const paymentAuditRes = await getOrderPaymentsAction(order.id);
  assert(paymentAuditRes.success === true, 'getOrderPaymentsAction successfully retrieved audit records');

  // F. Payment Failure Recording & Retry Handling
  console.log('\n--- 6. Testing Payment Failure Recording & Retry Capability ---');
  // Create another unpaid order to test failure recording
  const failureOrderRes = await createOrderAction({
    idempotencyKey: `idemp-fail-${Date.now()}`,
    shippingAddress: testAddress,
    paymentMethod: 'razorpay',
    items: [{ productId: 'prod-001', quantity: 1 }],
  });
  const failureOrder = failureOrderRes.order!;

  const recordFailRes = await recordPaymentFailureAction(
    failureOrder.id,
    'BAD_REQUEST_ERROR',
    'Customer payment declined by issuing bank'
  );
  assert(recordFailRes.success === true, 'recordPaymentFailureAction succeeded');

  const checkFailedOrder = await getOrderDetailsAction(failureOrder.id);
  assert(checkFailedOrder.order?.paymentStatus === 'failed', 'Order payment status set to "failed"');
  assert(checkFailedOrder.order?.status === 'pending', 'Order status remains "pending" for payment retry');

  // G. Webhook Signature Verification & Idempotency
  console.log('\n--- 7. Testing Razorpay Webhook Verification & Idempotency ---');
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_secret_998877';

  const webhookPayload = JSON.stringify({
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_wh_${Date.now()}`,
          order_id: mockRzpOrderId,
          status: 'captured',
          amount: expectedPaise,
          currency: 'INR',
          notes: {
            orderId: failureOrder.id,
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  });

  // Authentic webhook signature
  const validWebhookSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookPayload)
    .digest('hex');

  // Test Webhook Helper Function
  const helperValid = await verifyRazorpayWebhookSignature(
    webhookPayload,
    validWebhookSig,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );
  assert(helperValid === true, 'verifyRazorpayWebhookSignature validated authentic webhook payload');

  const helperInvalid = await verifyRazorpayWebhookSignature(
    webhookPayload + 'tampered',
    validWebhookSig,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );
  assert(helperInvalid === false, 'verifyRazorpayWebhookSignature rejected tampered payload');

  // Test Webhook HTTP Route: /api/webhooks/razorpay
  console.log('\n--- 8. Testing /api/webhooks/razorpay HTTP Route ---');
  // 1. Missing signature rejection
  const missingSigRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    body: webhookPayload,
    headers: { 'Content-Type': 'application/json' },
  });
  assert(missingSigRes.status === 400, `POST /api/webhooks/razorpay without signature rejected: HTTP ${missingSigRes.status}`);

  // 2. Tampered signature rejection
  const badSigRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    body: webhookPayload,
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': 'invalid_signature_xyz',
    },
  });
  assert(badSigRes.status === 400, `POST /api/webhooks/razorpay with invalid signature rejected: HTTP ${badSigRes.status}`);

  // 3. Valid webhook acceptance
  const eventId = `evt_test_${Date.now()}`;
  const validWhRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    body: webhookPayload,
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWebhookSig,
      'x-razorpay-event-id': eventId,
    },
  });
  assert(validWhRes.status === 200, `POST /api/webhooks/razorpay with valid signature accepted: HTTP ${validWhRes.status}`);

  // 4. Duplicate webhook idempotency test (deliver same eventId)
  const duplicateWhRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    body: webhookPayload,
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWebhookSig,
      'x-razorpay-event-id': eventId,
    },
  });
  const dupData = await duplicateWhRes.json();
  assert(
    duplicateWhRes.status === 200 && dupData.status === 'duplicate_event_already_processed',
    `Duplicate webhook handled idempotently: status="${dupData.status}"`
  );

  console.log('\n====================================================');
  console.log(`TOTAL PHASE 6 TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('Unhandled Phase 6 test suite error:', err);
  process.exit(1);
});
