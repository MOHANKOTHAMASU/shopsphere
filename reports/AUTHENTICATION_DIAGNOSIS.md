# ShopSphere — Authentication System Diagnosis & Root Cause Analysis

**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Engineer & Application Security Specialist  
**Document Path:** `reports/AUTHENTICATION_DIAGNOSIS.md`  

---

## 1. Technical Stack & Environment Inspection

| Dimension | Implementation Details |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16.4.2** (App Router, Turbopack, React Server Components) |
| **Frontend Runtime** | **React 19.3.0** with TypeScript 5.x and Tailwind CSS v4 |
| **Backend Architecture** | Next.js Server Actions (`'use server'`) & API Route Handlers |
| **Database** | **Supabase PostgreSQL** (`stynwsnmkxxmkpxdhpus.supabase.co`) with 13 relational tables and Row Level Security (RLS) |
| **Authentication System** | **Supabase Auth** (`@supabase/ssr` v0.12.7, `@supabase/supabase-js` v2.118.0) paired with a fallback demo session store (`shopsphere_demo_session` HTTP-only cookie) |
| **Deployment Platform** | Node.js v24.21.0 on Windows (x64), configured for Vercel/Node container deployment |
| **Current Environment Variables** | - `NEXT_PUBLIC_APP_URL=http://localhost:3000`<br>- `NEXT_PUBLIC_SUPABASE_URL=https://stynwsnmkxxmkpxdhpus.supabase.co`<br>- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publish_...` (Publishable key)<br>- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publish_...`<br>- `SUPABASE_SERVICE_ROLE_KEY=placeholder_...` (**Placeholder string**)<br>- `NEXT_PUBLIC_RAZORPAY_KEY_ID=...`<br>- `RAZORPAY_KEY_SECRET=...` |

---

## 2. Existing Authentication Code Audit

### A. Customer Registration (`src/app/(customer)/auth/register/page.tsx` & `src/lib/auth/actions.ts:signUpAction`)
- When a new customer registers, `signUpAction` calls `supabase.auth.signUp(...)`.
- **Defect 1 (Rate Limit Auto-Bypass):** If Supabase returns HTTP 429 (`over_email_send_rate_limit`), the code auto-activates the account with `isVerified: true` and logs the user into a demo session, bypassing mandatory email confirmation.
- **Defect 2 (UI Assumption):** If `signUp` succeeds with `{ user, session: null }` (awaiting email verification), the registration UI still redirects to `/account` or assumes completion rather than routing the customer to an explicit "Check your email" confirmation screen.

### B. Customer Login (`src/app/(customer)/auth/login/page.tsx` & `src/lib/auth/actions.ts:signInAction`)
- Currently presents two separate radio/tab options: "Mobile OTP" or "Email & Password".
- **Defect 3 (Missing 2FA Login Requirement):** Phase 3 requires customers to log in with verified **Email + Password**, verify that email confirmation has been achieved, and then require a 6-digit **Mobile SMS OTP** dispatched to their registered phone number before the session is granted.
- **Defect 4 (Unverified Phone Number Acceptance):** The current Phone OTP tab allows any unauthenticated visitor to type an arbitrary phone number and immediately claims an OTP was sent, without checking user identity or password.

### C. Phone OTP Dispatch & Verification (`src/lib/auth/phone-actions.ts`)
- In `sendPhoneOtpAction`:
  ```typescript
  // Generate 6-digit OTP
  const isDev = isDevOtpAllowed();
  const otp = isDev ? DEVELOPMENT_TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();
  phoneOtpStore.set(normalized, { ... });
  console.log(`[ShopSphere Phone Auth] OTP for ${normalized}: ${otp}`);
  ```
- **Defect 5 (Zero SMS Provider Integration):** The server action only saves the OTP to a Node process `Map` (`phoneOtpStore`) and prints it to the server console. It **never** invokes Supabase Phone Auth (`supabase.auth.signInWithOtp({ phone })`) nor any SMS Gateway API (Twilio, Vonage, Brevo SMS).
- **Defect 6 (Exposing Test OTP to Client):** In development mode, `sendPhoneOtpAction` returns `{ testOtp: otp }` directly to the client JSON payload, which defeats security verification.

