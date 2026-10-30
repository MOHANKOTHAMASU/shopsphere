# ShopSphere — Step 3: Twilio SMS Integration & Provider Architecture Guide

**Date:** October 30, 2026  
**Document Path:** `reports/STEP_3_TWILIO_SETUP.md`  
**Purpose:** Architecture evaluation, compatibility analysis, Twilio Console instructions, and India-specific telecom requirements.

---

## 1. Provider Compatibility & Architectural Analysis

### 1.1 Compatibility with Existing Authentication Backend
- **Confirmed**: Twilio is 100% compatible with both our **Next.js 16 App Router backend** and our **Supabase Authentication system** (`@supabase/ssr` / `@supabase/supabase-js`).
- Twilio can be operated through two sanctioned, non-conflicting integration patterns:
  1. **Directly inside Supabase Auth** (`Authentication -> Providers -> Phone -> Twilio`).
  2. **Directly via the Twilio Verify API v2** (`TWILIO_VERIFY_SERVICE_SID`) within ShopSphere Server Actions.

---

### 1.2 Should Twilio Be Configured in Supabase Auth or as a Custom Integration?

| Consideration | Option A: Native Supabase Auth Phone Provider | Option B: Direct Twilio Verify API v2 (`TWILIO_VERIFY_SERVICE_SID`) |
| :--- | :--- | :--- |
| **Where Twilio Keys Live** | Entered into Supabase Dashboard | Stored in local/production `.env.local` |
| **OTP Generation & Verification** | Managed entirely by Supabase Auth server | Managed entirely by Twilio Verify API |
| **Duplicate Storage Risk** | **Zero duplicate OTP storage.** Handled inside Supabase. | **Zero duplicate OTP storage.** Handled inside Twilio Cloud. |
| **Session Issuance** | Issues Supabase session JWT directly | Establishes authenticated 2FA customer session via Server Action |
| **India Telecom (DLT) Compatibility** | Standard SMS template. Requires Indian DLT compliance or pre-verified test numbers. | **Best for India.** Twilio Verify routes OTP traffic automatically through pre-approved delivery pipes. |
| **Our Implementation** | **Supported natively** via `supabase.auth.signInWithOtp` / `supabase.auth.verifyOtp`. | **Supported natively** via `verify.twilio.com/v2/Services/...` |

> **Architectural Recommendation**:  
> To avoid maintaining any custom OTP generation or storage code, our backend supports **both**:
> - If you paste `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` into `.env.local`, ShopSphere uses the official **Twilio Verify API** (no local OTP generation, no local OTP storage, automatic DLT routing for India).
> - If you enable Twilio inside the **Supabase Dashboard**, ShopSphere seamlessly routes OTP requests through **Supabase Phone Auth**.
>
> In both cases, **zero fake or duplicate OTP systems exist**.

---

## 2. Environment Variables Prepared

The required variable names are prepared in [`.env.local`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.local) and [`.env.example`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.example):

```env
# 4. Mobile SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

*(These variables are server-only. They are never exported as `NEXT_PUBLIC_` and are never accessible to client browsers or bundled into static assets).*

---

## 3. Where to Obtain Credentials in the Twilio Console

### 1. `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`
1. Navigate to: [https://console.twilio.com/](https://console.twilio.com/)
2. On the **Main Dashboard (Develop tab)**, scroll to the **Account Info** section.
3. **Account SID**: Starts with `AC...` (34 alphanumeric characters).
4. **Auth Token**: Click the **Show** icon next to Auth Token to view and copy your private key.

### 2. `TWILIO_VERIFY_SERVICE_SID` (Recommended: Twilio Verify)
1. In the left navigation menu, click **Explore Products** (or search for **Verify**).
2. Click **Verify** ➔ **Services** ([direct link](https://console.twilio.com/us1/develop/verify/services)).
3. Click **Create Service**.
4. Set the **Friendly Name** to `ShopSphere` and choose code length `6 digits`.
5. Click **Create**.
6. On the service overview screen, copy the **Service SID** (starts with `VA...`).

---

## 4. India-Specific SMS Delivery Regulations (Important)

In India, SMS delivery is regulated by the **Telecom Regulatory Authority of India (TRAI)** under the **TCCCPR (Telecom Commercial Communications Customer Preference Regulations)** using **DLT (Distributed Ledger Technology)** platforms (e.g., Vilpower, Jio DLT, Airtel DLT):

### Why Regular International SMS Often Fails into India:
- Indian mobile networks (Jio, Airtel, Vi, BSNL) automatically filter or scrub commercial/transactional SMS sent from generic international long numbers (e.g., US `+1` numbers) unless they originate from a registered Sender ID / Header.
- Regular transactional SMS in India requires:
  1. **Principal Entity (PE) Registration** on an Indian DLT platform.
  2. **Sender ID / Header Approval** (a 6-alpha code like `SHPSPH`).
  3. **Content Template Registration** with approved variable syntax (e.g., `{#var#}`).

### How to Guarantee Reliable Delivery to Indian Numbers:
1. **Method 1 — Use Twilio Verify (`TWILIO_VERIFY_SERVICE_SID`)**:
   - Twilio Verify uses its own pre-registered, pre-approved global operator connections and routing algorithms to deliver 2FA verification codes into India without requiring individual merchants to register custom DLT templates for sandbox and standard accounts.
2. **Method 2 — Twilio Trial Account Verified Caller ID**:
   - If using a Twilio free trial account, Indian mobile numbers **must be pre-verified** in the Twilio Console:
   - Go to: **Phone Numbers** ➔ **Manage** ➔ **Verified Caller IDs** ([direct link](https://console.twilio.com/us1/develop/phone-numbers/manage/verified-caller-ids)).
   - Click **Add a new caller ID**, enter the Indian test phone number (`+91...`), and enter the confirmation code received.
   - Twilio will only deliver SMS to numbers listed on this page while in trial status.

---

## 5. Security & Privacy Commitments

- **No Secret Exposure**: Secret keys (`TWILIO_AUTH_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`) are stored solely in `.env.local` and never committed to Git.
- **No Plain-Text Codes**: Tokens are verified cryptographically via Twilio Verify or HMAC-SHA256 constant-time comparisons.
- **No Fake OTPs**: Test OTP fallbacks are disabled when real provider configurations are requested.
- **No Messages Dispatched Until Approved**: The application will only trigger outbound cellular SMS when real credentials have been provided and verified.

