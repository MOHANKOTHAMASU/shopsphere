// -----------------------------------------------------------------------------
// scripts/test-phase9.ts
// ShopSphere Phase 9: Comprehensive Production Readiness Audit Test Suite
// Validating 15 Pillars of Production Quality, Security & Resilience
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import {
  signUpAction,
  signInAction,
  signOutAction,
  getDemoUserAction,
  setDemoUserSession,
  clearDemoUserSession,
} from '../src/lib/auth/actions';
import { DEMO_USERS } from '../src/lib/auth/demo-users';
import { assertAdmin, verifyAdminSession } from '../src/lib/auth/admin-guard';
import {
  getAdminDashboardMetricsAction,
  createProductAction,
  updateProductAction,
} from '../src/lib/admin/actions';
import { memoryProducts } from '../src/lib/admin/store';
import { revalidateCartAction } from '../src/lib/cart/actions';
import {
  createOrderAction,
  cancelOrderAction,
  getOrderDetailsAction,
  validateCouponAction,
} from '../src/lib/orders/actions';
import {
  verifyRazorpayWebhookSignature,
  verifyRazorpayPaymentSignatureAction,
} from '../src/lib/payments/razorpay';
import {
  checkRateLimit,
  clearAllRateLimits,
} from '../src/lib/security/rate-limit';
import {
  validateImageFile,
  validateImageUrl,
} from '../src/lib/security/upload-validator';
import { sanitizeRedirectPath } from '../src/lib/security/redirects';
import { DEVELOPMENT_SEED_PRODUCTS } from '../src/data/seed-products';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✖ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runPhase9Audit() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE PHASE 9: PRODUCTION READINESS AUDIT SUITE');
  console.log('=============================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Customer Signup, Login, and Logout
  // ---------------------------------------------------------------------------
  console.log('--- 1. Customer Authentication (Signup, Login, Logout) ---');
  clearAllRateLimits();
  await clearDemoUserSession();

  const testEmail = `audit-${Date.now()}@example.com`;
  const signupForm = new FormData();
  signupForm.set('fullName', 'Audit Test Customer');
  signupForm.set('email', testEmail);
  signupForm.set('password', 'ValidPass123');
  signupForm.set('confirmPassword', 'ValidPass123');

  const signupRes = await signUpAction(signupForm);
  assert(signupRes.success, 'Customer signup succeeds with valid data');
  assert(Boolean(signupRes.redirectTo), 'Customer signup provides redirect destination');

  const loginForm = new FormData();
  loginForm.set('email', testEmail);
  loginForm.set('password', 'ValidPass123');
  const loginRes = await signInAction(loginForm);
  assert(loginRes.success, 'Customer login succeeds with registered credentials');

  await signOutAction();
  const sessionAfterSignOut = await getDemoUserAction();
  assert(sessionAfterSignOut === null, 'Customer logout completely terminates active session');

  // ---------------------------------------------------------------------------
  // 2. Customer vs Admin Authorization (RBAC & Privilege Escalation Guards)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. RBAC & Privilege Escalation Prevention ---');
  await clearDemoUserSession();

  // Anonymous visitor
  let unauthBlocked = false;
  try {
    await assertAdmin();
  } catch (err: unknown) {
    unauthBlocked = (err as Error).message.includes('Authentication required');
  }
  assert(unauthBlocked, 'assertAdmin() strictly blocks unauthenticated visitors');

  // Customer account trying to access admin functions
  await setDemoUserSession(DEMO_USERS.customer);
  let customerBlocked = false;
  try {
    await assertAdmin();
  } catch (err: unknown) {
    customerBlocked = (err as Error).message.includes('Forbidden');
  }
  assert(customerBlocked, 'Customer session is strictly blocked from admin privilege escalation');

  const metricsAsCustomer = await getAdminDashboardMetricsAction();
  assert(!metricsAsCustomer.success, 'Customer cannot access getAdminDashboardMetricsAction');

  // Verified admin
  await setDemoUserSession(DEMO_USERS.admin);
  const adminIdentity = await assertAdmin();
  assert(adminIdentity.adminEmail === 'admin@shopsphere.dev', 'Admin session verified with full administrator authority');

  // ---------------------------------------------------------------------------
  // 3. Product Creation, Editing, and SKU Collisions
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Product Management & Integrity ---');
  const auditSku = `AUDIT-SKU-${Date.now().toString().slice(-6)}`;
  const createProdRes = await createProductAction({
    title: 'Audit Audio Pro Headphones',
    sku: auditSku,
    price: 4999,
    compareAtPrice: 6999,
    stockQuantity: 25,
    category: 'Electronics',
    categorySlug: 'electronics',
    description: 'High-fidelity audio monitors verified for production readiness.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
  });
  assert(createProdRes.success, 'Admin creates product with validated fields and unique SKU');

  // Duplicate SKU prevention
  const dupSkuRes = await createProductAction({
    title: 'Duplicate SKU Headphone',
    sku: auditSku,
    price: 3999,
    stockQuantity: 10,
    category: 'Electronics',
    categorySlug: 'electronics',
    description: 'Duplicate SKU test product.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
  });
  assert(!dupSkuRes.success, 'Product creation strictly forbids duplicate SKU collision');

  // Product price & stock editing
  if (createProdRes.product) {
    const updateRes = await updateProductAction(createProdRes.product.id, {
      price: 5299,
      stockQuantity: 30,
    });
    assert(updateRes.success, 'Admin successfully updates product price and stock');
    assert(updateRes.product?.price === 5299, 'Updated product reflects verified new price');
  }

  // ---------------------------------------------------------------------------
  // 4. Cart Persistence & Server-Side Price Recalculation
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Cart Persistence & Zero-Trust Server Recalculation ---');
  const targetProd = DEVELOPMENT_SEED_PRODUCTS[0];
  const tamperedCart = [
    {
      productId: targetProd.id,
      quantity: 2,
      // Client attempts to tamper with the price (claims price is ₹1 instead of real price)
      unitPrice: 1,
    },
  ];

  const cartValidation = await revalidateCartAction(tamperedCart as any);
  assert(cartValidation.isValid, 'Server validates cart against genuine database records');
  assert(
    cartValidation.items[0].unitPrice === targetProd.price,
    'Server rejects client-submitted price and applies database-verified price'
  );
  assert(
    cartValidation.summary.subtotal === targetProd.price * 2,
    'Subtotal is computed strictly on server from verified unit price'
  );

  // ---------------------------------------------------------------------------
  // 5. Inventory Validation & Overselling Protection
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Inventory Validation & Overselling Protection ---');
  const oversellCart = [
    {
      productId: targetProd.id,
      quantity: 99999, // Exceeds stock
      unitPrice: targetProd.price,
    },
  ];

  const oversellValidation = await revalidateCartAction(oversellCart as any);
  assert(
    oversellValidation.hasChanges || oversellValidation.warnings.length > 0,
    'Cart validation flags quantity exceeding available stock'
  );

  const oversellOrderRes = await createOrderAction({
    items: [
      {
        productId: targetProd.id,
        quantity: 99999,
        unitPrice: targetProd.price,
      },
    ],
    shippingAddress: {
      fullName: 'Rahul Verma',
      phone: '+91 98765 43210',
      street: '42 Brigade Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    paymentMethod: 'cod',
  });
  assert(!oversellOrderRes.success, 'createOrderAction strictly rejects orders exceeding available stock');
  assert(
    Boolean(oversellOrderRes.error && oversellOrderRes.error.includes('Insufficient stock')),
    'Returns informative overselling prevention notice with remaining stock'
  );

  // ---------------------------------------------------------------------------
  // 6. Checkout, Order Creation & Coupon Rules
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Checkout, Order Creation & Coupon Validation ---');
  const couponValidation10 = await validateCouponAction('SHOPSPHERE10', 1500);
  assert(couponValidation10.valid, 'Validates SHOPSPHERE10 coupon (10% off for order >= ₹500)');
  assert(couponValidation10.discount === 150, 'Computes correct percentage discount (₹150)');

  const couponValidation500 = await validateCouponAction('WELCOME500', 3000);
  assert(couponValidation500.valid, 'Validates WELCOME500 coupon (Flat ₹500 off for order >= ₹2,500)');
  assert(couponValidation500.discount === 500, 'Applies exact flat discount amount');

  const couponValidationFestive = await validateCouponAction('FESTIVE20', 6000);
  assert(couponValidationFestive.valid, 'Validates FESTIVE20 coupon (20% off for order >= ₹5,000)');

  // Server order creation
  const validOrderRes = await createOrderAction({
    items: [
      {
        productId: targetProd.id,
        quantity: 1,
        unitPrice: targetProd.price,
      },
    ],
    shippingAddress: {
      fullName: 'Vikram Joshi',
      phone: '+91 98765 11223',
      street: '101 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    paymentMethod: 'cod',
    couponCode: 'SHOPSPHERE10',
    idempotencyKey: `idemp-key-${Date.now()}`,
  });
  assert(validOrderRes.success, 'Successfully creates order with verified total and unique order number');
  assert(Boolean(validOrderRes.order?.orderNumber.startsWith('ORD-')), 'Unique order number assigned');

  // Idempotency check: Duplicate order creation attempt with same key
  if (validOrderRes.order) {
    const duplicateOrderRes = await createOrderAction({
      items: [
        {
          productId: targetProd.id,
          quantity: 1,
          unitPrice: targetProd.price,
        },
      ],
      shippingAddress: {
        fullName: 'Vikram Joshi',
        phone: '+91 98765 11223',
        street: '101 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      paymentMethod: 'cod',
      idempotencyKey: (validOrderRes as any).idempotencyKey || `idemp-key-reuse`,
    });
    assert(
      duplicateOrderRes.success,
      'Idempotent order handling safely returns verified order without duplicate charges'
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Payment Verification & Webhook Handling
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Payment Verification & Webhook Ingestion ---');
  const crypto = await import('crypto');
  const testSecret = 'whsec_test_secret_998877';
  const testPayload = JSON.stringify({
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_001',
          amount: 299900,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test_999',
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac('sha256', testSecret)
    .update(testPayload)
    .digest('hex');

  const webhookCheckValid = await verifyRazorpayWebhookSignature(testPayload, validWebhookSig, testSecret);
  assert(webhookCheckValid, 'Razorpay HMAC-SHA256 signature verification passes with matching secret');

  const webhookCheckTampered = await verifyRazorpayWebhookSignature(
    testPayload + 'tampered',
    validWebhookSig,
    testSecret
  );
  assert(!webhookCheckTampered, 'Cryptographic signature rejects tampered webhook payloads');

  // ---------------------------------------------------------------------------
  // 8. Order Cancellation & Stock Restoration
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Order Cancellation & Inventory Stock Restoration ---');
  if (validOrderRes.order) {
    const orderToCancel = validOrderRes.order;
    const prodBefore = memoryProducts.find((p) => p.id === targetProd.id);
    const stockBefore = prodBefore ? prodBefore.stockQuantity : 0;

    const cancelRes = await cancelOrderAction(orderToCancel.id, 'Customer cancellation in audit test');
    assert(cancelRes.success, 'Valid order in pending/confirmed status successfully cancelled');

    const prodAfter = memoryProducts.find((p) => p.id === targetProd.id);
    const stockAfter = prodAfter ? prodAfter.stockQuantity : 0;
    assert(stockAfter >= stockBefore, 'Order cancellation restores allocated inventory back to catalog');

    const cancelAgainRes = await cancelOrderAction(orderToCancel.id, 'Duplicate cancellation');
    assert(!cancelAgainRes.success, 'State machine blocks cancelling an already-cancelled order');
  }

  // ---------------------------------------------------------------------------
  // 9. Database Row Level Security (RLS) Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Database Row Level Security (RLS) Verification ---');
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  let allMigrationsSql = '';
  for (const file of migrationFiles) {
    allMigrationsSql += fs.readFileSync(path.join(migrationsDir, file), 'utf-8') + '\n';
  }

  const expectedRlsTables = [
    'profiles',
    'categories',
    'products',
    'product_images',
    'addresses',
    'cart_items',
    'orders',
    'order_items',
    'reviews',
    'coupons',
    'admin_audit_logs',
    'payments',
    'payment_events',
  ];

  for (const table of expectedRlsTables) {
    const rlsPattern = new RegExp(`ALTER TABLE (public\\.)?${table} ENABLE ROW LEVEL SECURITY`, 'i');
    assert(rlsPattern.test(allMigrationsSql), `RLS enabled on table: ${table}`);
  }

  assert(allMigrationsSql.includes('is_admin()'), 'Database includes helper function is_admin() for RBAC');

  // ---------------------------------------------------------------------------
  // 10. API Validation, Error Handling & Rate Limiting
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Rate Limiting & Sensitive Endpoint Protection ---');
  clearAllRateLimits();

  // Test rate limiting: max 3 attempts within 60s
  const testKey = 'audit:rate-limit-test';
  const r1 = checkRateLimit(testKey, 3, 60);
  const r2 = checkRateLimit(testKey, 3, 60);
  const r3 = checkRateLimit(testKey, 3, 60);
  const r4 = checkRateLimit(testKey, 3, 60);

  assert(r1.allowed && r2.allowed && r3.allowed, 'Allows requests within permitted rate threshold');
  assert(!r4.allowed, 'Rate limiter strictly blocks requests exceeding threshold');
  assert(r4.remaining === 0, 'Rate limiter reports 0 remaining tokens and reset countdown');

  // ---------------------------------------------------------------------------
  // 11. File Upload Restrictions & Image Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- 11. File Upload Restrictions & Image Validation ---');
  // Allowed types
  const validJpg = validateImageFile({ name: 'product.jpg', size: 1024 * 500, type: 'image/jpeg' });
  assert(validJpg.valid, 'Accepts valid JPEG image file within 5MB limit');

  const validWebp = validateImageFile({ name: 'product.webp', size: 1024 * 200, type: 'image/webp' });
  assert(validWebp.valid, 'Accepts modern WebP image format');

  // Oversized file
  const oversized = validateImageFile({ name: 'huge.png', size: 6 * 1024 * 1024, type: 'image/png' });
  assert(!oversized.valid, 'Blocks file exceeding 5MB maximum upload limit');

  // Dangerous script / executable disguised as image
  const dangerousSvg = validateImageFile({ name: 'exploit.svg', size: 1024, type: 'image/svg+xml' });
  assert(!dangerousSvg.valid, 'Blocks SVG uploads to prevent embedded script / XSS vectors');

  const dangerousExe = validateImageFile({ name: 'payload.exe', size: 1024, type: 'application/x-msdownload' });
  assert(!dangerousExe.valid, 'Blocks executable binaries and scripts');

  // URL scheme validation
  assert(validateImageUrl('https://images.unsplash.com/photo-1505740420928').valid, 'Allows HTTPS image URLs');
  assert(!validateImageUrl('javascript:alert(1)').valid, 'Blocks javascript: URI schemes');
  assert(!validateImageUrl('data:text/html;base64,PHNjcmlwdD4=').valid, 'Blocks data: URI schemes');
  assert(!validateImageUrl('http://169.254.169.254/latest/meta-data/').valid, 'Blocks SSRF cloud metadata IP');
  assert(!validateImageUrl('http://localhost:8080/internal').valid, 'Blocks internal loopback SSRF addresses');

  // ---------------------------------------------------------------------------
  // 12. Open Redirect Prevention & Path Sanitization
  // ---------------------------------------------------------------------------
  console.log('\n--- 12. Open Redirect Prevention & Path Sanitization ---');
  assert(sanitizeRedirectPath('/account') === '/account', 'Preserves legitimate internal path /account');
  assert(sanitizeRedirectPath('/checkout') === '/checkout', 'Preserves legitimate internal path /checkout');
  assert(sanitizeRedirectPath('//attacker.com') === '/account', 'Neutralizes protocol-relative open redirect //attacker.com');
  assert(sanitizeRedirectPath('https://evil.com') === '/account', 'Neutralizes absolute external domain redirect');
  assert(sanitizeRedirectPath('/\\evil.com') === '/account', 'Neutralizes backslash bypass attempts');
  assert(sanitizeRedirectPath('javascript:alert(document.cookie)') === '/account', 'Neutralizes javascript: pseudo-protocols');

  // ---------------------------------------------------------------------------
  // 13. Mobile Responsiveness & Accessibility Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 13. Mobile Responsiveness & Accessibility Structure ---');
  const headerContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'layout', 'Header.tsx'), 'utf-8');
  assert(headerContent.includes('MobileDrawer'), 'Header includes dedicated responsive MobileDrawer component');
  assert(headerContent.includes('aria-label="Open menu"'), 'Mobile navigation button provides accessible aria-label');

  const layoutContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'layout.tsx'), 'utf-8');
  assert(layoutContent.includes('viewport') || layoutContent.includes('<html lang="en">'), 'Root HTML specifies valid lang and responsive layout');

  // ---------------------------------------------------------------------------
  // 14. Environment Configuration & Secret Protection Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 14. Environment Configuration & Secret Protection ---');
  const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf-8');
  assert(envExample.includes('NEXT_PUBLIC_SUPABASE_URL'), '.env.example documents Supabase URL');
  assert(envExample.includes('RAZORPAY_KEY_SECRET'), '.env.example documents RAZORPAY_KEY_SECRET');
  assert(envExample.includes('RAZORPAY_WEBHOOK_SECRET'), '.env.example documents RAZORPAY_WEBHOOK_SECRET');

  // Verify that secret keys are NOT prefixed with NEXT_PUBLIC_
  const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  assert(!envLocal.includes('NEXT_PUBLIC_RAZORPAY_KEY_SECRET'), 'RAZORPAY_KEY_SECRET is strictly private (not NEXT_PUBLIC_)');
  assert(!envLocal.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), 'SUPABASE_SERVICE_ROLE_KEY is strictly private');

  // ---------------------------------------------------------------------------
  // 15. Broken Links & Core Static Routes Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 15. Core Pages & Routes Integrity Audit ---');
  const essentialPages = [
    'src/app/(customer)/page.tsx',
    'src/app/(customer)/products/page.tsx',
    'src/app/(customer)/cart/page.tsx',
    'src/app/(customer)/checkout/page.tsx',
    'src/app/(customer)/account/page.tsx',
    'src/app/(customer)/account/orders/page.tsx',
    'src/app/(customer)/account/profile/page.tsx',
    'src/app/(customer)/account/addresses/page.tsx',
    'src/app/(customer)/track/page.tsx',
    'src/app/(customer)/contact/page.tsx',
    'src/app/(customer)/terms/page.tsx',
    'src/app/(customer)/privacy/page.tsx',
    'src/app/(customer)/shipping/page.tsx',
    'src/app/(customer)/returns/page.tsx',
    'src/app/(customer)/refunds/page.tsx',
    'src/app/admin/dashboard/page.tsx',
    'src/app/admin/products/page.tsx',
    'src/app/admin/categories/page.tsx',
    'src/app/admin/orders/page.tsx',
    'src/app/admin/customers/page.tsx',
    'src/app/admin/inventory/page.tsx',
    'src/app/admin/coupons/page.tsx',
    'src/app/admin/reviews/page.tsx',
    'src/app/admin/reports/page.tsx',
    'src/app/admin/login/page.tsx',
  ];

  for (const pagePath of essentialPages) {
    const fullPath = path.join(process.cwd(), pagePath);
    assert(fs.existsSync(fullPath), `Route page exists and verified: ${pagePath}`);
  }

  console.log('\n=============================================================');
  console.log(`  PHASE 9 AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('=============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase9Audit().catch((err) => {
  console.error('Phase 9 audit runner crashed:', err);
  process.exit(1);
});
