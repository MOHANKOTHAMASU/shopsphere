import { setDemoUserSession } from '../src/lib/auth/actions';
import { getAddressesAction, saveAddressAction } from '../src/lib/addresses/actions';
import { createOrderAction, getCustomerOrdersAction, getOrderDetailsAction } from '../src/lib/orders/actions';
import { revalidateCartAction } from '../src/lib/cart/actions';
import { memoryAddresses, memoryCustomers } from '../src/lib/admin/store';

// Set test environment
process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('================================================================');
  console.log('  SHOPSPHERE: CUSTOMER ISOLATION & CART PERFORMANCE VERIFICATION');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // Verify kmvsubbarao28@gmail.com is NOT pre-registered
  const mohanExists = memoryCustomers.some((c) => c.email === 'kmvsubbarao28@gmail.com');
  assert(!mohanExists, 'kmvsubbarao28@gmail.com is removed as pre-registered account as requested');

  // TEST 1: New customer (venkatesh) has 0 addresses and NEVER receives Mohan's address
  const mockVenkatesh = {
    id: 'usr-cust-venkatesh-789',
    email: 'venkatesh@example.com',
    full_name: 'Venkatesh',
    role: 'customer' as const,
    phone: '+91 91234 56789',
  };

  await setDemoUserSession(mockVenkatesh);

  const initialAddrs = await getAddressesAction();
  assert(
    initialAddrs.success && initialAddrs.addresses.length === 0,
    'New customer "venkatesh" receives 0 saved addresses (strictly isolated from Mohan)'
  );

  // TEST 2: Venkatesh saves a new delivery address
  const saveRes = await saveAddressAction({
    fullName: 'Venkatesh',
    phone: '+91 91234 56789',
    street: '15, Koramangala 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
    country: 'India',
  });
  assert(
    saveRes.success && saveRes.address?.fullName === 'Venkatesh' && saveRes.address?.userId === mockVenkatesh.id,
    'Venkatesh saves their own address tagged with their unique userId'
  );

  // TEST 3: Venkatesh fetches addresses again and sees only their own address
  const venkateshAddrs = await getAddressesAction();
  assert(
    venkateshAddrs.success &&
      venkateshAddrs.addresses.length === 1 &&
      venkateshAddrs.addresses[0].fullName === 'Venkatesh' &&
      venkateshAddrs.addresses[0].phone === '+91 91234 56789',
    'Venkatesh fetches addresses and receives only their own delivery address'
  );

  // TEST 4: Another customer (Customer B) fetches addresses and sees only their own address
  const mockCustomerB = {
    id: 'usr-cust-b-456',
    email: 'customer-b@example.com',
    full_name: 'Customer B',
    role: 'customer' as const,
    phone: '+91 98765 00000',
  };
  await setDemoUserSession(mockCustomerB);

  await saveAddressAction({
    fullName: 'Customer B',
    phone: '+91 98765 00000',
    street: '20, Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    isDefault: true,
    type: 'Home',
  });

  const bAddrs = await getAddressesAction();
  assert(
    bAddrs.success &&
      bAddrs.addresses.every((a) => a.userId === mockCustomerB.id) &&
      !bAddrs.addresses.some((a) => a.fullName === 'Venkatesh'),
    'Customer B sees only their own addresses and never Venkatesh\'s address'
  );

  // TEST 5: Venkatesh places an order with their own address
  await setDemoUserSession(mockVenkatesh);
  const orderRes = await createOrderAction({
    idempotencyKey: `test-order-${Date.now()}`,
    shippingAddress: venkateshAddrs.addresses[0],
    paymentMethod: 'cod',
    items: [
      {
        productId: 'prod-mob-s24-ultra',
        quantity: 1,
      },
    ],
  });

  if (!orderRes.success) {
    console.log('Order error:', orderRes.error);
  } else {
    console.log('Order placed:', orderRes.order?.userId, orderRes.order?.shippingAddress.fullName);
  }

  assert(
    orderRes.success &&
      orderRes.order !== undefined &&
      orderRes.order.userId === mockVenkatesh.id &&
      orderRes.order.shippingAddress.fullName === 'Venkatesh',
    'Order created for Venkatesh has Venkatesh as recipient, not Mohan'
  );

  // TEST 6: Venkatesh order history contains only Venkatesh orders
  const venkateshOrders = await getCustomerOrdersAction();
  assert(
    venkateshOrders.success &&
      venkateshOrders.orders.every((o) => o.userId === mockVenkatesh.id),
    'Customer order history is strictly isolated to the authenticated caller'
  );

  // TEST 7: Cart Revalidation Speed Benchmark (must complete under 500ms)
  const startTime = Date.now();
  const cartReval = await revalidateCartAction([
    { productId: 'prod-mob-s24-ultra', quantity: 1 },
    { productId: 'prod-elec-sony-xm5-silver', quantity: 2 },
    { productId: 'prod-gourmet-vahdam-himalayan-green-tea', quantity: 1 },
  ]);
  const duration = Date.now() - startTime;

  assert(
    cartReval.isValid && cartReval.summary.total > 0 && duration < 500,
    `Cart revalidation is ultra-fast: verified 3 items in ${duration}ms (< 500ms benchmark)`
  );

  console.log('================================================================');
  console.log(`  SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
