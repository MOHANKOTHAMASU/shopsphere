// -----------------------------------------------------------------------------
// scripts/test-product-video-and-session-isolation.ts
// Automated Test Suite for Product Demonstration Videos & Admin/Customer Session Isolation
// -----------------------------------------------------------------------------

import { parseVideoUrl, isValidVideoUrl, extractYouTubeId, extractVimeoId } from '../src/lib/utils/video';
import {
  CUSTOMER_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  DEMO_USERS,
  type DemoUserSession,
} from '../src/lib/auth/demo-users';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
} from '../src/lib/auth/session-security';
import {
  setDemoUserSession,
  getDemoUserAction,
  clearDemoUserSession,
} from '../src/lib/auth/actions';
import { BUDGET_SEED_PRODUCTS } from '../src/data/seed-products-budget';
import { SUPPLEMENTARY_SEED_PRODUCTS } from '../src/data/seed-products-supplement';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 SHOPSPHERE: PRODUCT VIDEO & SESSION ISOLATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. PRODUCT DEMO VIDEO URL PARSING & SECURITY
  // ---------------------------------------------------------------------------
  console.log('▶ TEST GROUP 1: Product Video URL Parsing & Validation');

  const standardYt = parseVideoUrl('https://www.youtube.com/watch?v=kY3jXq3ZzF0');
  assert(
    standardYt.isValid && standardYt.type === 'youtube' && standardYt.videoId === 'kY3jXq3ZzF0',
    'Standard YouTube watch URL parsed correctly',
    JSON.stringify(standardYt)
  );
  assert(
    standardYt.embedUrl?.includes('youtube-nocookie.com/embed/kY3jXq3ZzF0'),
    'YouTube embed uses privacy-preserving youtube-nocookie.com'
  );

  const shortYt = parseVideoUrl('https://youtu.be/J7xZlq8_sC0');
  assert(
    shortYt.isValid && shortYt.type === 'youtube' && shortYt.videoId === 'J7xZlq8_sC0',
    'youtu.be short link parsed correctly'
  );

  const shortsYt = parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
  assert(
    shortsYt.isValid && shortsYt.type === 'youtube' && shortsYt.videoId === 'dQw4w9WgXcQ',
    'YouTube Shorts URL parsed correctly'
  );

  const vimeo = parseVideoUrl('https://vimeo.com/76979871');
  assert(
    vimeo.isValid && vimeo.type === 'vimeo' && vimeo.videoId === '76979871',
    'Vimeo video URL parsed correctly'
  );

  const directMp4 = parseVideoUrl('https://cdn.shopsphere.dev/media/car-mat-demo.mp4');
  assert(
    directMp4.isValid && directMp4.type === 'mp4',
    'Direct MP4 CDN video URL parsed correctly'
  );

  const invalidUrl = parseVideoUrl('https://random-site.com/video.html');
  assert(!invalidUrl.isValid, 'Non-video webpage correctly marked invalid');

  const emptyUrl = parseVideoUrl('');
  assert(!emptyUrl.isValid, 'Empty URL safely handled');

  // ---------------------------------------------------------------------------
  // 2. PRODUCT VIDEO CLEANUP & CAPABILITY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n▶ TEST GROUP 2: Video Removal & Dynamic Support Verification');

  // Amazon Basics Silicone Dashboard Gel Mat
  const dashMat = BUDGET_SEED_PRODUCTS.find((p) => p.sku === 'AB-DM-SL-BLK');
  assert(Boolean(dashMat), 'Found Amazon Basics Car Dashboard Gel Mat product');
  assert(
    dashMat?.videoUrl === undefined,
    'Unwanted placeholder YouTube video was removed from Car Dashboard Gel Mat'
  );

  // Dynamic Video Addition Check (simulating Admin adding an authentic video)
  const productWithVideo = {
    ...dashMat!,
    videoUrl: 'https://cdn.shopsphere.dev/media/verified-gel-mat-demo.mp4',
    videoType: 'mp4' as const,
    videoTitle: 'Verified Demonstration of Dashboard Gel Mat',
  };
  assert(
    isValidVideoUrl(productWithVideo.videoUrl),
    'Custom product demonstration video validates cleanly when added by admin'
  );

  // Samsung Galaxy S24 Ultra & LG Products
  const s24 = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'SAM-S24U-256-GRY');
  assert(s24?.videoUrl === undefined, 'Placeholder YouTube video removed from Samsung S24 Ultra');

  const lgFridge = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'LG-REF-242L-SS');
  assert(lgFridge?.videoUrl === undefined, 'Placeholder YouTube video removed from LG Refrigerator');

  const lgWm = SUPPLEMENTARY_SEED_PRODUCTS.find((p) => p.sku === 'LG-WM-8KG-FHM-BLK');
  assert(lgWm?.videoUrl === undefined, 'Placeholder YouTube video removed from LG Washing Machine');

  // ---------------------------------------------------------------------------
  // 3. ADMIN VS. CUSTOMER SESSION ISOLATION & COOKIE SEPARATION
  // ---------------------------------------------------------------------------
  console.log('\n▶ TEST GROUP 3: Admin vs. Customer Session Isolation');

  assert(
    CUSTOMER_SESSION_COOKIE !== ADMIN_SESSION_COOKIE,
    'Customer cookie and Admin cookie have strictly different names'
  );

  const testCustomer: DemoUserSession = {
    id: 'usr-cust-k43413889',
    email: 'k43413889@gmail.com',
    full_name: 'K43413889',
    role: 'customer',
    phone: '+91 98765 43210',
  };

  const testAdmin: DemoUserSession = {
    id: 'usr-admin-master',
    email: 'kmvsubbarao28@gmail.com',
    full_name: 'Store Administrator',
    role: 'admin',
    phone: '+91 98765 43210',
  };

  // Step 3.1: Customer logs in
  await setDemoUserSession(testCustomer);
  const activeCustomer = await getDemoUserAction('customer');
  assert(
    activeCustomer?.email === 'k43413889@gmail.com' && activeCustomer?.role === 'customer',
    'Customer session successfully established for k43413889@gmail.com'
  );

  // Step 3.2: Admin logs in (simulating navigating to /admin/login)
  await setDemoUserSession(testAdmin);
  const activeAdmin = await getDemoUserAction('admin');
  assert(
    activeAdmin?.email === 'kmvsubbarao28@gmail.com' && activeAdmin?.role === 'admin',
    'Admin session successfully established for kmvsubbarao28@gmail.com'
  );

  // Step 3.3: Verify customer session was NOT destroyed by Admin login!
  const customerAfterAdminLogin = await getDemoUserAction('customer');
  assert(
    customerAfterAdminLogin?.email === 'k43413889@gmail.com',
    'Customer session remained 100% INTACT after admin logged in (No Cookie Clobbering)'
  );

  // Step 3.4: Admin logs out (AdminHeader.tsx calls adminSignOutAction)
  await clearDemoUserSession('admin');
  const adminAfterLogout = await getDemoUserAction('admin');
  assert(adminAfterLogout === null, 'Admin session successfully cleared on admin logout');

  // Step 3.5: Customer session MUST STILL BE INTACT!
  const customerAfterAdminLogout = await getDemoUserAction('customer');
  assert(
    customerAfterAdminLogout?.email === 'k43413889@gmail.com',
    'Customer session remained 100% INTACT after admin logged out (Bug Permanently Fixed)'
  );

  // Step 3.6: Customer logs out
  await clearDemoUserSession('customer');
  const customerAfterLogout = await getDemoUserAction('customer');
  assert(customerAfterLogout === null, 'Customer session successfully cleared on customer logout');

  // ---------------------------------------------------------------------------
  // 4. HMAC SIGNATURE TAMPER RESISTANCE
  // ---------------------------------------------------------------------------
  console.log('\n▶ TEST GROUP 4: HMAC Signed Token Verification');

  const validToken = createSignedSessionToken(testCustomer, 3600);
  const decodedValid = verifySignedSessionToken(validToken);
  assert(
    decodedValid?.email === 'k43413889@gmail.com',
    'Valid signed session token decoded with correct user email'
  );

  const tamperedToken = validToken.slice(0, -4) + 'abcd';
  const decodedTampered = verifySignedSessionToken(tamperedToken);
  assert(decodedTampered === null, 'Tampered session token strictly rejected by HMAC verification');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failures)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

