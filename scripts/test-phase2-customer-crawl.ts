// =============================================================================
// scripts/test-phase2-customer-crawl.ts
// ShopSphere Phase 2 & 6: Customer Pages Crawl, PDP Integrity, and Payment Tests
// =============================================================================

import { getProducts, getProductBySlug } from '../src/lib/products/queries';
import { DEVELOPMENT_SEED_PRODUCTS } from '../src/data/seed-products';
import { DEVELOPMENT_SEED_CATEGORIES } from '../src/data/seed-categories';
import { memoryProducts } from '../src/lib/admin/store';
import crypto from 'crypto';

interface CrawlResult {
  route: string;
  expectedStatus: number;
  actualStatus: number;
  status: 'PASS' | 'FAIL';
  details: string;
}

const crawlResults: CrawlResult[] = [];

async function testRoute(
  route: string,
  expectedStatus: number = 200,
  options: RequestInit = {}
): Promise<CrawlResult> {
  const url = `http://localhost:3000${route}`;
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      ...options,
    });
    const status = res.status === expectedStatus ? 'PASS' : 'FAIL';
    const location = res.headers.get('location') || '';
    const details = location ? `Redirects to: ${location}` : `Status ${res.status}`;
    const result: CrawlResult = {
      route,
      expectedStatus,
      actualStatus: res.status,
      status,
      details,
    };
    crawlResults.push(result);
    const icon = status === 'PASS' ? '✔' : '❌';
    console.log(`  ${icon} [${res.status}] ${route} -> ${details}`);
    return result;
  } catch (err: any) {
    const result: CrawlResult = {
      route,
      expectedStatus,
      actualStatus: 0,
      status: 'FAIL',
      details: err.message,
    };
    crawlResults.push(result);
    console.log(`  ❌ [ERR] ${route} -> ${err.message}`);
    return result;
  }
}

async function runCustomerCrawlAndPaymentAudit() {
  console.log('\n================================================================');
  console.log('   SHOPSPHERE PHASE 2: CUSTOMER PAGES & PDP INTEGRITY CRAWL     ');
  console.log('================================================================\n');

  // 1. Whitelisted Public Pages
  console.log('--- 1. Public Informational & Legal Pages ---');
  await testRoute('/api/health', 200);
  await testRoute('/auth/login', 200);
  await testRoute('/auth/register', 200);
  await testRoute('/auth/forgot-password', 200);
  await testRoute('/terms', 200);
  await testRoute('/privacy', 200);
  await testRoute('/contact', 200);
  await testRoute('/support', 200);
  await testRoute('/shipping', 200);
  await testRoute('/returns', 200);
  await testRoute('/refunds', 200);

  // 2. Protected Routes (Unauthenticated should 307 to /auth/login)
  console.log('\n--- 2. Protected Customer Routes (Default Deny Redirect to /auth/login) ---');
  await testRoute('/', 307);
  await testRoute('/products', 307);
  await testRoute('/cart', 307);
  await testRoute('/checkout', 307);
  await testRoute('/wishlist', 307);
  await testRoute('/track', 307);
  await testRoute('/account', 307);
  await testRoute('/account/orders', 307);
  await testRoute('/account/profile', 307);
  await testRoute('/account/addresses', 307);

  // 3. Authenticated Session Access to Customer Pages
  console.log('\n--- 3. Authenticated Customer Access to Core Pages ---');
  const demoCookie = `shopsphere_demo_session=${encodeURIComponent(
    JSON.stringify({
      id: 'usr-crawl-cust-001',
      email: 'customer@shopsphere.dev',
      full_name: 'Verified Customer',
      role: 'customer',
    })
  )}`;

  const authOptions = {
    headers: {
      Cookie: demoCookie,
    },
  };

  await testRoute('/', 200, authOptions);
  await testRoute('/products', 200, authOptions);
  await testRoute('/cart', 200, authOptions);
  await testRoute('/checkout', 200, authOptions);
  await testRoute('/wishlist', 200, authOptions);
  await testRoute('/track', 200, authOptions);
  await testRoute('/account', 200, authOptions);
  await testRoute('/account/orders', 200, authOptions);
  await testRoute('/account/profile', 200, authOptions);
  await testRoute('/account/addresses', 200, authOptions);

  // 4. Product Detail Pages (PDP) Integrity across Categories
  console.log('\n--- 4. Product Detail Pages (PDP) Resolution Across Categories ---');
  const sampleSlugs = [
    'sony-wh-1000xm5-wireless-noise-cancelling-headphones', // Electronics
    'apple-macbook-air-15-inch-m3-chip-16gb-512gb-ssd',    // Electronics
    'instant-pot-duo-7-in-1-electric-pressure-cooker-6-quart', // Home & Kitchen
    'logitech-mx-master-3s-wireless-performance-mouse',   // Accessories
    'samsung-galaxy-s24-ultra-5g-ai-smartphone-256gb',     // Electronics
  ];

  for (const slug of sampleSlugs) {
    const prod = await getProductBySlug(slug);
    if (prod) {
      console.log(`  ✔ Found catalog product by slug: "${prod.title}" (₹${prod.price.toLocaleString('en-IN')})`);
      await testRoute(`/products/${slug}`, 200, authOptions);
    } else {
      console.error(`  ❌ Failed to locate product slug: ${slug}`);
      totalFailed++;
    }
  }

  // 5. Phase 6 Payment & Webhook Cryptographic Verification
  console.log('\n================================================================');
  console.log('   SHOPSPHERE PHASE 6: PAYMENT & WEBHOOK VERIFICATION TEST      ');
  console.log('================================================================\n');

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_secret_998877';
  const samplePayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_99887766',
          amount: 2699000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test_112233',
        },
      },
    },
  });

  const validSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(samplePayload)
    .digest('hex');

  const invalidSignature = 'invalid_sha256_signature_tampered';

  // Test Valid Webhook
  const validWebhookRes = await fetch('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': validSignature,
    },
    body: samplePayload,
  });
  const validWebhookJson = await validWebhookRes.json();
  const validPassed = validWebhookRes.status === 200 && validWebhookJson.received === true;
  console.log(
    `  ${validPassed ? '✔ PASS' : '❌ FAIL'}: Valid Razorpay HMAC-SHA256 signature is accepted (HTTP ${validWebhookRes.status})`
  );

  // Test Tampered Webhook
  const tamperedWebhookRes = await fetch('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': invalidSignature,
    },
    body: samplePayload,
  });
  const tamperedPassed = tamperedWebhookRes.status === 400;
  console.log(
    `  ${tamperedPassed ? '✔ PASS' : '❌ FAIL'}: Tampered webhook signature is rejected with HTTP 400 Bad Request`
  );

  // 6. Summary
  const passed = crawlResults.filter((r) => r.status === 'PASS').length + (validPassed ? 1 : 0) + (tamperedPassed ? 1 : 0);
  const failed = crawlResults.filter((r) => r.status === 'FAIL').length + (!validPassed ? 1 : 0) + (!tamperedPassed ? 1 : 0);

  console.log('\n================================================================');
  console.log(`CRAWL & PAYMENT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCustomerCrawlAndPaymentAudit().catch((err) => {
  console.error('Crawl script failed:', err);
  process.exit(1);
});
