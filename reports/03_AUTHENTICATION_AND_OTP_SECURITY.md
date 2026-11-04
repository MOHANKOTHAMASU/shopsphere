# Phase 3 — Customer Authentication & OTP Security Audit

> **Project:** ShopSphere — Full-Stack Indian E-Commerce Platform  
> **Security Baseline:** Real Indian Mobile OTP + Zero Production Bypass + Cryptographic Session Protection  
> **Audit Status:** Verified & Compliant  

---

## 1. Authentication Policy Enforcement

ShopSphere implements an Indian e-commerce authentication policy inspired by Amazon India and Flipkart:

* **Customer Authentication Policy:** Passwordless Mobile Number + SMS OTP only.
* **Country Code:** India (+91) normalized automatically using Google Libphonenumber E.164 standard.
* **Email Verification:** Required during customer account registration to safeguard communication.
* **Session Integrity:** Cryptographically signed HMAC-SHA256 session tokens (`payload.signature`) preventing privilege escalation.
* **Store Owner Administration:** Strictly isolated from customer login; accessible only to whitelisted email `kmvsubbarao28@gmail.com` and `admin@shopsphere.dev`.

---

## 2. Security Threat Verification Matrix

| Vulnerability Vector | Threat Scenario | ShopSphere Mitigation | Verified Status |
| :--- | :--- | :--- | :---: |
| **Production OTP Bypass** | Attacker attempts to login with static `123456` in production | `isDevOtpAllowed()` strictly checks `NODE_ENV === 'production'` and `VERCEL_ENV === 'production'`. Demo code is rejected in production. | **SECURE (PASSED)** |
| **Session Cookie Tampering** | Attacker edits cookie to change `role: "customer"` to `role: "admin"` | Cookie payload is signed with server-side `SESSION_SECRET`. Any modification invalidates HMAC signature. | **SECURE (PASSED)** |
| **SMS Hook Abuse** | Attacker calls `/api/auth/send-sms` to send unauthorized SMS messages | Mandatory `SUPABASE_HOOK_SECRET` verification using `crypto.timingSafeEqual()`. Fails closed (503) if missing in production. | **SECURE (PASSED)** |
| **Brute Force OTP Guessing** | Attacker tries all 6-digit combinations | Rate limit enforced: 30-second cooldown between resends, maximum 5 failed attempts per challenge token. | **SECURE (PASSED)** |
| **Phone Number Spoofing** | Attacker inputs invalid format or international routing numbers | Validated and normalized using Indian carrier rules (+91 followed by 6, 7, 8, or 9, exactly 10 digits). | **SECURE (PASSED)** |
| **Admin Privilege Escalation** | Customer signs in via `/admin/login` | Explicit whitelist check in actions and middleware denies non-whitelisted emails with HTTP 403 / Access Denied. | **SECURE (PASSED)** |
| **Admin UI Credential Leak** | Public UI exposing 2FA notes, default console commands | All unwanted debug callouts and console promote commands removed from `/admin/login`. | **SECURE (PASSED)** |

---

## 3. Cryptographic Token Verification Architecture

```
Client Request -> Next.js Middleware -> Cookie Validation
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
     Signed Cookie Format                                       Unsigned / Invalid
     base64url(payload).hmac_signature                          Session Cleared
               │                                                         │
               ▼                                                         ▼
     Verify HMAC-SHA256(payload, SESSION_SECRET)                 Redirect to Login
               │
         ┌─────┴─────┐
         ▼           ▼
       Valid      Mismatch / Expired
         │           │
         ▼           ▼
      Proceed     Destroy Cookie & Deny
```

---

## 4. Test Verification Evidence

From `node scripts/test-critical-otp-security.mjs`:
* `✅ PASS: isDevOtpAllowed() strictly denies dev OTP when NODE_ENV=production`
* `✅ PASS: Valid HMAC-SHA256 session token verifies customer identity`
* `✅ PASS: Unsigned plain JSON session cookie is rejected`
* `✅ PASS: Privilege escalation attempt is detected and rejected`
* `✅ PASS: Webhook rejects unauthenticated request when secret is configured`
* `✅ PASS: Webhook fails closed with HTTP 503 if secret is missing in production`
* `✅ PASS: Admin login rejects default password in production mode`
* `✅ PASS: Store owner kmvsubbarao28@gmail.com is authorized as admin`
* `✅ PASS: Arbitrary visitor attacker@evil.com is denied admin access`
