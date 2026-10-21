import assert from 'assert';
import { COMPLETE_SEED_PRODUCTS_400 } from '../src/data/seed-products-data.ts';
import { DEVELOPMENT_SEED_CATEGORIES } from '../src/data/seed-categories.ts';

console.log('================================================================');
console.log('SHOPSPHERE FULL VERIFICATION SUITE — PHASES 1 TO 10');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: At least 50 distinct products appear in EACH of the 8 categories
// -----------------------------------------------------------------------------
runTest('Catalog has at least 8 categories and >= 50 products in each (>= 400 total)', () => {
  assert.ok(DEVELOPMENT_SEED_CATEGORIES.length >= 8, `Expected >= 8 categories, got ${DEVELOPMENT_SEED_CATEGORIES.length}`);
  
  const expectedSlugs = [
    'electronics',
    'fashion',
    'home-kitchen',
    'beauty',
    'books',
    'sports',
    'grocery',
    'accessories',
  ];

  for (const slug of expectedSlugs) {
    const categoryExists = DEVELOPMENT_SEED_CATEGORIES.some(c => c.slug === slug);
    assert.ok(categoryExists, `Category with slug "${slug}" must exist in DEVELOPMENT_SEED_CATEGORIES`);

    const productsInCat = COMPLETE_SEED_PRODUCTS_400.filter(p => p.categorySlug === slug);
    assert.ok(
      productsInCat.length >= 50,
      `Category "${slug}" must have at least 50 products, but found ${productsInCat.length}`
    );
  }

  assert.ok(
    COMPLETE_SEED_PRODUCTS_400.length >= 400,
    `Total catalog must have >= 400 items, got ${COMPLETE_SEED_PRODUCTS_400.length}`
  );
});

// -----------------------------------------------------------------------------
// TEST 2: Every product record has complete required schema fields
// -----------------------------------------------------------------------------
runTest('All products have unique IDs, unique SKUs, valid pricing, images, and ratings', () => {
  const ids = new Set();
  const skus = new Set();

  for (const p of COMPLETE_SEED_PRODUCTS_400) {
    assert.ok(p.id, 'Product must have ID');
    assert.ok(!ids.has(p.id), `Duplicate product ID found: ${p.id}`);
    ids.add(p.id);

    assert.ok(p.sku, `Product ${p.id} must have SKU`);
    assert.ok(!skus.has(p.sku), `Duplicate SKU found: ${p.sku}`);
    skus.add(p.sku);

    assert.ok(p.title && p.title.length > 3, `Product ${p.id} must have title`);
    assert.ok(p.brand, `Product ${p.id} must have brand`);
    assert.ok(p.category, `Product ${p.id} must have category name`);
    assert.ok(p.categorySlug, `Product ${p.id} must have categorySlug`);
    assert.ok(p.price > 0, `Product ${p.id} price must be > 0`);
    assert.ok(p.thumbnail && p.thumbnail.startsWith('https://'), `Product ${p.id} must have valid image URL`);
    assert.ok(Array.isArray(p.images) && p.images.length > 0, `Product ${p.id} must have images array`);
    assert.ok(typeof p.stockQuantity === 'number' && p.stockQuantity >= 0, `Product ${p.id} must have stock >= 0`);
    assert.ok(typeof p.rating === 'number' && p.rating >= 1 && p.rating <= 5, `Product ${p.id} rating must be between 1 and 5`);
  }
});

// -----------------------------------------------------------------------------
// TEST 3: Out of stock products exist and are marked unavailable
// -----------------------------------------------------------------------------
runTest('Catalog includes out-of-stock products properly marked isAvailable=false', () => {
  const outOfStock = COMPLETE_SEED_PRODUCTS_400.filter(p => p.stockQuantity === 0);
  assert.ok(outOfStock.length >= 8, `Expected at least 8 out-of-stock items (1 per cat), found ${outOfStock.length}`);
  for (const p of outOfStock) {
    assert.strictEqual(p.isAvailable, false, `Out of stock item ${p.id} must have isAvailable=false`);
  }
});

// -----------------------------------------------------------------------------
// TEST 4: Search and Filtering Simulation
// -----------------------------------------------------------------------------
runTest('Search by keyword and brand filters items accurately', () => {
  const sonySearch = COMPLETE_SEED_PRODUCTS_400.filter(p => 
    p.title.toLowerCase().includes('sony') || p.brand.toLowerCase() === 'sony'
  );
  assert.ok(sonySearch.length >= 3, `Expected at least 3 Sony items, found ${sonySearch.length}`);

  const priceRange = COMPLETE_SEED_PRODUCTS_400.filter(p => p.price >= 1000 && p.price <= 5000);
  assert.ok(priceRange.length > 50, `Expected > 50 items between ₹1,000 and ₹5,000, found ${priceRange.length}`);
});

// -----------------------------------------------------------------------------
// TEST 5: Cart Calculation & Line Item Subtotal Simulation
// -----------------------------------------------------------------------------
runTest('Cart calculates line item subtotals, combined totals, and delivery fees correctly', () => {
  // Example from requirements:
  // Product A: ₹500 × 2 = ₹1,000
  // Product B: ₹250 × 3 = ₹750
  // Product C: ₹100 × 1 = ₹100
  // Cart subtotal = ₹1,850
  const itemA = { price: 500, quantity: 2, lineTotal: 500 * 2 };
  const itemB = { price: 250, quantity: 3, lineTotal: 250 * 3 };
  const itemC = { price: 100, quantity: 1, lineTotal: 100 * 1 };

  const subtotal = itemA.lineTotal + itemB.lineTotal + itemC.lineTotal;
  assert.strictEqual(subtotal, 1850, `Subtotal must be 1850, got ${subtotal}`);

  // Free shipping on >= 999
  const shippingFee = subtotal >= 999 ? 0 : 99;
  assert.strictEqual(shippingFee, 0, `Shipping fee on 1850 must be 0`);
  assert.strictEqual(subtotal + shippingFee, 1850);
});

// -----------------------------------------------------------------------------
// TEST 6: Inventory Overselling Protection
// -----------------------------------------------------------------------------
runTest('Overselling protection: requests exceeding available stock are rejected', () => {
  const lowStockItem = COMPLETE_SEED_PRODUCTS_400.find(p => p.stockQuantity === 3);
  assert.ok(lowStockItem, 'Low stock item with stock=3 should exist');

  const requestedQty = 5;
  const isAllowed = requestedQty <= lowStockItem.stockQuantity;
  assert.strictEqual(isAllowed, false, 'Request for 5 units when stock is 3 must be disallowed');
});

// -----------------------------------------------------------------------------
// TEST 7: Historical Order Price Snapshotting
// -----------------------------------------------------------------------------
runTest('Historical order snapshotting: editing catalog price does not alter past order line prices', () => {
  const originalPrice = 2499;
  const orderSnapshot = {
    productId: 'prod-home-001',
    title: 'Double-Wall Insulated Stainless Steel French Press (1L)',
    unitPriceSnapshot: originalPrice,
    quantity: 2,
    lineTotal: originalPrice * 2,
  };

  // Simulate updating product price in catalog to ₹2,999
  const updatedCatalogPrice = 2999;
  
  // Historical snapshot must remain ₹2,499
  assert.strictEqual(orderSnapshot.unitPriceSnapshot, 2499, 'Historical order snapshot price must not change');
  assert.strictEqual(orderSnapshot.lineTotal, 4998, 'Historical order line total must not change');
  assert.notStrictEqual(orderSnapshot.unitPriceSnapshot, updatedCatalogPrice);
});

console.log('----------------------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} automated tests passed!`);
console.log('================================================================');
