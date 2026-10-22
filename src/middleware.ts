import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/security/redirects';

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

  // Check for demo session cookie
  const demoCookie = request.cookies.get('shopsphere_demo_session');
  let demoUser = null;
  if (demoCookie?.value) {
    try {
      demoUser = JSON.parse(demoCookie.value);
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

  if (isAdminRoute && !isAdminLoginPage) {
    if (!authenticatedUser || userRole !== 'admin') {
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      if (authenticatedUser && userRole !== 'admin') {
        redirectUrl.searchParams.set('error', 'admin-required');
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If already authenticated admin visits /admin/login, redirect to /admin/dashboard
  if (isAdminLoginPage && authenticatedUser && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // 2. Protected customer routes: /account, /checkout
  const isProtectedRoute =
    pathname.startsWith('/account') || pathname.startsWith('/checkout');

  if (isProtectedRoute && !authenticatedUser) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If already authenticated customer visits /auth/login or /auth/register, redirect to /account or ?redirect
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/register';
  if (isAuthPage && authenticatedUser) {
    const redirectParam = searchParams.get('redirect');
    const destination = sanitizeRedirectPath(redirectParam, '/account');
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
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
