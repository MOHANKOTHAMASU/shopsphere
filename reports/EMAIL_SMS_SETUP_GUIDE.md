# ShopSphere — Step 2: Email Verification & Real Mobile SMS OTP Setup Guide

**Audience:** Website Owner & Administrator  
**Document Path:** `reports/EMAIL_SMS_SETUP_GUIDE.md`  
**Purpose:** Step-by-step instructions to enable real email verification and genuine SMS OTP delivery to mobile phones.

---

## 1. System Diagnosis & Current Architecture

| Component | Current Status | Notes |
| :--- | :--- | :--- |
| **Backend Framework** | **Next.js 16.4.2** (App Router & Server Actions) | Runs on Node.js with Turbopack |
| **Authentication Provider** | **Supabase Authentication** | Connected to project `stynwsnmkxxmkpxdhpus.supabase.co` |
| **Email Verification** | **Code Complete** / Needs Dashboard Redirect URL & SMTP | Handlers, `/auth/verify-email` portal, and token validation are built |
| **SMS OTP Provider** | **NOT CONFIGURED** | Missing Twilio account credentials and Supabase Phone Auth provider |
| **Why Mobile OTP Fails** | No cellular SMS gateway is connected | Neither Twilio API keys nor Supabase SMS provider are active |

---

## 2. Responsibility Split: What Code Does vs What You Must Do

### A. What Is Already Built in Code (Completed by Assistant):
1. **Complete 2FA Customer Authentication Flow**:
   - Customer submits Email + Password.
   - Server verifies credentials and checks email confirmation status.
   - Server issues a secure 15-minute challenge token and dispatches 6-digit OTP.
   - Customer enters 6-digit code on the verification screen.
   - Server validates the code using constant-time cryptographic HMAC-SHA256 comparison.
2. **Security & Brute-Force Safeguards**:
   - 30-second cooldown rate limit between SMS requests.
   - 60-second cooldown rate limit for verification emails.
   - Maximum 5 attempts before challenge invalidation.
3. **Dedicated UI Pages**:
   - `/auth/login` (Unified 2-Factor Login screen matching your UI).
   - `/auth/verify-email` (Dedicated email confirmation & manual code entry).
   - `/auth/callback` (Handles both PKCE authentication codes and email token hashes).
4. **Twilio REST API & Supabase Gateway Adapters**:
   - Ready to instantly deliver live SMS as soon as provider credentials are set.

---

### B. What Requires You to Sign In to External Accounts:
1. **Twilio Console**: Create an account, generate an API SID & Token, and buy/assign an SMS-capable phone number.
2. **Supabase Dashboard**: Set the Site URL / Redirect URLs, and optionally enable the Phone provider or Custom SMTP.
3. **Your Local `.env.local` File**: Paste the secret API keys (never shared or exposed to the public).

---

## 3. The 3 External Setup Steps in Order

```
[Step 2A: Set up Twilio SMS Gateway] ──► [Step 2B: Configure Supabase Redirects] ──► [Step 2C: Optional Custom SMTP]
      (For Real Mobile SMS OTP)              (For Real Email Verification)                (For High-Volume Email)
```

---

## 4. Step 2A — Setting Up Real Mobile SMS OTP (Twilio)

Because cellular telecom networks charge for SMS delivery, you need a provider account (Twilio is the industry standard and natively supported).

### Exact Menu Paths & Instructions:

#### 1. Create or Sign In to Twilio
- Go to [https://console.twilio.com/](https://console.twilio.com/).
- Sign up for a free trial or log in to your existing account.

#### 2. Get Your Account SID and Auth Token
- From the **Twilio Console Dashboard** (`https://console.twilio.com/`):
- Scroll down to the **Account Info** section.
- Copy your **Account SID** (starts with `AC...`).
- Copy your **Auth Token** (click "Show" to reveal).

#### 3. Get an SMS Phone Number
- In the left navigation menu, go to:  
  **Phone Numbers** ➔ **Manage** ➔ **Buy a number** (or **Active numbers**).
- If on a trial account, click **Get your first Twilio phone number**.
- Note the number in full E.164 format (e.g. `+12055550199`).

#### 4. If Using a Twilio Trial Account (Important):
- Trial accounts require destination numbers to be pre-verified.
- In the left menu, navigate to:  
  **Phone Numbers** ➔ **Manage** ➔ **Verified Caller IDs**  
  (`https://console.twilio.com/us1/develop/phone-numbers/manage/verified-caller-ids`).
- Click **Add a new caller ID**.
- Enter your personal test phone number (e.g. `+919652788899`) and complete the 6-digit verification code call/SMS.

#### 5. Add Credentials to ShopSphere
- Open `.env.local` on your computer.
- Add the following lines at the bottom:
  ```env
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
  TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
  ```
- Save the file.

---

## 5. Step 2B — Configuring Supabase for Email Verification

To ensure confirmation emails link back correctly to your local and production environments:

1. Open your Supabase Project:  
   [https://supabase.com/dashboard/project/stynwsnmkxxmkpxdhpus](https://supabase.com/dashboard/project/stynwsnmkxxmkpxdhpus)
2. In the left navigation sidebar, click on **Authentication** (the user icon with a shield).
3. Click on **URL Configuration** (`/auth/url-configuration`).
4. Set **Site URL**:
   - For local development: `http://localhost:3000`
5. Under **Redirect URLs**, click **Add URL** and add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback*`
   - `https://shopsphere-xi-gilt.vercel.app/auth/callback*`
6. Click **Save Changes**.

---

## 6. Step 2C — (Optional) Configure Custom SMTP for Production Email

The default Supabase free-tier mailer restricts email delivery to **3-4 emails per hour**. To support live customer registration without hitting `over_email_send_rate_limit`:

1. In Supabase, go to: **Project Settings** (gear icon at bottom left) ➔ **Authentication**.
2. Scroll to **SMTP Settings**.
3. Toggle **Enable Custom SMTP**.
4. Enter credentials from any provider such as [Resend](https://resend.com) (free 3,000 emails/mo) or SendGrid:
   - **Sender email**: `noreply@yourdomain.com`
   - **Sender name**: `ShopSphere Support`
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: `re_xxxxxxxxxxxxxxxx`
5. Click **Save**.
