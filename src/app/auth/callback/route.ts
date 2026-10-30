import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/security/redirects';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get('next'), '/auth/login?verified=true');

  const supabase = await createClient();

  // 1. PKCE Code exchange flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[ShopSphere Auth Callback] exchangeCodeForSession failed:', error.message);
  }

  // 2. Token Hash verification flow (used in Supabase email confirmation links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[ShopSphere Auth Callback] verifyOtp failed:', error.message);
  }

  // Return to login with error explanation
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth-code-error&message=${encodeURIComponent(
      'Email confirmation link expired or invalid. Please request a new verification email.'
    )}`
  );
}
