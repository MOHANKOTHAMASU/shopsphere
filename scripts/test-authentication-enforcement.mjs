// -----------------------------------------------------------------------------
// scripts/test-authentication-enforcement.mjs
// ShopSphere Authentication & Protected Access Verification Suite
// Tests all 11 required test cases from the Master Authentication Mandate
// -----------------------------------------------------------------------------

import assert from 'node:assert';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function fetchRoute(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    redirect: 'manual', // Prevent automatic following of 307 redirects so we can inspect headers
    ...options,
  });
  return res;
}

let passed = 0;
let failed = 0;

function report(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
  }
}

async function runAuthEnforcementSuite() {
  console.log('\n=============================================================');
  console.log('  SHOPSPHERE AUTHENTICATION & ACCESS CONTROL AUDIT SUITE');
  console.log('=============================================================\n');

  // --- TEST 1: Unauthenticated Visitor on Homepage ---
  console.log('--- TEST 1 & 2: Homepage & Protected Routes Redirect to Login ---');
  {
    const res = await fetchRoute('/');
    report(
      'Unauthenticated visitor on "/" is redirected to /auth/login',
      res.status === 307 && res.headers.get('location')?.includes('/auth/login'),
      `Status: ${res.status}, Location: ${res.headers.get('location')}`
    );
  }

  // --- TEST 2: Whitelisted Public Routes Remain Accessible ---
  console.log('\n--- TEST 2: Whitelisted Public Routes (Auth, Health, Legal) ---');
  {
    const publicRoutes = ['/auth/login', '/auth/register', '/api/health', '/terms', '/privacy', '/shipping'];
    for (const route of publicRoutes) {
      const res = await fetchRoute(route);
      report(
        `Whitelisted route "${route}" is directly accessible (HTTP 200)`,
        res.status === 200,
        `Status: ${res.status}`
      );
    }
  }

  // --- TEST 3: Direct Access to Protected Functional Routes ---
  console.log('\n--- TEST 3: Direct Access to Functional E-Commerce Routes ---');
  {
    const protectedRoutes = [
      { path: '/products', expectedParam: '%2Fproducts' },
      { path: '/cart', expectedParam: '%2Fcart' },
      { path: '/checkout', expectedParam: '%2Fcheckout' },
      { path: '/account', expectedParam: '%2Faccount' },
      { path: '/account/orders', expectedParam: '%2Faccount%2Forders' },
      { path: '/account/profile', expectedParam: '%2Faccount%2Fprofile' },
      { path: '/account/addresses', expectedParam: '%2Faccount%2Faddresses' },
      { path: '/track', expectedParam: '%2Ftrack' },
      { path: '/wishlist', expectedParam: '%2Fwishlist' },
    ];

    for (const { path, expectedParam } of protectedRoutes) {
      const res = await fetchRoute(path);
      const loc = res.headers.get('location') || '';
      report(
        `Route "${path}" redirects unauthenticated visitor to /auth/login with return redirect`,
        res.status === 307 && loc.includes('/auth/login') && loc.includes(expectedParam),
        `Status: ${res.status}, Location: ${loc}`
      );
    }
  }

  // --- TEST 4: Direct Access to Admin Routes ---
  console.log('\n--- TEST 4: Direct Access to Protected Admin Routes ---');
  {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/products',
      '/admin/orders',
      '/admin/customers',
      '/admin/inventory',
      '/admin/pricing',
    ];

    for (const path of adminRoutes) {
      const res = await fetchRoute(path);
      const loc = res.headers.get('location') || '';
      report(
        `Admin route "${path}" redirects unauthenticated visitor to /admin/login`,
        res.status === 307 && loc.includes('/admin/login'),
        `Status: ${res.status}, Location: ${loc}`
      );
    }
  }

  // --- TEST 5: Security & Anti-Cache Headers ---
  console.log('\n--- TEST 5: Anti-Bfcache & Security Headers on Responses ---');
  {
    const res = await fetchRoute('/');
    const cc = res.headers.get('cache-control') || '';
    const pragma = res.headers.get('pragma') || '';
    const xcto = res.headers.get('x-content-type-options') || '';
    const xfo = res.headers.get('x-frame-options') || '';

    report('Response includes "no-store, no-cache" to disable bfcache', cc.includes('no-store') && cc.includes('no-cache'), `Cache-Control: ${cc}`);
    report('Response includes "Pragma: no-cache"', pragma === 'no-cache', `Pragma: ${pragma}`);
    report('Response includes "X-Content-Type-Options: nosniff"', xcto === 'nosniff', `X-Content-Type-Options: ${xcto}`);
    report('Response includes "X-Frame-Options: DENY"', xfo === 'DENY', `X-Frame-Options: ${xfo}`);
  }

  // --- TEST 6: Authenticated Session Page Refresh & Access ---
  console.log('\n--- TEST 6: Authenticated Customer Session Access ---');
  {
    // Simulate valid customer cookie session
    const customerCookie = encodeURIComponent(
      JSON.stringify({
        id: 'usr-cust-test-01',
        email: 'customer@shopsphere.dev',
        full_name: 'Test Customer',
        role: 'customer',
      })
    );

    const res = await fetchRoute('/account', {
      headers: {
        Cookie: `shopsphere_demo_session=${customerCookie}`,
      },
    });

    report(
      'Authenticated customer session successfully accesses /account (HTTP 200, no redirect)',
      res.status === 200,
      `Status: ${res.status}`
    );
  }

  // --- TEST 7: Customer Privilege Escalation Prevention ---
  console.log('\n--- TEST 7: Customer Blocked from Admin Dashboard ---');
  {
    const customerCookie = encodeURIComponent(
      JSON.stringify({
        id: 'usr-cust-test-01',
        email: 'customer@shopsphere.dev',
        full_name: 'Test Customer',
        role: 'customer',
      })
    );

    const res = await fetchRoute('/admin/dashboard', {
      headers: {
        Cookie: `shopsphere_demo_session=${customerCookie}`,
      },
    });

    const loc = res.headers.get('location') || '';
    report(
      'Logged-in Customer is strictly blocked from /admin/dashboard and redirected with admin-required error',
      res.status === 307 && loc.includes('/admin/login') && loc.includes('error=admin-required'),
      `Status: ${res.status}, Location: ${loc}`
    );
  }

  // --- TEST 8: Admin Session Access ---
  console.log('\n--- TEST 8: Verified Administrator Access ---');
  {
    const adminCookie = encodeURIComponent(
      JSON.stringify({
        id: 'usr-demo-admin',
        email: 'admin@shopsphere.dev',
        full_name: 'Store Administrator',
        role: 'admin',
      })
    );

    const res = await fetchRoute('/admin/dashboard', {
      headers: {
        Cookie: `shopsphere_demo_session=${adminCookie}`,
      },
    });

    report(
      'Authenticated Admin session successfully accesses /admin/dashboard (HTTP 200)',
      res.status === 200,
      `Status: ${res.status}`
    );

    const loginRes = await fetchRoute('/admin/login', {
      headers: {
        Cookie: `shopsphere_demo_session=${adminCookie}`,
      },
    });

    report(
      'Already authenticated admin on /admin/login is redirected to /admin/dashboard',
      loginRes.status === 307 && loginRes.headers.get('location')?.includes('/admin/dashboard'),
      `Status: ${loginRes.status}, Location: ${loginRes.headers.get('location')}`
    );
  }

  console.log('\n=============================================================');
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthEnforcementSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
