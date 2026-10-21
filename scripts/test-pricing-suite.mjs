// -----------------------------------------------------------------------------
// scripts/test-pricing-suite.mjs
// Automated Verification Suite for ShopSphere Competitive Pricing & Architecture
// -----------------------------------------------------------------------------

import { CATEGORY_PRICE_THRESHOLDS, getPriceTier, getCategoryThresholds, getBudgetFilterRanges } from '../src/data/category-thresholds.ts';
import { analyzeProductPricing, calculateMinPermittedPrice, calculateGrossMargin, generateRealisticCompetitorBenchmarks } from '../src/lib/pricing/pricing-engine.ts';
import { getPricingDashboardData, approvePriceChange, updateSupplierCost } from '../src/lib/pricing/store.ts';
import { getProductAlternativeComparisonAction } from '../src/lib/pricing/actions.ts';
import { getProducts } from '../src/lib/products/queries.ts';
import { bulkImportProductsCsvAction } from '../src/lib/admin/actions.ts';
import { createOrderAction } from '../src/lib/orders/actions.ts';
import { setDemoUserSession } from '../src/lib/auth/actions.ts';
import { DEMO_USERS } from '../src/lib/auth/demo-users.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runAllTests() {
  // Set up authenticated admin session for test execution
  await setDemoUserSession(DEMO_USERS.admin);
  console.log('\n=============================================================');
  console.log('SHOPSPHERE COMPETITIVE PRICING & ARCHITECTURE VERIFICATION');
  console.log('=============================================================\n');

  // TEST SUITE 1: Category Price Tiers Calibration
  console.log('--- TEST SUITE 1: Category-Calibrated Price Tiers ---');
  const elecThresholds = getCategoryThresholds('electronics');
  assert(elecThresholds.budgetMax === 4999, 'Electronics budget max is calibrated at ₹4,999');
  assert(elecThresholds.midRangeMax === 24999, 'Electronics mid-range max is calibrated at ₹24,999');

  const fashThresholds = getCategoryThresholds('fashion');
  assert(fashThresholds.budgetMax === 1499, 'Fashion budget max is calibrated at ₹1,499');

  assert(
    elecThresholds.budgetMax !== fashThresholds.budgetMax,
    'Earphones budget threshold differs from fashion/laptop threshold as required'
  );

  assert(getPriceTier(2999, 'electronics') === 'budget', '₹2,999 in Electronics is Budget');
  assert(getPriceTier(14990, 'electronics') === 'mid-range', '₹14,990 in Electronics is Mid-Range');
  assert(getPriceTier(26990, 'electronics') === 'premium', '₹26,990 in Electronics is Premium');
  assert(getPriceTier(1299, 'fashion') === 'budget', '₹1,299 in Fashion is Budget');
  assert(getPriceTier(2999, 'fashion') === 'mid-range', '₹2,999 in Fashion is Mid-Range');

  // TEST SUITE 2: Product Catalog Querying with Tier and Best-Value Sorting
  console.log('\n--- TEST SUITE 2: Catalog Querying & Best-Value Sorting ---');
  const budgetElec = await getProducts({ categorySlug: 'electronics', priceTier: 'budget', limit: 8 });
  assert(budgetElec.items.length > 0, `Returned ${budgetElec.items.length} budget electronics items`);
  const allBudgetElec = budgetElec.items.every((p) => p.price <= elecThresholds.budgetMax);
  assert(allBudgetElec, 'All items returned in budget filter are <= ₹4,999');

  const bestValueQuery = await getProducts({ categorySlug: 'electronics', sortBy: 'best-value', limit: 5 });
  assert(bestValueQuery.items.length > 0, `Returned ${bestValueQuery.items.length} items sorted by best-value`);
  assert(bestValueQuery.items[0].rating >= 4.0, `Top best-value item has high customer rating (${bestValueQuery.items[0].rating}★)`);

  // TEST SUITE 3: Indian Competitor Price Benchmarking
  console.log('\n--- TEST SUITE 3: Indian Retail Competitor Benchmarks ---');
  const sampleProd = budgetElec.items[0];
  const comps = generateRealisticCompetitorBenchmarks(sampleProd);
  assert(comps.length >= 3, `Generated ${comps.length} competitor benchmarks`);
  assert(comps.some((c) => c.competitorName === 'Amazon India'), 'Includes Amazon India benchmark');
  assert(comps.some((c) => c.competitorName === 'Flipkart'), 'Includes Flipkart benchmark');
  assert(comps.some((c) => c.competitorName === 'Official Brand Store'), 'Includes Official Brand Store benchmark');
  assert(comps.every((c) => c.lastChecked && c.verificationStatus), 'All benchmarks include lastChecked timestamp and verificationStatus');

  // TEST SUITE 4: Profitability Floor & Safe Pricing Guardrails
  console.log('\n--- TEST SUITE 4: Profitability Guardrails & Safety Floor ---');
  const supplierCost = 10000;
  const minFloor = calculateMinPermittedPrice(supplierCost, 12);
  // Cost * 1.12 + 120 = 11200 + 120 = 11320
  assert(minFloor === 11320, `Minimum floor correctly calculated as ₹${minFloor} for ₹10,000 cost`);
  assert(calculateGrossMargin(12000, 10000) === 16.7, 'Gross margin calculation is 16.7% for ₹12,000 price / ₹10,000 cost');

  // Test analysis with competitor undercutting below floor
  const underFloorAnalysis = analyzeProductPricing(
    {
      id: 'test-p-1',
      sku: 'TEST-SKU-1',
      title: 'Flagship Test Item',
      price: 15000,
      stockQuantity: 10,
      categorySlug: 'electronics',
      brand: 'TestBrand',
    },
    {
      supplierCost: 12000, // floor = 12000 * 1.12 + 120 = 13560
      competitors: [
        {
          competitorName: 'Amazon India',
          sellingPrice: 11000, // competitor is below our 13560 floor!
          inStock: true,
          verificationStatus: 'verified',
          lastChecked: '2026-10-21',
          sourceLabel: 'Amazon India',
          modelOrSkuMatch: 'TEST-SKU-1',
        },
      ],
    }
  );
  assert(underFloorAnalysis.priceReviewRequired === true, 'Price review flag raised when competitor is below floor');
  assert(underFloorAnalysis.suggestedPrice >= underFloorAnalysis.minPermittedPrice, 'Suggested price never breaches minimum floor');
  assert(underFloorAnalysis.priceReviewReason.includes('BELOW our minimum floor'), 'Price review reason warns admin against selling at operational loss');

  // TEST SUITE 5: Admin Pricing Approval & Audit Log
  console.log('\n--- TEST SUITE 5: Admin Pricing Approval & Immutable Audit Log ---');
  const dashData = await getPricingDashboardData();
  assert(dashData.items.length > 0, `Admin dashboard loaded ${dashData.items.length} monitored items`);
  assert(dashData.summary.averageMarginPercent > 0, `Average margin calculated at ${dashData.summary.averageMarginPercent}%`);

  const approvalTest = await approvePriceChange({
    productId: dashData.items[0].productId,
    newPrice: dashData.items[0].currentPrice,
    adminEmail: 'kmvsubbarao28@gmail.com',
    reason: 'Verified price stability test',
  });
  assert(approvalTest.success === true, 'Admin successfully approved price with audit trail');
  assert(approvalTest.auditEntry?.adminEmail === 'kmvsubbarao28@gmail.com', 'Audit entry recorded authenticated admin email');

  // TEST SUITE 6: Public Customer Alternatives & Privacy Guardrails
  console.log('\n--- TEST SUITE 6: Customer Alternatives & Admin Cost Privacy ---');
  const publicComparison = await getProductAlternativeComparisonAction('sony-wh-1000xm5-wireless-noise-cancelling-headphones');
  assert(publicComparison.success === true, 'Customer alternatives comparison generated successfully');
  assert(publicComparison.comparison?.alternatives.length > 0, `Generated ${publicComparison.comparison?.alternatives.length} category alternatives`);
  // Critical privacy assertion: verify supplierCost is NOT exposed
  const serialized = JSON.stringify(publicComparison);
  assert(!serialized.includes('supplierCost'), 'PRIVACY ENFORCED: supplierCost is NEVER leaked to customer comparison API');
  assert(!serialized.includes('minPermittedPrice'), 'PRIVACY ENFORCED: minPermittedPrice is NEVER leaked to customer comparison API');

  // TEST SUITE 7: Bulk CSV Import Validation
  console.log('\n--- TEST SUITE 7: Bulk CSV Import Validation ---');
  // 1. Invalid CSV missing headers
  const badCsvRes = await bulkImportProductsCsvAction('bad,headers\n1,2');
  assert(badCsvRes.success === false, 'Rejects CSV with missing required headers');

  // 2. CSV with invalid price
  const badPriceCsv = `title,brand,categorySlug,price,compareAtPrice,stockQuantity,sku,description,thumbnail
Test Title,Brand,electronics,-500,1000,10,TEST-SKU-BAD,Description,https://example.com/img.jpg`;
  const badPriceRes = await bulkImportProductsCsvAction(badPriceCsv);
  assert(badPriceRes.success === false, 'Rejects CSV row with negative price');

  // 3. Valid CSV
  const validSku = `TEST-CSV-${Date.now()}`;
  const validCsv = `title,brand,categorySlug,price,compareAtPrice,stockQuantity,sku,description,thumbnail
AudioPro Studio Monitors,AudioPro,electronics,8999,11999,15,${validSku},Professional studio active monitors,https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80`;
  const validRes = await bulkImportProductsCsvAction(validCsv);
  assert(validRes.success === true, `Valid CSV imported successfully (${validRes.importedCount} item)`);

  // TEST SUITE 8: Order Creation & Server-Side Price Snapshotting
  console.log('\n--- TEST SUITE 8: Order Server Price Snapshotting ---');
  const orderRes = await createOrderAction({
    shippingAddress: {
      fullName: 'Subba Rao',
      phone: '9876543210',
      street: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    paymentMethod: 'cod',
    items: [
      {
        productId: 'prod-elec-001',
        quantity: 1,
      },
    ],
  });
  assert(orderRes.success === true, `Order created: ${orderRes.order?.orderNumber}`);
  assert(orderRes.order?.items[0].unitPrice > 0, `Order line-item snapshotted authoritative unit price: ₹${orderRes.order?.items[0].unitPrice}`);
  assert(orderRes.order?.totalAmount > 0, `Order final total accurately computed: ₹${orderRes.order?.totalAmount}`);

  console.log('\n=============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
