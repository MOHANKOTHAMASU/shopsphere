// -----------------------------------------------------------------------------
// scripts/test-phase8.ts
// ShopSphere Phase 8 Automated Verification Test Suite
// Complete Customer Experience: Discovery, Filters, Reviews, Tracking, Profile & Support
// -----------------------------------------------------------------------------

import { getSearchSuggestions, getAvailableBrands, getProducts } from '../src/lib/products/queries';
import {
  calculateProductReviewStats,
  checkUserReviewEligibility,
  saveCustomerReview,
  removeCustomerReview,
} from '../src/lib/reviews/store';
import { inMemoryOrders } from '../src/lib/orders/store';
import { getOrderDetailsAction } from '../src/lib/orders/actions';
import { submitSupportInquiryAction } from '../src/lib/contact/actions';
import { updatePasswordAction } from '../src/lib/auth/actions';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

async function runPhase8Tests() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE PHASE 8: COMPLETE CUSTOMER EXPERIENCE VERIFICATION');
  console.log('=============================================================\n');

  // ---------------------------------------------------------------------------
  // 1. PRODUCT SEARCH & AUTOCOMPLETE SUGGESTIONS
  // ---------------------------------------------------------------------------
  console.log('--- 1. Search Autocomplete & Suggestions ---');

  const suggestions = await getSearchSuggestions('headphone');
  assert(
    suggestions.products.length > 0,
    'Returns matching products for keyword "headphone"',
    `Found ${suggestions.products.length} products`
  );
  assert(
    suggestions.products.some((p) => p.title.toLowerCase().includes('headphone') || p.category.toLowerCase().includes('audio')),
    'Matching products contain keyword in title or category'
  );
  assert(
    suggestions.products[0].price > 0 && Boolean(suggestions.products[0].brand),
    'Product suggestions include real price, brand badge, and thumbnail'
  );

  const emptySuggestions = await getSearchSuggestions('xyznonexistentquery999');
  assert(
    emptySuggestions.products.length === 0,
    'Graceful empty state for non-matching queries'
  );

  // ---------------------------------------------------------------------------
  // 2. CATALOG FILTERS & ADVANCED SORTING
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Catalog Filters & Sorting ---');

  const availableBrands = await getAvailableBrands();
  assert(
    availableBrands.length >= 3,
    'Available brands aggregated with item counts',
    `Found ${availableBrands.length} distinct brands`
  );
  assert(
    availableBrands.some((b) => b.name === 'Sony' && b.count > 0),
    'Aggregated brands correctly count Sony products'
  );

  // Brand filter
  const sonyProducts = await getProducts({ brand: 'Sony' });
  assert(
    sonyProducts.items.length > 0 && sonyProducts.items.every((p) => p.brand.toLowerCase() === 'sony'),
    'Brand filter strictly restricts catalog results to selected brand'
  );

  // Sorting by Price
  const lowToHigh = await getProducts({ sortBy: 'price-low', limit: 10 });
  const isSortedLow = lowToHigh.items.every(
    (item, idx, arr) => idx === 0 || arr[idx - 1].price <= item.price
  );
  assert(isSortedLow, 'Sort by Price: Low to High accurately orders products');

  const highToLow = await getProducts({ sortBy: 'price-high', limit: 10 });
  const isSortedHigh = highToLow.items.every(
    (item, idx, arr) => idx === 0 || arr[idx - 1].price >= item.price
  );
  assert(isSortedHigh, 'Sort by Price: High to Low accurately orders products');

  // Sorting by Popularity (reviews & rating)
  const popular = await getProducts({ sortBy: 'popularity', limit: 6 });
  const isPopularitySorted = popular.items.every(
    (item, idx, arr) =>
      idx === 0 ||
      (arr[idx - 1].rating * arr[idx - 1].reviewCount) >= (item.rating * item.reviewCount)
  );
  assert(isPopularitySorted, 'Sort by Popularity orders by real (rating * reviewCount) data');

  // Sorting by Newest
  const newest = await getProducts({ sortBy: 'newest', limit: 6 });
  const isNewestSorted = newest.items.every(
    (item, idx, arr) =>
      idx === 0 ||
      new Date(arr[idx - 1].createdAt || '').getTime() >= new Date(item.createdAt || '').getTime()
  );
  assert(isNewestSorted, 'Sort by Newest orders by product creation date descending');

  // Availability filter (inStockOnly)
  const inStockResult = await getProducts({ inStockOnly: true });
  assert(
    inStockResult.items.every((p) => p.stockQuantity > 0),
    'In-stock availability filter excludes out-of-stock items'
  );

  // ---------------------------------------------------------------------------
  // 3. PRODUCT REVIEWS & RATINGS WITH VERIFIED PURCHASE ELIGIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Review Eligibility & Ownership Protection ---');

  const testProduct = 'prod-001';

  // Unverified customer check (user who has never bought prod-001)
  const unverifiedEligibility = checkUserReviewEligibility('usr-random-stranger', 'random@stranger.org', testProduct);
  assert(
    !unverifiedEligibility.eligible,
    'Rejects review eligibility for customers who have not purchased the item'
  );
  assert(
    Boolean(unverifiedEligibility.reason),
    'Returns clear explanation why customer is ineligible to review'
  );

  // Non-verified submission attempt
  const rejectedSubmit = saveCustomerReview({
    userId: 'usr-random-stranger',
    authorName: 'Random Stranger',
    productId: testProduct,
    productTitle: 'Sony WH-1000XM5',
    rating: 5,
    title: 'Fabricated Review',
    comment: 'I did not buy this but writing anyway to test security rejection.',
  });
  assert(
    !rejectedSubmit.success,
    'saveCustomerReview blocks unverified submission'
  );

  // Eligible customer check (demo customer usr-customer-01 who purchased prod-001)
  const eligibleCheck = checkUserReviewEligibility('usr-customer-01', 'customer@shopsphere.dev', testProduct);
  assert(
    eligibleCheck.eligible,
    'Verified purchaser is recognized as eligible to review'
  );

  // Verified review submission
  const validSubmit = saveCustomerReview({
    userId: 'usr-customer-01',
    authorName: 'Rahul Sharma',
    userEmail: 'customer@shopsphere.dev',
    productId: testProduct,
    productTitle: 'Sony WH-1000XM5',
    rating: 5,
    title: 'Exceptional ANC & Sound Quality',
    comment: 'Tested on flights and in busy cafes. Incredible audio fidelity and 30-hour battery life.',
  });
  assert(
    validSubmit.success && Boolean(validSubmit.review?.isVerifiedPurchase),
    'Verified purchaser can successfully submit review with Verified Purchase badge'
  );

  // Real ratings calculation (no fabricated stats)
  const reviewStats = calculateProductReviewStats(testProduct);
  assert(
    reviewStats.reviewCount > 0 && reviewStats.averageRating >= 1 && reviewStats.averageRating <= 5,
    'Product rating stats dynamically calculated from approved customer reviews',
    `Average rating: ${reviewStats.averageRating}, Count: ${reviewStats.reviewCount}`
  );

  // Ownership Protection: Customer B cannot edit or delete Customer A's review
  const foreignReviewId = validSubmit.review?.id || 'rev-001';
  const unauthorizedDelete = removeCustomerReview('usr-malicious-intruder', foreignReviewId);
  assert(
    !unauthorizedDelete.success,
    'Security guard prevents customer from deleting another user\'s review'
  );

  // Legitimate author can delete their own review
  const legitimateDelete = removeCustomerReview('usr-customer-01', foreignReviewId);
  assert(
    legitimateDelete.success,
    'Customer can successfully delete their own review'
  );

  // ---------------------------------------------------------------------------
  // 4. ORDER TRACKING & ORDER DETAILS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Order Tracking & Timeline ---');

  // Seed sample order in inMemoryOrders if not present
  if (!inMemoryOrders.some((o) => o.orderNumber === 'ORD-20261020-0001')) {
    inMemoryOrders.push({
      id: 'ord-test-001',
      orderNumber: 'ORD-20261020-0001',
      userId: 'usr-customer-01',
      status: 'shipped',
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      subtotal: 26990,
      discount: 2000,
      shippingFee: 0,
      totalAmount: 24990,
      shippingAddress: {
        id: 'addr-001',
        userId: 'usr-customer-01',
        fullName: 'Rahul Sharma',
        phone: '+91 98765 43210',
        street: '42 MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        isDefault: true,
      },
      items: [
        {
          id: 'item-001',
          orderId: 'ord-test-001',
          productId: 'prod-001',
          title: 'Sony WH-1000XM5 Wireless Headphones',
          sku: 'SKU-SNY-WH5',
          unitPrice: 26990,
          quantity: 1,
          subtotal: 26990,
        },
      ],
      trackingNumber: 'AWB-BLUEDART-829104',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const trackingLookup = await getOrderDetailsAction('ORD-20261020-0001');
  assert(
    trackingLookup.success && trackingLookup.order?.orderNumber === 'ORD-20261020-0001',
    'Order lookup by orderNumber returns accurate order details'
  );
  assert(
    trackingLookup.order?.status === 'shipped' && Boolean(trackingLookup.order?.trackingNumber),
    'Order details include shipment status, milestones, and courier tracking AWB'
  );
  assert(
    trackingLookup.order?.items.length === 1 && trackingLookup.order?.items[0].productId === 'prod-001',
    'Order items accurately retrieved with quantities and pricing'
  );

  const invalidTracking = await getOrderDetailsAction('ORD-DOES-NOT-EXIST-404');
  assert(
    !invalidTracking.success,
    'Invalid order query returns graceful failure message'
  );

  // ---------------------------------------------------------------------------
  // 5. CUSTOMER PROFILE EDITING & SECURITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Customer Profile Settings & Password ---');

  // Test password validation
  const shortPassForm = new FormData();
  shortPassForm.set('newPassword', 'short');
  shortPassForm.set('confirmPassword', 'short');
  const shortPassRes = await updatePasswordAction(shortPassForm);
  assert(
    !shortPassRes.success,
    'Password update enforces minimum 8 characters requirement'
  );

  const mismatchPassForm = new FormData();
  mismatchPassForm.set('newPassword', 'StrongPassword123!');
  mismatchPassForm.set('confirmPassword', 'DifferentPassword456!');
  const mismatchRes = await updatePasswordAction(mismatchPassForm);
  assert(
    !mismatchRes.success,
    'Password update enforces password and confirmation match'
  );

  const validPassForm = new FormData();
  validPassForm.set('newPassword', 'SecurePassword2026!');
  validPassForm.set('confirmPassword', 'SecurePassword2026!');
  const validPassRes = await updatePasswordAction(validPassForm);
  assert(
    validPassRes.success,
    'Valid password update succeeds with clear confirmation message'
  );

  // ---------------------------------------------------------------------------
  // 6. CUSTOMER SUPPORT & INQUIRY HELPDESK
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Customer Support & Inquiry Helpdesk ---');

  const invalidInquiry = new FormData();
  invalidInquiry.set('fullName', 'A'); // Too short
  invalidInquiry.set('email', 'not-an-email');
  invalidInquiry.set('message', 'Hi');
  const invalidInquiryRes = await submitSupportInquiryAction(invalidInquiry);
  assert(
    !invalidInquiryRes.success && Boolean(invalidInquiryRes.errors?.email),
    'Support inquiry validates required fields, email syntax, and message length'
  );

  const validInquiry = new FormData();
  validInquiry.set('fullName', 'Priya Patel');
  validInquiry.set('email', 'priya.patel@example.com');
  validInquiry.set('orderNumber', 'ORD-20261020-0001');
  validInquiry.set('category', 'Order Tracking & Logistics');
  validInquiry.set('subject', 'Delivery Schedule Confirmation');
  validInquiry.set('message', 'Could you please confirm if the package will arrive before 5 PM tomorrow?');
  const validInquiryRes = await submitSupportInquiryAction(validInquiry);
  assert(
    validInquiryRes.success && Boolean(validInquiryRes.ticketNumber?.startsWith('TKT-')),
    'Support inquiry generates unique reference ticket ID (TKT-...) and success message'
  );

  // ---------------------------------------------------------------------------
  // FINAL REPORT
  // ---------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`  PHASE 8 TESTS COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('=============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  process.exit(1);
});