### D. Email Verification Callback Handler (`src/app/auth/callback/route.ts`)
- The route handler currently contains:
  ```typescript
  const code = searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth-code-error`);
  ```
- **Defect 7 (Ignored Token Hash & Type):** Standard Supabase email confirmation links frequently supply `token_hash` and `type=signup` (or `type=email`). Because the handler only checks for `code`, email confirmation links land directly on `/auth/login?error=auth-code-error`.

### E. Session & Route Middleware (`src/middleware.ts`)
- **Defect 8 (Unverified User Route Bypass):** Middleware checks `if (!authenticatedUser)` and redirects to `/auth/login`, but does not enforce that `user.email_confirmed_at != null` or `session.isVerified !== false` for customer accounts accessing `/account`, `/checkout`, `/orders`.

---

## 3. Live API Responses & Provider Status

### Diagnostic Probe Results (`scripts/test-supabase-auth.ts`)

```
Supabase URL: https://stynwsnmkxxmkpxdhpus.supabase.co
Anon key: Configured (Publishable key format)
Service role key: Placeholder ("placeholder_service_role_key...")

1. Supabase auth.admin API:
   Result: "Invalid API key" (due to placeholder SUPABASE_SERVICE_ROLE_KEY)

2. Supabase Phone Auth (signInWithOtp with phone):
   Result: HTTP 400 "Unsupported phone provider"
   Cause: No SMS Provider (Twilio/MessageBird/Vonage) is enabled in Supabase Authentication Dashboard.

3. Supabase Email Auth (signUp with standard email):
   Result: Success (Created user: shopsphere.tester... with confirmed_at: undefined, session: null)
   Email confirmation dispatch was triggered, but delivery is subject to Supabase free-tier built-in SMTP quotas.
```

---

## 4. Root Causes Summary

1. **Mobile SMS Non-Delivery:**
   - Primary: `phone-actions.ts` had a local in-memory mock that never triggered real SMS dispatch.
   - Provider: Supabase project `stynwsnmkxxmkpxdhpus` has no SMS provider configured (`HTTP 400 Unsupported phone provider`).
   - Environment: No Twilio, Vonage, or direct SMS credentials exist in `.env` / `.env.local`.

2. **Email Verification Failures:**
   - Callback Bug: `src/app/auth/callback/route.ts` ignores `token_hash` / `type=signup`, failing legitimate confirmation clicks.
   - Quota Limitation: Supabase default mailer has strict rate limits (`over_email_send_rate_limit`), which triggered an automatic bypass in existing code.
   - Flow Architecture: Customers were redirected to `/account` before email confirmation was confirmed by Supabase.

---

## 5. Architectural Action Plan

1. **Email Verification (Phase 2):**
   - Fix `src/app/auth/callback/route.ts` to support both PKCE `code` and `token_hash` + `type` (`verifyOtp`).
   - Add explicit email verification status check in `actions.ts:signInAction` and `middleware.ts`.
   - Implement resend email verification with rate-limiting and clear UI feedback.
   - Support custom SMTP / provider integration via environment configuration.

2. **Real Mobile SMS OTP Flow (Phase 3 & 4):**
   - Re-architect login flow to 2-Factor:
     1. Customer enters verified email & password.
     2. Backend verifies email credentials and checks `email_confirmed_at`.
     3. Backend retrieves or validates the customer's registered phone in international format (`+91...`).
     4. Backend dispatches 6-digit OTP via configured provider (Twilio REST API direct or Supabase Phone Auth).
     5. Customer submits 6-digit OTP; backend verifies against the provider or cryptographic hash.
     6. Only after OTP verification succeeds is the authenticated session issued.
   - Provide SMS Gateway integration (Twilio / SMS provider adapter) with full rate limiting, cooldown, and attempt limits.
   - Provide clear instructions for setting up Twilio / Supabase Phone Auth credentials.

3. **Secure Authentication Rules (Phase 5):**
   - Enforce mandatory email verification before `/account` / `/checkout` access.
   - Never expose secrets, service-role keys, or OTPs in client bundles or responses.
