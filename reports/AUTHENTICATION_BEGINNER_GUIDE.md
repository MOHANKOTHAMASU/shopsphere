# ShopSphere: Beginner's Guide to Authentication & Admin Login
**Document:** Simple English Quick Start Guide  
**Application:** ShopSphere E-Commerce  
**Audience:** Beginners & Store Owners  
**Date:** October 30, 2026  

---

## Welcome to ShopSphere!

This guide explains how to use the authentication system in simple words, how to sign in to the Admin Dashboard, how to test customer registration, and how to activate real mobile SMS delivery.

---

## 1. How to Sign In to the Admin Console

The Admin Console allows you to manage products, view customer orders, approve discounts, and monitor sales.

### Option A: The Fast 1-Click Method (Recommended)
1. Open your browser and go to:
   ```text
   http://localhost:3000/admin/login
   ```
   *(Or on production: `https://shopsphere-xi-gilt.vercel.app/admin/login`)*
2. Look at the top box with the amber border that says **"Developer Quick Access"**.
3. Click the amber button:
   $$\mathbf{[\text{⚡ 1-Click Sign In as Store Admin}]}$$
4. You will immediately be signed in and redirected to the **Admin Dashboard** (`/admin/dashboard`) without typing any password!

---

### Option B: Typing Email and Password Manually

If you prefer to type your credentials into the form:

1. In the **Admin Email** box, type:
   ```text
   admin@shopsphere.dev
   ```
   *(Or simply type `admin`)*
2. In the **Master Password** box, type:
   ```text
   Admin@123
   ```
   *(Capital `A`, then `dmin@123`)*
3. Click the yellow button: **"Access Admin Dashboard"**.
4. You will be signed in securely.

> [!TIP]
> If you ever see **"Invalid email or password"**, make sure:
> - You entered capital `A` in `Admin@123`.
> - Or simply click the **"1-Click Sign In as Store Admin"** button at the top of the card!

---

## 2. How Customer Registration & 2FA Login Works

ShopSphere protects customer accounts using 2-Factor Authentication (Email + Password $\rightarrow$ 6-digit Mobile OTP).

### Step 1: Customer Registration
1. Go to `http://localhost:3000/auth/register`.
2. Fill in:
   - Full Name (e.g., `Rajesh Kumar`)
   - Email (e.g., `rajesh@example.com`)
   - Mobile Number (e.g., `+91 96527 88899`)
   - Password (at least 8 characters, with letters and numbers, e.g. `Customer@123`)
   - Confirm Password (`Customer@123`)
   - Address, City, State, PIN Code (e.g., `560001`)
   - Check "I agree to Terms & Conditions"
3. Click **"Create Account"**.
4. The system will create the account and send you to `/auth/verify-email`.

---

### Step 2: Customer Login (2-Factor Authentication)
1. Go to `http://localhost:3000/auth/login`.
2. Enter your Email and Password.
3. Click **"Sign In with Password"**.
4. The screen will switch to **Two-Factor Authentication**:
   - It shows your phone number with stars for safety (e.g., `+91 96*** **899`).
   - An SMS OTP is dispatched.
5. In development test mode, enter the 6-digit code shown on your test screen or phone.
6. Click **"Verify & Complete Sign In"**.
7. You are now logged in! The header at the top will say:
   `Hello, Rajesh` $\rightarrow$ `My Account`.

---

## 3. How to Turn On Real Mobile SMS to Your Physical Phone

To have real SMS messages arrive on your real mobile phone via telecom towers:

### What You Need:
A free account on **Twilio** ([https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)).

### Step 1: Get 3 Keys from Twilio Console
In your Twilio Console ([https://console.twilio.com/](https://console.twilio.com/)):
1. **Account SID:** Starts with `AC...`
2. **Auth Token:** Click "Show" and copy the 32-letter token.
3. **Verify Service SID:** Go to Twilio Verify and click Create Service $\rightarrow$ copy the SID starting with `VA...`.

### Step 2: Paste into `.env.local`
Open `.env.local` in your editor and add:
```bash
TWILIO_ACCOUNT_SID=ACyour_real_account_sid_here
TWILIO_AUTH_TOKEN=your_real_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAyour_real_verify_sid_here
```

### Step 3: Test Real SMS
Run this command in your PowerShell terminal:
```powershell
npx.cmd tsx scripts/verify-twilio-config.ts
```
It will check that your credentials are connected and ready!

---

## 4. Useful Terminal Commands Cheat Sheet

| Task | Command to Run |
| :--- | :--- |
| **Run the Website Locally** | `npm.cmd run dev` |
| **Run Authentication Test Suite** | `npx.cmd tsx scripts/test-authentication-flow.ts` |
| **Run All 71 Platform Tests** | `npx.cmd tsx scripts/test-complete-audit.ts` |
| **Check Twilio Keys Safely** | `npx.cmd tsx scripts/verify-twilio-config.ts` |
| **Build for Production** | `npm.cmd run build` |

---

## 5. Website Links Overview

- **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **Customer Sign In:** [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- **Customer Register:** [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
- **Customer Account:** [http://localhost:3000/account](http://localhost:3000/account)
- **Store Admin Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Store Admin Dashboard:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
- **Live Production Deployment:** [https://shopsphere-xi-gilt.vercel.app](https://shopsphere-xi-gilt.vercel.app)

