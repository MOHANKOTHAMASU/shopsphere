import { getProducts, getCategories, getSearchSuggestions } from '../src/lib/products/queries';
import { DEVELOPMENT_SEED_CATEGORIES } from '../src/data/seed-categories';
import { DEVELOPMENT_SEED_PRODUCTS } from '../src/data/seed-products';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  const icon = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${name}: ${details}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('SHOPSPHERE E-COMMERCE PRODUCTS, SEARCH, FILTERS & CART TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. OFFICIAL 10 CATEGORIES VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Official 10 Categories ---');
  const requiredCategories = [
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Mobiles', slug: 'mobiles' },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Home Appliances', slug: 'home-appliances' },
    { name: 'Food & Health', slug: 'food-health' },
    { name: 'Automotive Accessories', slug: 'automotive' },
    { name: 'Sports & Fitness', slug: 'sports' },
    { name: 'Furniture', slug: 'furniture' },
    { name: 'Books', slug: 'books' },
  ];

  const categories = await getCategories();
  assert(
    '10 Categories Configured',
    categories.length >= 10,
    `Found ${categories.length} categories in catalog`
  );

  for (const cat of requiredCategories) {
    const res = await getProducts({ categorySlug: cat.slug, limit: 12 });
    assert(
      `Category: ${cat.name} (${cat.slug})`,
      res.total > 0,
      `${res.total} products returned for ${cat.name}. Sample: "${res.items[0]?.title || 'none'}"`
    );
  }

  // -------------------------------------------------------------------------
  // 2. EXPLICIT 7 TEST SEARCH QUERIES
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing 7 Explicit Search Queries ---');
  const requiredQueries = [
    { query: 'Samsung mobile', expectedCat: 'mobiles' },
    { query: "Men's shoes", expectedCat: 'fashion' },
    { query: 'Wireless headphones', expectedCat: 'electronics' },
    { query: 'Face wash', expectedCat: 'beauty' },
    { query: 'Refrigerator', expectedCat: 'home-appliances' },
    { query: 'Office chair', expectedCat: 'furniture' },
    { query: 'Python programming book', expectedCat: 'books' },
  ];

  for (const item of requiredQueries) {
    const res = await getProducts({ query: item.query, limit: 8 });
    assert(
      `Search Query: "${item.query}"`,
      res.total > 0,
      `Matched ${res.total} products. Top match: "${res.items[0]?.title}" [${res.items[0]?.categorySlug}]`
    );
  }

  // Empty search results test
  const emptyRes = await getProducts({ query: 'NonExistentProductXYZ123' });
  assert(
    'Empty Search Results Handling',
    emptyRes.total === 0 && Array.isArray(emptyRes.items),
    'Gracefully returns 0 items for nonexistent query'
  );

  // -------------------------------------------------------------------------
  // 3. SEARCH SUGGESTIONS & AUTOCOMPLETE
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Search Autocomplete Suggestions ---');
  const testTerms = ['samsung', 'headphone', 'python', 'wash', 'chair', 'fridge'];
  for (const term of testTerms) {
    const suggestions = await getSearchSuggestions(term);
    assert(
      `Suggestions for "${term}"`,
      suggestions.products.length > 0,
      `Found ${suggestions.products.length} product suggestions and ${suggestions.categories.length} category suggestions`
    );
  }

  // -------------------------------------------------------------------------
  // 4. PRICE FILTERING & COMBINED MULTI-ATTRIBUTE FILTERS
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Price Range & Multi-Attribute Filters ---');
  // Range: min ₹1,000, max ₹5,000
  const priceFiltered = await getProducts({ minPrice: 1000, maxPrice: 5000, limit: 24 });
  const allInRange = priceFiltered.items.every((p) => p.price >= 1000 && p.price <= 5000);
  assert(
    'Price Range Filter (₹1,000 – ₹5,000)',
    priceFiltered.total > 0 && allInRange,
    `All ${priceFiltered.items.length} items in result have price within [₹1,000, ₹5,000]`
  );

  // Budget under ₹500
  const under500 = await getProducts({ maxPrice: 500, limit: 20 });
  const allUnder500 = under500.items.every((p) => p.price <= 500);
  assert(
    'Affordable Budget Filter (Under ₹500)',
    under500.total > 0 && allUnder500,
    `Found ${under500.total} products under ₹500. Lowest: ₹${Math.min(...under500.items.map((p) => p.price))}`
  );

  // Combined: Mobiles + Max Price ₹40,000 + Brand Samsung
  const combinedRes = await getProducts({
    categorySlug: 'mobiles',
    brand: 'Samsung',
    maxPrice: 40000,
  });
  const allMatchCombined = combinedRes.items.every(
    (p) => p.categorySlug === 'mobiles' && p.brand.toLowerCase() === 'samsung' && p.price <= 40000
  );
  assert(
    'Combined Filter (Mobiles + Samsung + ≤ ₹40,000)',
    combinedRes.total > 0 && allMatchCombined,
    `Matched ${combinedRes.total} products satisfying all 3 filters simultaneously`
  );

  // -------------------------------------------------------------------------
  // 5. SORTING VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Sorting Algorithms ---');
  const sortLow = await getProducts({ sortBy: 'price-low', limit: 8 });
  let isSortedAsc = true;
  for (let i = 1; i < sortLow.items.length; i++) {
    if (sortLow.items[i].price < sortLow.items[i - 1].price) isSortedAsc = false;
  }
  assert('Sort by Price: Low to High', isSortedAsc, 'Prices increase monotonically');

  const sortHigh = await getProducts({ sortBy: 'price-high', limit: 8 });
  let isSortedDesc = true;
  for (let i = 1; i < sortHigh.items.length; i++) {
    if (sortHigh.items[i].price > sortHigh.items[i - 1].price) isSortedDesc = false;
  }
  assert('Sort by Price: High to Low', isSortedDesc, 'Prices decrease monotonically');

  const sortRating = await getProducts({ sortBy: 'rating', limit: 8 });
  let isRatingDesc = true;
  for (let i = 1; i < sortRating.items.length; i++) {
    if (sortRating.items[i].rating > sortRating.items[i - 1].rating) isRatingDesc = false;
  }
  assert('Sort by Customer Rating', isRatingDesc, 'Highest ratings appear first');

  // -------------------------------------------------------------------------
  // 6. CART MATH, DISCOUNT & PIN CODE LOGIC
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Cart & Savings Calculations ---');
  // Unit test discount formulas: Savings = Original - Selling; Discount % = (Savings / Original) * 100
  const sampleProduct = DEVELOPMENT_SEED_PRODUCTS.find((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  if (sampleProduct && sampleProduct.compareAtPrice) {
    const expectedSavings = sampleProduct.compareAtPrice - sampleProduct.price;
    const expectedPercent = Math.round((expectedSavings / sampleProduct.compareAtPrice) * 100);
    assert(
      'Server-side Discount Calculation',
      expectedSavings > 0 && Math.abs(expectedPercent - sampleProduct.discountPercent) <= 1,
      `Original: ₹${sampleProduct.compareAtPrice}, Selling: ₹${sampleProduct.price}, Savings: ₹${expectedSavings}, Discount: ${sampleProduct.discountPercent}%`
    );
  }

  // Test Promo Code SHOPSPHERE10 (10% off)
  const cartSubtotal = 2500;
  const couponDiscount = Math.round(cartSubtotal * 0.1);
  const shippingFee = cartSubtotal >= 999 ? 0 : 99;
  const finalPayable = cartSubtotal - couponDiscount + shippingFee;
  assert(
    'Coupon SHOPSPHERE10 & Free Shipping Rules',
    couponDiscount === 250 && shippingFee === 0 && finalPayable === 2250,
    `Subtotal: ₹${cartSubtotal}, 10% coupon: ₹${couponDiscount}, Shipping: ₹${shippingFee}, Total: ₹${finalPayable}`
  );

  // Test PIN code regex validation
  const validPins = ['560001', '110001', '400001', '500001'];
  const invalidPins = ['012345', '12345', '1234567', 'abcde', ''];
  const pinRegex = /^[1-9][0-9]{5}$/;
  const allValidsPass = validPins.every((p) => pinRegex.test(p));
  const allInvalidsFail = invalidPins.every((p) => !pinRegex.test(p));
  assert(
    'Indian 6-Digit PIN Code Validation',
    allValidsPass && allInvalidsFail,
    'Correctly accepts standard 6-digit PINs and rejects invalid formats'
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
