import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/security/redirects';

// -----------------------------------------------------------------------------
// Approved Public Routes Whitelist
// Only these routes remain accessible to unauthenticated visitors
// -----------------------------------------------------------------------------
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/admin/login',
  '/api/health',
  '/api/webhooks/razorpay',
  '/terms',
  '/privacy',
  '/contact',
  '/support',
  '/shipping',
  '/returns',
  '/refunds',
  '/track',
  '/robots.txt',
  '/sitemap.xml',
]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Only attempt user check if Supabase has non-placeholder config
  const isRealConfig =
    !supabaseUrl.includes('placeholder.supabase.co') &&
    !supabaseAnonKey.includes('placeholder-anon-key');

  let user = null;
  if (isRealConfig) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Ignore network errors in middleware
    }
  }

  // Check for signed or legacy session cookie
  const demoCookie = request.cookies.get('shopsphere_demo_session');
  let demoUser = null;
  if (demoCookie?.value) {
    try {
      const val = demoCookie.value;
      if (val.includes('.')) {
        // Cryptographically signed session token: base64url(payload).signature
        const [payloadB64] = val.split('.');
        if (payloadB64) {
          const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
          const payload = JSON.parse(jsonStr);
          if (payload && payload.user && (!payload.expiresAt || Date.now() < payload.expiresAt)) {
            demoUser = payload.user;
          }
        }
      } else {
        // Legacy plain JSON cookie format fallback
        demoUser = JSON.parse(val);
      }
    } catch {
      // ignore parse error
    }
  }

  const authenticatedUser = user || demoUser;
  const userRole = demoUser?.role || (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string);
  const { pathname, searchParams } = request.nextUrl;

  // 1. Strict Admin Route Protection (/admin/*)
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';

  if (isAdminRoute) {
    if (isAdminLoginPage) {
      // If already authenticated admin visits /admin/login, redirect to /admin/dashboard
      if (authenticatedUser && userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      // Allow unauthenticated visitors to view /admin/login
      applySecurityHeaders(response);
      return response;
    }

    // All other /admin/* routes require authenticated admin session strictly restricted to store owner
    const userEmail = (authenticatedUser as { email?: string })?.email?.trim().toLowerCase();
    const authorizedAdminEmails = [
      'kmvsubbarao28@gmail.com',
      'admin@shopsphere.dev',
      process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    ].filter(Boolean);
    const isOwnerOrAdmin = userRole === 'admin' && (!userEmail || authorizedAdminEmails.includes(userEmail));

    if (!authenticatedUser || !isOwnerOrAdmin) {
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      if (authenticatedUser && !isOwnerOrAdmin) {
        redirectUrl.searchParams.set('error', 'unauthorized-admin');
      }
      const redirectResponse = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }

    applySecurityHeaders(response);
    return response;
  }

  // 2. Authentication Pages Handling (/auth/login, /auth/register, etc.)
  const isAuthPage =
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/verify-email' ||
    pathname === '/auth/forgot-password' ||
    pathname === '/auth/reset-password';

  if (isAuthPage) {
    // If already authenticated customer visits /auth/login or /auth/register, redirect to destination or home
    if (authenticatedUser) {
      const redirectParam = searchParams.get('redirect');
      const destination = sanitizeRedirectPath(redirectParam, '/');
      const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }

    // Unauthenticated visitors are allowed to access auth pages
    applySecurityHeaders(response);
    return response;
  }

  // 3. Whitelisted Public Informational Pages & APIs
  const isPublicPage = PUBLIC_PATHS.has(pathname);
  if (isPublicPage) {
    applySecurityHeaders(response);
    return response;
  }

  // Check account suspension status for protected routes
  const isSuspended =
    demoUser?.status === 'suspended' ||
    Boolean(
      (user as unknown as { banned_until?: string })?.banned_until &&
        new Date((user as unknown as { banned_until: string }).banned_until) > new Date()
    );

  if (authenticatedUser && isSuspended) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('error', 'account-suspended');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.delete('shopsphere_demo_session');
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // Check email verification status for customer accounts
  const isEmailUnconfirmed =
    userRole !== 'admin' &&
    ((user && !user.email_confirmed_at && !(user as any).confirmed_at) ||
      (demoUser && demoUser.isVerified === false));

  if (authenticatedUser && isEmailUnconfirmed) {
    const customerEmail = user?.email || demoUser?.email || '';
    const redirectUrl = new URL('/auth/verify-email', request.url);
    if (customerEmail) {
      redirectUrl.searchParams.set('email', customerEmail);
    }
    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // 4. Default Deny: ALL other pages require an authenticated session
  // (Includes storefront homepage '/', '/products', '/cart', '/checkout', '/account', '/track', '/wishlist')
  if (!authenticatedUser) {
    const redirectUrl = new URL('/auth/login', request.url);
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirect', pathname);
    }
    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // Authenticated user accessing a protected route
  applySecurityHeaders(response);
  return response;
}

/**
 * Injects anti-cache and security headers into all responses
 * Strictly prevents bfcache from restoring protected content after logout
 */
function applySecurityHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/media assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
