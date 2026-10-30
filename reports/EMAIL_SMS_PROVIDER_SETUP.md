# ShopSphere: Email & SMS Provider Configuration Guide
**Document:** Official External Provider Setup Guide  
**Application:** ShopSphere Next-Gen E-Commerce  
**Target:** Beginners & System Administrators  
**Date:** October 30, 2026  

---

## 1. Overview of External Providers

ShopSphere requires two external communication channels for full production authentication:
1. **Email Provider:** For account confirmation links and password reset tokens.
2. **SMS Provider:** For 6-digit one-time password (OTP) delivery to customer mobile devices during Two-Factor Authentication (2FA).

---

## 2. Provider 1: Supabase Authentication & Email (SMTP)

ShopSphere currently uses **Supabase Auth** as its core authentication and database engine.

### Current Status
- Project URL: `https://stynwsnmkxxmkpxdhpus.supabase.co`
- Supabase built-in mailer is enabled by default.
- *Limitation:* Free-tier Supabase mailer is capped at ~3-4 emails per hour. To avoid the `over_email_send_rate_limit` error, configure a custom SMTP server.

### Step-by-Step Custom SMTP Setup in Supabase Dashboard

1. **Log in to Supabase:**
   - URL: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Open Your Project:**
   - Click on your project (`stynwsnmkxxmkpxdhpus` or ShopSphere).
3. **Navigate to Auth Settings:**
   - On the left sidebar, click **Project Settings** (the gear icon at the bottom).
   - In the settings menu, click **Authentication**.
   - Scroll down to the **SMTP Settings** section.
4. **Enable Custom SMTP:**
   - Toggle the switch: **"Enable Custom SMTP"** to ON.
5. **Recommended SMTP Providers:**
   - **Option A: Gmail SMTP (Free for testing)**
     - Sender Email: `yourname@gmail.com`
     - Sender Name: `ShopSphere Security`
     - Host: `smtp.gmail.com`
     - Port: `587`
     - Encryption: `STARTTLS`
     - User: `yourname@gmail.com`
     - Password: Google Account 16-character App Password (generate at Google Account -> Security -> 2-Step Verification -> App Passwords).
   - **Option B: Resend (Best for production, free 3,000 emails/mo)**
     - Host: `smtp.resend.com`
     - Port: `465` or `587`
     - User: `resend`
     - Password: Your Resend API Key (`re_...`)
6. **Save Changes:**
   - Click **Save** at the bottom of the SMTP form.

---

## 3. Provider 2: Twilio SMS & Mobile OTP Integration

ShopSphere's SMS architecture supports **Twilio Verify API v2** (recommended) and **Twilio Programmable SMS**.

### Why Twilio Verify v2 is Recommended
- Built specifically for mobile phone OTP verification.
- **Zero plain-text OTP storage:** Twilio generates, encrypts, tracks, and verifies the 6-digit OTP code directly on its telecom infrastructure.
- **Telecom & India Compliance:** Twilio Verify automatically handles international carrier routing, fraud detection, and delivery retries.

### Step-by-Step Twilio Setup Guide

#### Step 1: Create a Twilio Account
1. Open [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio) in your web browser.
2. Sign up with your work or personal email address.
3. Verify your email and mobile phone number.
4. When asked "Do you write code?", choose **Yes** and select **Node.js**.

#### Step 2: Obtain Account SID and Auth Token
1. Open the **Twilio Console Dashboard**: [https://console.twilio.com/](https://console.twilio.com/).
2. In the top-left section named **Account Info**, you will see:
   - **Account SID:** Starts with `AC...` (e.g., `ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
   - **Auth Token:** Click **"Show"** to reveal the 32-character token.
3. Copy both values.

#### Step 3: Create a Twilio Verify Service (Recommended)
1. In the left navigation menu, search for **Verify** or open:  
   [https://console.twilio.com/us1/develop/verify/services](https://console.twilio.com/us1/develop/verify/services)
2. Click the blue button: **"Create new service"** (or "+").
3. Enter a friendly name: `ShopSphere Verification`.
4. Set **Code length** to **6 digits**.
5. Click **Create**.
6. On the service overview page, copy the **Service SID**:
   - Starts with `VA...` (e.g., `VA1234567890abcdef1234567890abcdef`).

#### Alternative Step 3: Get a Twilio Phone Number (For Programmable SMS)
If you prefer standard Programmable SMS instead of Verify:
1. In the Twilio Console, go to **Phone Numbers** $\rightarrow$ **Manage** $\rightarrow$ **Active numbers**.
2. Click **"Buy a number"** (free with trial balance).
3. Copy the phone number in E.164 format (e.g., `+12025550199`).

---

## 4. India SMS Compliance (TRAI & DLT Guidelines)

If dispatching SMS to mobile numbers with country code `+91` (India):
- India Telecom Regulatory Authority (TRAI) mandates Distributed Ledger Technology (DLT) registration for commercial bulk SMS.
- **Using Twilio Verify:** Twilio handles global OTP delivery pathways automatically through compliant aggregators, avoiding template rejection for standard authentication OTPs.
- **Using Programmable SMS in India:** Requires:
  1. Business entity registration on a DLT portal (e.g. Jio, Airtel, VilPower, Vodafone).
  2. Approved Header / Sender ID (6 alphabetic characters, e.g. `SHPSPH`).
  3. Pre-registered Content Template with exact variables (e.g., `{#var#} is your ShopSphere login verification code. Valid for 5 minutes.`).

---

## 5. Local Environment Configuration

Open `.env.local` in your project root (`c:\Users\kmvsu\OneDrive\Desktop\website-site\.env.local`) and configure your credentials:

```bash
# -----------------------------------------------------------------------------
# TWILIO SMS GATEWAY (Add your real credentials below)
# -----------------------------------------------------------------------------
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OR if using Twilio Programmable SMS phone number:
# TWILIO_PHONE_NUMBER=+12025550199
```

> [!CAUTION]
> Never commit `.env.local` or secret keys to GitHub. ShopSphere's `.gitignore` already protects all `.env.*` files.

---

## 6. How to Test Your Credentials

Once you have pasted your credentials into `.env.local`:

1. Run the safe configuration verification script:
   ```powershell
   npx.cmd tsx scripts/verify-twilio-config.ts
   ```
2. The script will confirm whether your credentials are valid and properly loaded without printing secret values to the terminal.

