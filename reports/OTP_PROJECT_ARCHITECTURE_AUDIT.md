# ShopSphere: OTP Project Architecture Audit Report
**Document:** Phase 1 Project Architecture & Telecom Readiness Inspection  
**Application:** ShopSphere Next-Gen E-Commerce  
**Date:** October 30, 2026  
**Auditor:** Senior E-Commerce Architect, Telecom Specialist & Security Engineer  

---

## 1. Project Technology Stack Audit

| Architectural Layer | Technology Stack | Configuration Details | Telecom Readiness |
|:---|:---|:---|:---:|
| **Frontend Framework** | Next.js 16.4.2 (Turbopack, App Router) | React 19.3.0, Tailwind CSS v4, Lucide React icons | **READY** |
| **Backend Framework** | Next.js Server Actions & Route Handlers | Node.js v20.x runtime with type-safe server boundary | **READY** |
| **Authentication Engine** | Supabase Auth + HttpOnly Session Cookies | PKCE flow with JWT token exchange | **READY** |
| **Database Provider** | PostgreSQL (Supabase Hosted) | Version 15+ (`profiles`, `addresses`, `orders`, `products`) | **READY** |
| **Existing Login Modes** | 1. Mobile Number OTP (Amazon/Flipkart Style)<br>2. Verified 2FA (Email + Password + OTP) | Native E.164 phone normalization, HMAC-SHA256 hashing | **READY** |
| **SMS Gateway Integration** | Twilio Verify v2 & Supabase Phone Auth Bridge | Supported API paths in `src/lib/auth/sms-service.ts` | **BLOCKED (Keys Missing)** |
| **Email Verification** | Supabase Mailer & Custom SMTP Bridge | PKCE confirmation link with 60s resend cooldown | **READY** |
| **Environment Configuration** | `.env.local` / `.env.example` | `TWILIO_ACCOUNT_SID=`, `TWILIO_AUTH_TOKEN=` | **EMPTY KEYS** |
| **Production Hosting** | Vercel Global Edge Network | Active deployment at `https://shopsphere-xi-gilt.vercel.app` | **READY** |

---

## 2. Root Cause Analysis: Why Your Phone Did Not Receive SMS

When you entered your phone number (`+9196*** **899`) and clicked "Verify & Continue" with `1 2 3 4 5 6`, you noticed:
1. No SMS arrived on your mobile phone.
2. Typing `1 2 3 4 5 6` displayed: `Invalid verification code. You have 3 attempts remaining.`

### Technical Root Causes:
1. **Empty SMS Gateway Credentials:**
   In your project root, `.env.local` contains:
   ```bash
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_VERIFY_SERVICE_SID=
   ```
   Because these lines have no values, the server is not connected to a telecom gateway. A web server or local computer cannot emit radio waves to telecom towers (Jio, Airtel, Vi, BSNL) without an authenticated telecom API connection.
2. **Cryptographic Sandbox Mismatch:**
   When no SMS keys were detected, the backend generated a cryptographically random 6-digit number in memory (e.g. `839102`), hashed it, and never sent it anywhere. When you typed `1 2 3 4 5 6`, the server compared `123456` against `839102`, which caused the mismatch.

### Immediate Fix Applied:
1. **Default Sandbox OTP:** In local development mode without external telecom keys, `123456` is now officially recognized as the sandbox preview OTP, allowing you to preview the full login journey without external charges.
2. **Indian E-Commerce Default:** The login page now defaults to **Mobile Number Login** (just like Amazon India, Flipkart, and Meesho).
3. **Telecom Carrier Bridge:** When real Twilio/MSG91 keys are pasted into `.env.local`, the system automatically shifts to live cellular transmission to Jio, Airtel, Vi, and BSNL numbers.

