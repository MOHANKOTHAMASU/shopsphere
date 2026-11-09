# ShopSphere — Complete Customer Registration & Login Guide

**Audience:** Store Administrators, Customer Support Specialists & Developers  
**Date:** November 9, 2026  

---

## 1. Overview of Customer Authentication

ShopSphere offers two secure pathways for customers to access their accounts:
1. **Passwordless Email OTP Verification (Primary & Recommended):** Customers enter their email address and verify with a genuine 6-digit code sent to their inbox.
2. **Standard Email & Password Authentication:** Traditional login supporting password complexity enforcement and self-service password recovery.

---

## 2. Customer Registration Workflow

### Step 1: Navigating to Sign Up
Visit `/auth/register` or click "Sign In / Register" in the top header.

### Step 2: Providing Account Details
The registration form collects:
* **Full Name:** Minimum 2 characters
* **Email Address:** Valid format (e.g., `name@example.com`)
* **Phone Number:** Valid 10-digit mobile number with `+91` prefix
* **Password:** Minimum 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character
* **Delivery Address (Optional at signup):** Street, city, state, postal code

### Step 3: Email Verification
* A 6-digit verification code is generated and dispatched to the customer's email.
* In production, delivery is handled via custom SMTP / Resend API.
* The customer enters the 6-digit code on `/auth/verify-email`.
* Once verified, their account status becomes `ACTIVE` and `isVerified = true`.

---

## 3. Customer Login Workflow

### Passwordless 6-Digit Email OTP Login
1. Customer visits `/auth/login`.
2. Customer types their email address and clicks **"Send 6-Digit OTP"**.
3. If the user already has an active session, a banner displays:
   `"You are currently signed in as [email]"` with options to **Go to Account** or **Switch Account**.
4. The system validates the email and checks rate limits (45-second cooldown).
5. A 6-digit verification code is generated with a 10-minute validity window.
6. The customer enters the 6-digit code and clicks **"Verify Code & Sign In"**.
7. If the user is new, their account is auto-provisioned seamlessly into PostgreSQL and Supabase.
8. The customer is redirected to their previous destination (e.g. `/checkout` or `/account`).

---

## 4. Account Switching & Multi-Tab Isolation

* To switch accounts, the customer clicks **"Switch Account"** in the header or on the login page.
* The system executes `signOut('/auth/login?switch=true')`.
* This cleanly purges `CUSTOMER_SESSION_COOKIE`, clears local storage cache, resets the active shopping cart and wishlist, and broadcasts a signed-out event to all open browser tabs via `BroadcastChannel`.
* The customer can then enter another email address without inheriting stale data from the previous account.

---

## 5. Store Administrator Console Access

* The Admin Console is accessible strictly at `/admin/login`.
* Customer credentials **cannot** access the admin console.
* Only pre-approved master administrator emails (e.g., `kmvsubbarao28@gmail.com`) can log in.
* Admin sessions are stored in `shopsphere_admin_session`, completely separated from customer sessions.
