/**
 * ShopSphere Phase 7 Automated Test Suite: Admin Panel & Role-Based Access Control
 *
 * Validates:
 * 1. Security & RBAC: Customer blocked from admin operations, assertAdmin rejects non-admins.
 * 2. Admin dashboard KPI aggregation from real orders/products.
 * 3. Product creation, update, inventory restock, and deletion.
 * 4. Category creation, update, and safe deletion.
 * 5. Inventory control & low-stock alerts.
 * 6. Order fulfillment, filtering, valid status state machine transitions, and stock restoration upon cancellation.
 * 7. Customer directory with PII email masking.
 * 8. Coupon creation, activation toggle, and deletion.
 * 9. Customer review moderation (approval & rejection workflows).
 * 10. Immutable administrative audit logging for all mutations.
 */

import { setDemoUserSession, clearDemoUserSession } from '../src/lib/auth/actions';
import { DEMO_USERS } from '../src/lib/auth/demo-users';
import { assertAdmin, verifyAdminSession } from '../src/lib/auth/admin-guard';
import {
  getAdminDashboardMetricsAction,
  getAdminProductsAction,
  getAdminProductByIdAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  updateInventoryAction,
  getAdminCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  getAdminOrdersAction,
  getAdminOrderDetailsAction,
  updateOrderStatusAction,
  getAdminCustomersAction,
  getAdminCouponsAction,
  createCouponAction,
  toggleCouponStatusAction,
  deleteCouponAction,
  getAdminReviewsAction,
  moderateReviewAction,
  getAdminAuditLogsAction,
} from '../src/lib/admin/actions';
import { CreateProductInput, CreateCategoryInput, CreateCouponInput } from '../src/types/ecommerce';

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('   SHOPSPHERE PHASE 7: ADMIN PANEL & RBAC TEST SUITE');
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

  // =========================================================================
  // TEST 1: Role-Based Access Control & Security Guards (Customer Denial)
  // =========================================================================
  console.log('--- TEST 1: Role-Based Access Control & Security Guards ---');

  // A. Unauthenticated visitor attempts admin guard
  await clearDemoUserSession();
  let unauthBlocked = false;
  try {
    await assertAdmin();
  } catch (err: unknown) {
    unauthBlocked = (err as Error).message.includes('Unauthorized') || (err as Error).message.includes('Authentication required');
  }
  assert(unauthBlocked, 'Unauthenticated visitor is blocked by assertAdmin()');

  // B. Customer attempts admin guard
  await setDemoUserSession(DEMO_USERS.customer);
  let customerBlocked = false;
  try {
    await assertAdmin();
  } catch (err: unknown) {
    customerBlocked = (err as Error).message.includes('Forbidden') || (err as Error).message.includes('Administrative privileges required');
  }
  assert(customerBlocked, 'Customer account is strictly forbidden by assertAdmin()');

  // C. Customer attempts admin action directly (e.g. getAdminDashboardMetricsAction)
  const custMetricsRes = await getAdminDashboardMetricsAction();
  assert(!custMetricsRes.success, 'Customer cannot access getAdminDashboardMetricsAction');

  // D. Customer attempts product creation
  const custProdRes = await createProductAction({
    title: 'Hacked Product',
    brand: 'Hacked Brand',
    category: 'Electronics',
    description: 'Malicious payload',
    price: 1,
    categorySlug: 'electronics',
    sku: 'HACK-001',
    stockQuantity: 999,
    images: ['https://example.com/hacked.png'],
  });
  assert(!custProdRes.success, 'Customer cannot execute createProductAction');

  // E. Customer attempts order status mutation
  const custOrderRes = await updateOrderStatusAction('ord-seed-001', 'delivered');
  assert(!custOrderRes.success, 'Customer cannot execute updateOrderStatusAction');

  // F. Customer attempts review moderation
  const custModRes = await moderateReviewAction('rev-001', 'approved');
  assert(!custModRes.success, 'Customer cannot execute moderateReviewAction');

  // G. Customer attempts audit log access
  const custAuditRes = await getAdminAuditLogsAction();
  assert(!custAuditRes.success, 'Customer cannot read admin audit logs');

  // =========================================================================
  // TEST 2: Admin Session Verification & Dashboard Metrics
  // =========================================================================
  console.log('\n--- TEST 2: Admin Session Verification & Dashboard Metrics ---');

  // Sign in as Admin
  await setDemoUserSession(DEMO_USERS.admin);
  const adminSession = await verifyAdminSession();
  assert(adminSession.authorized && adminSession.admin?.adminEmail === 'admin@shopsphere.dev', 'Admin session verified successfully');

  const adminVerified = await assertAdmin();
  assert(adminVerified.adminId === 'usr-demo-admin', 'assertAdmin() returns verified administrator identity');

  const dashboardRes = await getAdminDashboardMetricsAction();
  assert(dashboardRes.success && Boolean(dashboardRes.metrics), 'getAdminDashboardMetricsAction returns metrics for admin');

  if (dashboardRes.metrics) {
    const m = dashboardRes.metrics;
    assert(m.totalRevenue > 0, `Dashboard total revenue calculated from database: ₹${m.totalRevenue}`);
    assert(m.totalOrders > 0, `Dashboard total orders count: ${m.totalOrders}`);
    assert(m.totalProducts > 0, `Dashboard total active products count: ${m.totalProducts}`);
    assert(m.totalCustomers > 0, `Dashboard registered customers count: ${m.totalCustomers}`);
    assert(Array.isArray(m.salesByCategory), 'Dashboard includes salesByCategory breakdown');
    assert(Array.isArray(m.salesByPaymentMethod), 'Dashboard includes salesByPaymentMethod');
    assert(Array.isArray(m.recentOrders) && m.recentOrders.length > 0, 'Dashboard lists recent real customer orders');
    console.log(`[INFO] Live Low Stock Alerts Count: ${m.lowStockCount}`);
  }

  // =========================================================================
  // TEST 3: Product Management Lifecycle (Create, Edit, Inventory, Delete)
  // =========================================================================
  console.log('\n--- TEST 3: Product Management Lifecycle ---');

  const uniqueSku = `TEST-PROD-${Date.now().toString().slice(-6)}`;
  const newProductInput: CreateProductInput = {
    title: 'Phase 7 Test SoundPro Wireless Earbuds',
    brand: 'SoundPro',
    category: 'Electronics & Gadgets',
    description: 'High-fidelity audio with active noise cancellation and 40h battery life.',
    price: 3499,
    compareAtPrice: 5999,
    discountPercent: 41,
    categorySlug: 'electronics',
    sku: uniqueSku,
    stockQuantity: 15,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
    isFeatured: true,
  };

  // Create
  const createProdRes = await createProductAction(newProductInput);
  assert(createProdRes.success && Boolean(createProdRes.product), `Admin created product with SKU ${uniqueSku}`);
  const createdProductId = createProdRes.product?.id || '';

  // Retrieve by ID
  const fetchProdRes = await getAdminProductByIdAction(createdProductId);
  assert(fetchProdRes.success && fetchProdRes.product?.title === newProductInput.title, 'Fetched newly created product by ID');

  // Edit Product
  const updateProdRes = await updateProductAction(createdProductId, {
    price: 2999,
    title: 'Phase 7 Test SoundPro Wireless Earbuds (Gen 2)',
    isBestSeller: true,
  });
  assert(updateProdRes.success && updateProdRes.product?.price === 2999, 'Product price updated to ₹2999');

  // Inventory Management
  const restockRes = await updateInventoryAction(createdProductId, 45);
  assert(restockRes.success && restockRes.stock === 45, 'Product inventory updated to 45 units');

  // Delete Product
  const deleteProdRes = await deleteProductAction(createdProductId);
  assert(deleteProdRes.success, 'Product successfully deleted from catalog');

  const verifyDeletedRes = await getAdminProductByIdAction(createdProductId);
  assert(!verifyDeletedRes.success, 'Product ID is no longer accessible after deletion');

  // =========================================================================
  // TEST 4: Category Management Lifecycle
  // =========================================================================
  console.log('\n--- TEST 4: Category Management Lifecycle ---');

  const testCategoryInput: CreateCategoryInput = {
    name: 'Phase 7 Smart Home',
    slug: `smart-home-${Date.now()}`,
    description: 'Automated devices, smart plugs, and hub controllers.',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  };

  // Create Category
  const createCatRes = await createCategoryAction(testCategoryInput);
  assert(createCatRes.success && Boolean(createCatRes.category), `Category "${testCategoryInput.name}" created`);
  const createdCatId = createCatRes.category?.id || '';

  // Update Category
  const updateCatRes = await updateCategoryAction(createdCatId, {
    description: 'Updated smart automation appliances and accessories.',
  });
  assert(updateCatRes.success && Boolean(updateCatRes.category?.description?.includes('Updated')), 'Category description updated');

  // Retrieve Categories
  const listCatRes = await getAdminCategoriesAction();
  assert(listCatRes.success && listCatRes.categories.some((c) => c.id === createdCatId), 'Created category listed in catalog taxonomy');

  // Safe Delete Category
  const deleteCatRes = await deleteCategoryAction(createdCatId);
  assert(deleteCatRes.success, 'Category deleted successfully');

  // =========================================================================
  // TEST 5: Inventory & Low-Stock Alerts
  // =========================================================================
  console.log('\n--- TEST 5: Inventory & Low-Stock Alerts ---');

  const inventoryProdsRes = await getAdminProductsAction();
  assert(inventoryProdsRes.success && inventoryProdsRes.products.length > 0, `Loaded ${inventoryProdsRes.products.length} products for inventory audit`);

  // Verify low-stock calculation
  const lowStock = inventoryProdsRes.products.filter((p) => p.stockQuantity <= 10 && p.stockQuantity > 0);
  console.log(`[INFO] Found ${lowStock.length} low-stock items in active catalog`);

  // Quick test restock
  if (inventoryProdsRes.products[0]) {
    const sample = inventoryProdsRes.products[0];
    const originalStock = sample.stockQuantity ?? 0;
    await updateInventoryAction(sample.id, originalStock + 5);
    const refreshed = await getAdminProductByIdAction(sample.id);
    assert(refreshed.product?.stockQuantity === originalStock + 5, `Restocked item "${sample.title}" from ${originalStock} to ${originalStock + 5}`);
    // Restore
    await updateInventoryAction(sample.id, originalStock);
  }

  // =========================================================================
  // TEST 6: Order Fulfillment & Status Validation
  // =========================================================================
  console.log('\n--- TEST 6: Order Fulfillment & Status Validation ---');

  const allOrdersRes = await getAdminOrdersAction();
  assert(allOrdersRes.success && allOrdersRes.orders.length > 0, `Admin retrieved ${allOrdersRes.orders.length} real orders from database`);

  const { createOrderAction } = await import('../src/lib/orders/actions');

  // Create a brand new order in confirmed state to test full fulfillment flow
  const freshOrderRes = await createOrderAction({
    idempotencyKey: `idemp-flow-${Date.now()}`,
    shippingAddress: {
      id: 'addr-flow-test',
      userId: 'usr-customer-01',
      fullName: 'Vikram Malhotra',
      phone: '+91 98333 44555',
      street: '42, Cyber City, DLF Phase 2',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      country: 'India',
      isDefault: true,
      type: 'Home',
    },
    paymentMethod: 'cod',
    items: [
      {
        productId: 'prod-001',
        quantity: 1,
      },
    ],
  });

  assert(freshOrderRes.success && Boolean(freshOrderRes.order), 'Fresh test order created for status progression');
  const targetOrder = freshOrderRes.order!;

  const orderDetailsRes = await getAdminOrderDetailsAction(targetOrder.id);
  assert(orderDetailsRes.success && Boolean(orderDetailsRes.order), `Admin loaded order details for #${targetOrder.orderNumber}`);

  // Transition: confirmed -> processing
  const procRes = await updateOrderStatusAction(targetOrder.id, 'processing', undefined, 'Order queued in fulfillment warehouse');
  assert(procRes.success && procRes.order?.status === 'processing', 'Order status transitioned to "processing"');

  // Transition: processing -> shipped
  const shipRes = await updateOrderStatusAction(targetOrder.id, 'shipped', 'TRK-IN-987654321', 'Dispatched via BlueDart Priority');
  assert(shipRes.success && shipRes.order?.status === 'shipped', 'Order status transitioned to "shipped" with tracking number');

  // Transition: shipped -> delivered (COD auto-marks payment as paid)
  const deliverRes = await updateOrderStatusAction(targetOrder.id, 'delivered');
  assert(deliverRes.success && deliverRes.order?.status === 'delivered', 'Order status transitioned to "delivered"');
  assert(deliverRes.order?.paymentStatus === 'paid', 'COD order auto-marked as "paid" on delivery');

  // Attempt invalid transition: cannot change delivered order
  const invalidAfterDelivered = await updateOrderStatusAction(targetOrder.id, 'processing');
  assert(!invalidAfterDelivered.success, 'Validation blocks modifying a delivered order');

  // Test cancellation and inventory restoration on second test order
  const prodBeforeCancel = await getAdminProductByIdAction('prod-002');
  const preCancelStock = prodBeforeCancel.product?.stockQuantity || 0;

  const cancelOrderRes = await createOrderAction({
    idempotencyKey: `idemp-cancel-${Date.now()}`,
    shippingAddress: {
      id: 'addr-cancel-test',
      userId: 'usr-customer-02',
      fullName: 'Priya Patel',
      phone: '+91 98112 34567',
      street: 'Flat 402, High Point Apts',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true,
      type: 'Home',
    },
    paymentMethod: 'cod',
    items: [
      {
        productId: 'prod-002',
        quantity: 2,
      },
    ],
  });

  const cancelTarget = cancelOrderRes.order!;
  const cancelRes = await updateOrderStatusAction(cancelTarget.id, 'cancelled', undefined, 'Customer requested cancellation prior to dispatch');
  assert(cancelRes.success && cancelRes.order?.status === 'cancelled', 'Order cancelled with administrative reason');

  const prodAfterCancel = await getAdminProductByIdAction('prod-002');
  const postCancelStock = prodAfterCancel.product?.stockQuantity || 0;
  assert(postCancelStock === preCancelStock + 2, `Stock restored by +2 units upon cancellation (${preCancelStock} -> ${postCancelStock})`);

  // Attempt invalid transition: cannot change cancelled order
  const invalidAfterCancel = await updateOrderStatusAction(cancelTarget.id, 'delivered');
  assert(!invalidAfterCancel.success, 'Validation blocks transitioning a cancelled order to delivered');

  // =========================================================================
  // TEST 7: Customer Directory & PII Masking
  // =========================================================================
  console.log('\n--- TEST 7: Customer Directory & PII Masking ---');

  const customersRes = await getAdminCustomersAction();
  assert(customersRes.success && customersRes.customers.length > 0, `Admin retrieved ${customersRes.customers.length} customer records`);

  if (customersRes.customers.length > 0) {
    const sampleCustomer = customersRes.customers[0];
    assert(sampleCustomer.email.includes('*'), `Customer email is privacy-masked for PII compliance: ${sampleCustomer.email}`);
    assert(typeof sampleCustomer.totalSpent === 'number', `Customer total spent calculated: ₹${sampleCustomer.totalSpent}`);
    assert(typeof sampleCustomer.ordersCount === 'number', `Customer orders count tracked: ${sampleCustomer.ordersCount}`);
  }

  // =========================================================================
  // TEST 8: Coupon Management Lifecycle
  // =========================================================================
  console.log('\n--- TEST 8: Coupon Management Lifecycle ---');

  const couponCode = `PHASE7PROMO${Date.now().toString().slice(-4)}`;
  const newCouponInput: CreateCouponInput = {
    code: couponCode,
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1499,
    maxDiscountAmount: 500,
    usageLimit: 100,
    isActive: true,
  };

  // Create
  const createCpnRes = await createCouponAction(newCouponInput);
  assert(createCpnRes.success && Boolean(createCpnRes.coupon), `Created promotional coupon "${couponCode}"`);
  const createdCouponId = createCpnRes.coupon?.id || '';

  // Toggle Active
  const toggleCpnRes = await toggleCouponStatusAction(createdCouponId, false);
  assert(toggleCpnRes.success && toggleCpnRes.coupon?.isActive === false, 'Coupon toggled to inactive');

  // Re-toggle Active
  const toggleCpnRes2 = await toggleCouponStatusAction(createdCouponId, true);
  assert(toggleCpnRes2.success && toggleCpnRes2.coupon?.isActive === true, 'Coupon re-activated');

  // List
  const listCpnsRes = await getAdminCouponsAction();
  assert(listCpnsRes.success && listCpnsRes.coupons.some((c) => c.id === createdCouponId), 'Coupon visible in admin promotions list');

  // Delete
  const deleteCpnRes = await deleteCouponAction(createdCouponId);
  assert(deleteCpnRes.success, 'Coupon deleted successfully');

  // =========================================================================
  // TEST 9: Review Moderation Queue
  // =========================================================================
  console.log('\n--- TEST 9: Review Moderation Queue ---');

  const pendingReviewsRes = await getAdminReviewsAction('all');
  assert(pendingReviewsRes.success && pendingReviewsRes.reviews.length > 0, `Admin retrieved ${pendingReviewsRes.reviews.length} product reviews`);

  if (pendingReviewsRes.reviews.length > 0) {
    const revToMod = pendingReviewsRes.reviews[0];

    // Approve
    const approveRes = await moderateReviewAction(revToMod.id, 'approved');
    assert(approveRes.success && approveRes.review?.status === 'approved', `Review "${revToMod.id}" moderated to "approved"`);

    // Reject
    const rejectRes = await moderateReviewAction(revToMod.id, 'rejected');
    assert(rejectRes.success && rejectRes.review?.status === 'rejected', `Review "${revToMod.id}" moderated to "rejected"`);

    // Re-approve
    await moderateReviewAction(revToMod.id, 'approved');
  }

  // =========================================================================
  // TEST 10: Administrative Audit Logging
  // =========================================================================
  console.log('\n--- TEST 10: Administrative Audit Logging ---');

  const auditLogsRes = await getAdminAuditLogsAction(20);
  assert(auditLogsRes.success && auditLogsRes.logs.length > 0, `Admin audit log retrieved ${auditLogsRes.logs.length} logged actions`);

  if (auditLogsRes.logs.length > 0) {
    const recentLog = auditLogsRes.logs[0];
    assert(Boolean(recentLog.adminEmail), `Audit log records adminEmail: ${recentLog.adminEmail}`);
    assert(Boolean(recentLog.action), `Audit log records action type: ${recentLog.action}`);
    assert(Boolean(recentLog.createdAt), `Audit log records timestamp: ${recentLog.createdAt}`);
    console.log(`[INFO] Latest Admin Action Logged: [${recentLog.action}] on [${recentLog.resourceType}] by ${recentLog.adminEmail}`);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log(`   PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
