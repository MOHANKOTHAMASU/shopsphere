import assert from 'assert';
import { memoryProducts, memoryVerificationTokens, memoryCustomers } from '../src/lib/admin/store';
import { getProducts, getProductBySlug, getFeaturedProducts, getSearchSuggestions } from '../src/lib/products/queries';
import { sendCustomerEmailOtpAction, verifyCustomerEmailOtpAction } from '../src/lib/auth/email-otp-actions';
import { toggleProductVisibilityAction } from '../src/lib/admin/actions';
import { SUPPLEMENTARY_SEED_PRODUCTS } from '../src/data/seed-products-supplement';

async function runTests() {
  console.log('================================================================');
  console.log('  SHOPSPHERE: ADMIN PRODUCT MANAGEMENT & EMAIL OTP TEST SUITE');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${name}:`, err.message);
          });
      }
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ [FAIL] ${name}:`, (err as Error).message);
    }
  }

  // 1. Image Accuracy Tests
  await test('Samsung and LG Refrigerators have distinct, authentic images with zero fried rice photos', () => {
    const samsung = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'SAM-REF-236L-INX');
    assert(samsung, 'Samsung refrigerator product must exist');
    assert(!samsung.thumbnail.includes('photo-1584269600464-37b1b58a9fe7'), 'Must not use fried rice image');
    assert(!samsung.thumbnail.includes('photo-1571175443880-49e1d25b2bc5'), 'Must not use food rice photo');
    assert(samsung.thumbnail.includes('photo-1484154218962'), 'Must use verified refrigerator photo');

    const lg = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'LG-REF-242L-SS');
    assert(lg, 'LG refrigerator product must exist');
    assert(!lg.thumbnail.includes('photo-1584269600464-37b1b58a9fe7'), 'LG must not use fried rice image');
    assert(!lg.images.some((img) => img.includes('photo-1584269600464-37b1b58a9fe7')), 'LG images gallery must have zero fried rice images');
    assert(lg.thumbnail.includes('photo-1584992236310'), 'LG must use distinct verified LG refrigerator photo');
  });

  await test('Green Soul & Wakefit Office Chairs use valid high-res chair images', () => {
    const greenSoul = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'GS-MOC-GRY-01');
    assert(greenSoul, 'Green Soul chair must exist');
    assert(!greenSoul.thumbnail.includes('photo-1580481077195'), 'Must not use broken 404 image');
    assert(greenSoul.thumbnail.includes('photo-1580480055273'), 'Must use working ergonomic chair image');

    const wakefit = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'WKF-MDC-BLK-01');
    assert(wakefit, 'Wakefit chair must exist');
    assert(!wakefit.thumbnail.includes('photo-1580481077195'), 'Must not use broken 404 image');
    assert(wakefit.thumbnail.includes('photo-1517705008128'), 'Must use working office chair image');
  });

  // 2. Draft & Catalog Visibility Tests
  await test('Draft products are strictly hidden from customer catalog listings', async () => {
    // Add a draft product to memoryProducts
    const draftId = `test-draft-${Date.now()}`;
    memoryProducts.unshift({
      id: draftId,
      slug: `test-draft-product-${Date.now()}`,
      title: 'Secret Unreleased Product Test',
      brand: 'AdminBrand',
      category: 'Electronics',
      categorySlug: 'electronics',
      description: 'Draft item',
      shortDescription: 'Draft',
      price: 9999,
      compareAtPrice: 12999,
      discountPercent: 23,
      rating: 5,
      reviewCount: 0,
      stockQuantity: 10,
      isAvailable: true,
      sku: `TEST-SKU-${Date.now()}`,
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
      status: 'draft',
      visibility: 'unpublished',
      isDeleted: false,
      tags: ['draft'],
      features: [],
      specifications: [],
    });

    // Check getProducts
    const res = await getProducts({ query: 'Secret Unreleased' });
    const found = res.items.find((p) => p.id === draftId);
    assert(!found, 'Draft product must NOT appear in search results or customer listings');

    // Check getProductBySlug
    const bySlug = await getProductBySlug(`test-draft-product-${Date.now()}`);
    assert(!bySlug, 'Draft product slug must return null to customers');

    // Clean up
    const idx = memoryProducts.findIndex((p) => p.id === draftId);
    if (idx >= 0) memoryProducts.splice(idx, 1);
  });

  await test('Unpublished products are hidden, but become visible when published', async () => {
    const pubId = `test-pub-${Date.now()}`;
    const pubSlug = `test-pub-product-${Date.now()}`;
    const product = {
      id: pubId,
      slug: pubSlug,
      title: 'Dynamic Publish Test Item',
      brand: 'TestBrand',
      category: 'Electronics',
      categorySlug: 'electronics',
      description: 'Publish item',
      shortDescription: 'Publish',
      price: 4999,
      compareAtPrice: 6999,
      discountPercent: 28,
      rating: 5,
      reviewCount: 0,
      stockQuantity: 15,
      isAvailable: true,
      sku: `TEST-PUB-${Date.now()}`,
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
      status: 'draft' as const,
      visibility: 'unpublished' as const,
      isDeleted: false,
      tags: ['test'],
      features: [],
      specifications: [],
    };
    memoryProducts.unshift(product);

    // Should be hidden initially
    let searchRes = await getProducts({ query: 'Dynamic Publish' });
    assert(!searchRes.items.some((p) => p.id === pubId), 'Must be hidden while unpublished');

    // Admin publishes product
    product.status = 'active';
    product.visibility = 'published';

    // Now should be visible
    searchRes = await getProducts({ query: 'Dynamic Publish' });
    assert(searchRes.items.some((p) => p.id === pubId), 'Must be visible after Admin publishes it');

    // Clean up
    const idx = memoryProducts.findIndex((p) => p.id === pubId);
    if (idx >= 0) memoryProducts.splice(idx, 1);
  });

  await test('Deleted products are strictly hidden from all customer pages', async () => {
    const delId = `test-del-${Date.now()}`;
    const delSlug = `test-del-product-${Date.now()}`;
    memoryProducts.unshift({
      id: delId,
      slug: delSlug,
      title: 'Deleted Product Ghost',
      brand: 'TestBrand',
      category: 'Electronics',
      categorySlug: 'electronics',
      description: 'Ghost',
      shortDescription: 'Ghost',
      price: 1999,
      compareAtPrice: 2999,
      discountPercent: 33,
      rating: 5,
      reviewCount: 0,
      stockQuantity: 5,
      isAvailable: true,
      sku: `TEST-GHOST-${Date.now()}`,
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
      status: 'active',
      visibility: 'published',
      isDeleted: true, // Marked deleted
      tags: ['ghost'],
      features: [],
      specifications: [],
    });

    const res = await getProducts({ query: 'Deleted Product Ghost' });
    assert(!res.items.some((p) => p.id === delId), 'Deleted product must NOT appear in catalog');

    const bySlug = await getProductBySlug(delSlug);
    assert(!bySlug, 'Deleted product slug must return null');

    // Clean up
    const idx = memoryProducts.findIndex((p) => p.id === delId);
    if (idx >= 0) memoryProducts.splice(idx, 1);
  });

  // 3. Email OTP Authentication Tests
  await test('Email OTP dispatch generates 6-digit code with cooldown', async () => {
    const testEmail = `shopper_${Date.now()}@example.com`;
    // Register customer in memory store first (shouldCreateUser: false requirement)
    memoryCustomers.unshift({
      id: `usr-${Date.now()}`,
      fullName: 'Test Shopper',
      email: testEmail,
      maskedEmail: 't***@example.com',
      phone: '+91 98765 43210',
      role: 'customer',
      ordersCount: 0,
      totalSpent: 0,
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    const res = await sendCustomerEmailOtpAction(testEmail);
    assert(res.success, 'Email OTP dispatch must succeed');
    assert(res.cooldownSeconds && res.cooldownSeconds > 0, 'Must enforce cooldown');

    // Rate limit test: immediate second send must be blocked by cooldown
    const rateLimitRes = await sendCustomerEmailOtpAction(testEmail);
    assert(!rateLimitRes.success, 'Immediate second send must trigger rate limit cooldown');
    assert(rateLimitRes.error === 'RATE_LIMIT_COOLDOWN', 'Error code must be RATE_LIMIT_COOLDOWN');
  });

  await test('Email OTP verification succeeds with correct code and rejects wrong code', async () => {
    const testEmail = `verify_test_${Date.now()}@example.com`;
    // Register customer in memory store first (shouldCreateUser: false requirement)
    memoryCustomers.unshift({
      id: `usr-${Date.now()}`,
      fullName: 'Test Verify Shopper',
      email: testEmail,
      maskedEmail: 't***@example.com',
      phone: '+91 98765 43210',
      role: 'customer',
      ordersCount: 0,
      totalSpent: 0,
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    const sendRes = await sendCustomerEmailOtpAction(testEmail);
    assert(sendRes.success, 'OTP send must succeed');

    // Check token was stored
    const record = memoryVerificationTokens.get(testEmail);
    assert(record && record.token.length === 6, 'Must store 6-digit token');

    // Wrong token must fail
    const wrongRes = await verifyCustomerEmailOtpAction(testEmail, '999999');
    assert(!wrongRes.success, 'Wrong OTP must be rejected');

    // Correct token must succeed
    const correctRes = await verifyCustomerEmailOtpAction(testEmail, record.token);
    assert(correctRes.success, 'Correct OTP must authenticate user');
    assert(correctRes.redirectTo === '/account', 'Must redirect to account');

    // Single-use token: second verification with same token must fail
    const reuseRes = await verifyCustomerEmailOtpAction(testEmail, record.token);
    assert(!reuseRes.success, 'Replay/reuse of OTP token must be rejected');
  });

  await test('Sandbox 123456 is rejected in production mode', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const prodRes = await verifyCustomerEmailOtpAction('shopper@production.com', '123456');
      assert(!prodRes.success, 'Sandbox code 123456 must be rejected in production');
      assert(prodRes.error === 'PRODUCTION_SANDBOX_REJECTED', 'Must report PRODUCTION_SANDBOX_REJECTED');
    } finally {
      (process.env as any).NODE_ENV = prevEnv;
    }
  });

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed < total) {
    process.exit(1);
  }
}

runTests();

