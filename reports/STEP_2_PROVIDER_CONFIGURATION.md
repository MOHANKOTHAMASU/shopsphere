# ShopSphere — Step 2: Provider Configuration & Backend OTP Report

**Date:** October 30, 2026  
**Document Path:** `reports/STEP_2_PROVIDER_CONFIGURATION.md`  
**Purpose:** Technical specification, backend provider audit, environment variable definitions, and step-by-step external setup guide for Real Email Verification & Mobile SMS OTP delivery.

---

## 1. Backend & Provider Audit

### 1.1 Existing Authentication Backend
- **Core Framework:** **Next.js 16.4.2** with App Router, React 19.3.0, and Turbopack.
- **Primary Auth Provider:** **Supabase Authentication** (`@supabase/ssr` & `@supabase/supabase-js`), configured against live project `https://stynwsnmkxxmkpxdhpus.supabase.co`.
- **Local Fallback:** In-memory store and HTTP-only session cookie (`shopsphere_demo_session`) providing offline resilience.

### 1.2 Configured Email Provider Status
- **Current Mailer:** Default Supabase built-in transaction mailer.
- **Provider Status:** Active, but subject to Supabase's free-tier rate limits (~3-4 emails per hour, which previously generated `over_email_send_rate_limit`).
- **Production Recommendation:** Configure Custom SMTP (e.g., [Resend](https://resend.com) or [SendGrid](https://sendgrid.com)) in the Supabase Dashboard under `Project Settings -> Authentication -> SMTP Settings`.

### 1.3 Configured SMS Provider Status
- **Current SMS Provider:** **None configured.**
- **Provider Status:** Live API test to Supabase returns `HTTP 400: Unsupported phone provider`. No Twilio keys exist in `.env` or `.env.local`.
- **Selected Provider for Real SMS:** **Twilio REST API** (directly supported by ShopSphere server action) or **Supabase Native Phone Provider** (Twilio/MessageBird/Vonage configured in the Supabase Dashboard).

### 1.4 API Integration Inspection
- **Email Integration:** Verified. `sendEmailVerification` and `actions.ts:signUpAction` pass `emailRedirectTo` pointing to `/auth/callback?next=/auth/login?verified=true`. The callback route securely handles PKCE `code` exchange and token hashes (`token_hash` & `type=signup`).
- **SMS Integration:** Verified. `sms-service.ts` uses the official Twilio Messages REST API (`POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`) with HTTP Basic Authentication, E.164 phone normalization, and automatic fallback to Supabase `supabase.auth.signInWithOtp` when configured.
- **Security Check:** OTP codes are **never** logged to server console or exposed in client bundles. All codes are hashed using HMAC-SHA256 and compared using constant-time buffers (`crypto.timingSafeEqual`).

---

## 2. Backend Security & Safeguards Implemented

| Security Dimension | Implementation in Code |
| :--- | :--- |
| **Server-Side Generation** | Cryptographically secure 6-digit numeric OTP via `crypto.randomInt(100000, 999999)`. |
| **No Plain-Text Storage** | Stored as HMAC-SHA256 hash with salt secret (`hashOtp(otp, phone)`). |
| **Expiration Window** | OTP challenge expires strictly after 10–15 minutes. |
| **Resend Cooldown** | 30-second cooldown rate limit enforced for SMS; 60 seconds for email. |
| **Brute-Force Protection** | Maximum 5 attempts allowed. Challenge is automatically revoked after 5 failed attempts. |
| **Timing-Attack Defense** | Uses `crypto.timingSafeEqual(expected, input)` to prevent side-channel timing attacks. |
| **Zero Log Exposure** | Tokens and OTPs are masked in server logs (`(code hidden)`). |
| **Server Verification** | Login sessions are granted **only** after the SMS OTP or Supabase Auth API confirms validity. |

---

## 3. Environment Configuration (`.env.example`)

The template file [`.env.example`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.example) has been updated with the required provider variable names:

```bash
# -----------------------------------------------------------------------------
# Mobile SMS Gateway (Twilio REST API)
# -----------------------------------------------------------------------------
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=

# -----------------------------------------------------------------------------
# Production Custom SMTP Email Provider (Optional / Recommended)
# -----------------------------------------------------------------------------
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## 4. Exact External Dashboard Setup Required

### Step A: Twilio SMS Setup (For Real SMS OTP Delivery)
1. **Sign In**: Navigate to [https://console.twilio.com/](https://console.twilio.com/).
2. **Retrieve API Keys**: On the main dashboard under **Account Info**:
   - Copy your **Account SID** (`ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
   - Copy your **Auth Token** (`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
3. **Get Phone Number**: In the left sidebar, navigate to **Phone Numbers** ➔ **Manage** ➔ **Active numbers** (or click **Get your first Twilio phone number**). Copy your assigned phone number in E.164 format (e.g. `+12055550199`).
4. **Verify Test Recipient Number** (If using Twilio Free Trial):
   - Navigate to: **Phone Numbers** ➔ **Manage** ➔ **Verified Caller IDs** ([direct link](https://console.twilio.com/us1/develop/phone-numbers/manage/verified-caller-ids)).
   - Click **Add a new caller ID** and verify your mobile number (e.g. `+919652788899`).
5. **Add to Project**: Paste these 3 credentials into your local [`.env.local`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.local).

### Step B: Supabase Dashboard Setup (For Email Verification Redirects)
1. Open your project dashboard: [https://supabase.com/dashboard/project/stynwsnmkxxmkpxdhpus](https://supabase.com/dashboard/project/stynwsnmkxxmkpxdhpus)
2. Go to **Authentication** (shield icon in left sidebar) ➔ **URL Configuration**.
3. Set **Site URL** to: `http://localhost:3000` (or your production URL).
4. Under **Redirect URLs**, click **Add URL** and add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback*`
   - `https://shopsphere-xi-gilt.vercel.app/auth/callback*`
5. Click **Save Changes**.

---

## 5. Verification Status

- **Automated Authentication Tests**: 21/21 Tests Passed (`scripts/test-authentication-flow.ts`).
- **Master Regression Suite**: 71/71 Tests Passed (`scripts/test-complete-audit.ts`).
- **Production Build**: 53/53 Routes compiled successfully via Next.js Turbopack.
- **Live Provider Testing**:
  - Email verification URL dispatch: **PASS** (Supabase Auth).
  - Real SMS OTP cellular dispatch: **BLOCKED** on Twilio credentials in `.env.local`.

