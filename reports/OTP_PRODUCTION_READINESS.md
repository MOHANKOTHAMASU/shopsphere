# ShopSphere OTP & Authentication Production Readiness Guide

**Document ID:** `SEC-PROD-2026-OTP-03`  
**Classification:** DevOps & Production Deployment Guide  
**Target Environment:** Vercel Production (`shopsphere-xi-gilt.vercel.app`)  
**Date:** November 4, 2026  

---

## 1. Environment Variable Requirements Matrix

To operate ShopSphere in live production without demo bypasses or telecom delivery errors, configure the following environment variables in the **Vercel Project Settings > Environment Variables**:

| Variable Name | Required / Optional | Target Production Value | Purpose & Sensitivity |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Required** | `production` | Enforces production mode, disables sandbox OTP `123456`, hides 1-click admin. |
| `AUTH_SECRET` | **Required** | 32+ char random hex string | Cryptographically signs session cookies with HMAC-SHA256 to prevent tampering. |
| `SUPABASE_HOOK_SECRET` | **Required** | 32+ char random hex string | Authenticates incoming webhooks from Supabase GoTrue Auth to `/api/auth/send-sms`. |
| `ADMIN_PASSWORD` | **Required** | 16+ char strong password | The master administrator password required to sign in at `/admin/login`. |
| `MSG91_AUTH_KEY` | **Required (India SMS)** | Production API Key from MSG91 Portal | Connects to MSG91 Flow API for delivering SMS OTPs across Indian telecom operators. |
| `MSG91_TEMPLATE_ID` | **Required (India SMS)** | Approved DLT Template ID (e.g. `12071615...`) | Approved template ID containing the DLT registration header and variable `##OTP##`. |
| `MSG91_SENDER_ID` | **Required (India SMS)** | Approved 6-character Header (e.g. `SHPSPH`) | Registered DLT sender ID displayed on customer handsets in India. |
| `NEXT_PUBLIC_APP_URL` | **Required** | `https://shopsphere-xi-gilt.vercel.app` | Base URL used for email verification callbacks and secure redirect sanitization. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Active Supabase Project URL (`https://<id>.supabase.co`) | Database and Auth client endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Public Supabase Anon JWT | Public browser client queries and RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Secret Supabase Service Role JWT | Server-side administrative operations and user management. |

---

## 2. Step-by-Step Production Configuration

### Step A: Configure Supabase SMS Hook
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and navigate to **Authentication > Hooks (Webhooks)**.
3. Under **Send SMS Hook**, select **HTTP Endpoint**.
4. Configure the endpoint URL:
   ```
   https://shopsphere-xi-gilt.vercel.app/api/auth/send-sms
   ```
5. Set the **HTTP Method** to `POST`.
6. Under **Secrets / Authorization**, enter the exact string you set for `SUPABASE_HOOK_SECRET` in Vercel.
7. Save the configuration.

---

### Step B: Configure MSG91 Flow API
1. Log in to the [MSG91 Control Panel](https://control.msg91.com/).
2. Complete DLT registration under TRAI guidelines (Entity ID + Header + Consent Template).
3. Under **SMS > Flows**, verify your OTP flow template:
   - Variable name: `otp`
   - Recipient placeholder: `mobiles`
4. Copy the **Flow Template ID** into `MSG91_TEMPLATE_ID`.
5. Under **Authkey**, generate an API key and paste into `MSG91_AUTH_KEY` in Vercel.

---

### Step C: Generate Cryptographic Secrets
Run the following commands in a local terminal to generate secure keys for your Vercel deployment:

```bash
# Generate AUTH_SECRET (HMAC signing key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SUPABASE_HOOK_SECRET (Webhook verification key)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# Generate ADMIN_PASSWORD (Master admin password)
node -e "console.log(require('crypto').randomBytes(16).toString('base64url'))"
```

---

## 3. Production Behavior Verification

Once deployed to Vercel with the environment variables above:
1. **Entering `123456` at `/auth/login`:**
   - Promptly displays: `Invalid verification code. You have 4 attempts remaining.`
   - No session is created.
2. **Accessing `/admin/login`:**
   - Golden "1-Click Developer Sign In" button is **completely hidden**.
   - Default credentials (`Admin@123`) are **not shown** and **rejected** if entered.
   - Only the password configured in `ADMIN_PASSWORD` is accepted.
3. **Calling `/api/auth/send-sms` directly from Postman or curl:**
   - Without the `Authorization: Bearer <secret>` header, returns:
     ```json
     { "error": "Unauthorized: Invalid hook secret" }
     ```
     with HTTP status `401`.
