# ShopSphere — Customer Authentication & Multi-Account Architecture Audit

**Auditor:** Senior Authentication Engineer & Cybersecurity Auditor  
**Date:** November 9, 2026  
**Status:** Complete Security Verification & Production Readiness Passed  

---

## 1. Executive Summary

This security audit inspects the authentication architecture of the ShopSphere ecommerce platform, focusing on:
* Multi-account login and multi-tab session behavior
* Customer data isolation (UID-bound orders, carts, wishlists, and addresses)
* Email OTP passwordless login with brute-force defense
* Cookie separation between the Customer Storefront and Admin Management Console

All identified session bleeding and state clobbering vulnerabilities have been permanently eliminated.

---

## 2. Authentication Flow Architecture

```
[Customer Browser / Mobile]
       │
       ▼
[GET /auth/login or /auth/register]
       │
       ├── Active Session Exists? ──► [Show "Active Session Detected" Banner]
       │                               ├── "Go to Account"
       │                               └── "Switch Account" (Clean Sign Out)
       ▼
[Enter Customer Email]
       │
       ▼
[sendCustomerEmailOtpAction]
       ├── Validate email syntax
       ├── Check 45-second rate-limiting cooldown
       ├── Generate cryptographically secure 6-digit OTP (crypto.randomInt)
       ├── Store in server-side memoryVerificationTokens with 10-minute expiry
       └── Dispatch via Resend SMTP / Supabase Auth
       │
       ▼
[Enter 6-Digit Verification Code]
       │
       ▼
[verifyCustomerEmailOtpAction]
       ├── Enforce maximum 5 verification attempts (Anti-Brute-Force)
       ├── Reject sandbox codes ("123456") in production
       ├── Verify token equality and expiration
       ├── Auto-provision customer record in Supabase / memoryCustomers if first-time user
       ├── Create cryptographically signed HMAC-SHA256 session token
       └── Set HttpOnly, SameSite=Lax cookie: shopsphere_customer_session
       │
       ▼
[User Authenticated — Redirect to /account or /checkout]
```

---

## 3. Critical Security Verification

### 3.1 Strict UID Binding
* Profile queries, order history lookups, and saved address queries **never** query by customer email or display hardcoded profiles.
* Every operation executes under `assertAuthenticatedUser()`, which extracts the verified `userId` directly from the cryptographic session token or Supabase Auth context.

### 3.2 Password & Token Privacy
* Zero raw passwords or verification OTPs are ever stored in customer tables or returned in API responses.
* Email OTPs expire after 10 minutes and are immediately deleted upon successful verification.
* Admin customer queries mask email addresses (e.g., `k***9@gmail.com`) in administrative tables to preserve customer privacy.

### 3.3 Rate Limiting & Abuse Prevention
* Registration: 5 requests per 10 minutes per IP/email.
* Sign In: 5 requests per minute per IP/email.
* OTP Resend: Strict 45-second cooldown timer.
* OTP Brute-Force: Maximum 5 incorrect guesses before the token is invalidated.
