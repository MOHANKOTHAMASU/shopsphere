# ShopSphere: OTP Provider Configuration Guide (Phase 12)
**Document:** Administrator Setup & Production Credential Integration  
**Target Gateways:** MSG91 Flow API & Supabase GoTrue Auth Webhook  
**Date:** November 4, 2026  

---

## 1. Overview

This guide provides step-by-step instructions to configure **MSG91** and **Supabase Auth** for live cellular SMS OTP delivery.

---

## 2. Step 1: MSG91 Account & Auth Key

1. Register or log in to [https://msg91.com/](https://msg91.com/).
2. Navigate to **Developer API** $\rightarrow$ **Auth Key**.
3. Generate a new Auth Key (or copy your existing key).
4. Save this as `MSG91_AUTH_KEY` in [`.env.local`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.local) and in Vercel Environment Variables:
   ```env
   MSG91_AUTH_KEY="your_32_char_msg91_auth_key"
   ```

---

## 3. Step 2: TRAI DLT Registration & Sender ID

1. Register your business entity on any Indian DLT portal:
   - [Jio DLT](https://trueconnect.jio.com/)
   - [VilPower DLT](https://www.vilpower.in/)
   - [Airtel DLT](https://www.airtel.in/business/commercial-communication)
2. Obtain your **Principal Entity ID (PE ID)**.
3. Apply for a 6-character header: **`SHPSPH`** (Service Implicit).
4. In MSG91 Dashboard:
   - Go to **SMS** $\rightarrow$ **Sender ID** $\rightarrow$ Add Header `SHPSPH` with your PE ID.
5. Save in `.env.local`:
   ```env
   MSG91_SENDER_ID="SHPSPH"
   ```

---

## 4. Step 3: DLT Content Template & Flow ID

1. In your DLT portal, submit a new template:
   - **Template Name:** ShopSphere Login OTP
   - **Type:** Service Implicit
   - **Content:** `{#var#} is your ShopSphere login verification code. Valid for 5 minutes. Do not share this code.`
2. Once approved by DLT, navigate to MSG91 Dashboard $\rightarrow$ **Flow**.
3. Create a new Flow:
   - Select SMS channel.
   - Choose Sender ID `SHPSPH`.
   - Link your approved DLT Template ID.
   - Map variable `{#var#}` to `##otp##`.
4. Copy the resulting **Flow / Template ID**.
5. Save in `.env.local`:
   ```env
   MSG91_TEMPLATE_ID="your_msg91_template_id"
   ```

---

## 5. Step 4: Supabase Auth Hook (Send SMS)

1. Open your Supabase Dashboard for project `stynwsnmkxxmkpxdhpus`.
2. Navigate to **Authentication** $\rightarrow$ **Hooks** (or **Phone Auth**).
3. Under **Send SMS Hook**:
   - Enable the hook.
   - Set URL: `https://shopsphere-xi-gilt.vercel.app/api/auth/send-sms`
   - Set Secret: Generate a random 32-character string and save as `SUPABASE_HOOK_SECRET`.
4. Add to [`.env.local`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.local) and Vercel:
   ```env
   SUPABASE_HOOK_SECRET="your_shared_webhook_secret"
   ```

---

## 6. Summary of Environment Variables

| Variable | Description | Where Configured |
| :--- | :--- | :--- |
| `MSG91_AUTH_KEY` | MSG91 API Authorization Key | `.env.local` & Vercel |
| `MSG91_TEMPLATE_ID` | MSG91 Flow / Template Identifier | `.env.local` & Vercel |
| `MSG91_SENDER_ID` | 6-letter approved Header (`SHPSPH`) | `.env.local` & Vercel |
| `SUPABASE_HOOK_SECRET` | Secret verifying Supabase Auth Hook | `.env.local` & Vercel |
