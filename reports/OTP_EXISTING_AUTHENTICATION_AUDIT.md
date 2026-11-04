# ShopSphere: Phase 1 — Existing Authentication Architecture Audit
**Document:** Baseline Project Architecture & Authentication State  
**Application:** ShopSphere Next-Gen E-Commerce  
**Target Environment:** Localhost (`http://localhost:3000`) & Production (`https://shopsphere-xi-gilt.vercel.app`)  
**Date:** October 30, 2026  
**Auditor:** Senior Software Architect, Security Engineer & Telecom Specialist  

---

## 1. Executive Summary

This audit inspects the existing authentication subsystem of ShopSphere to establish the baseline before integrating **MSG91** and transitioning to a **pure Mobile Number + SMS OTP login** model.

### Key Audit Findings:
1. **Frontend & Backend:** Next.js 16.4.2 (Turbopack, App Router) with React 19.3.0 and TypeScript 5. Type-safe Server Actions manage server-side mutations.
2. **Identity & Auth Provider:** **Supabase Auth (GoTrue)** is active and configured (`https://stynwsnmkxxmkpxdhpus.supabase.co`).
3. **Database & Storage:** PostgreSQL on Supabase with Row Level Security (RLS) active on `profiles`, `addresses`, `orders`, and `order_items`.
4. **Current Login State:** The customer login page currently retains an "Email & Password" tab alongside the "Mobile OTP" tab. This will be updated to pure Mobile Number + SMS OTP as requested.
5. **SMS Provider Status:** Neither MSG91 nor Twilio has active credentials configured in `.env.local`. In local development, the system uses an emulated sandbox mode (`123456`) to prevent developer lockouts.

---

## 2. Technical Stack & Component Audit

| Component | Current Implementation | File / Directory | Verification Status |
|:---|:---|:---|:---:|
| **Frontend Framework** | Next.js 16.4.2, React 19.3.0, Tailwind CSS v4 | `package.json`, `src/app/` | **VERIFIED** |
| **Backend Runtime** | Next.js Server Actions & Route Handlers (Node.js v20.x) | `src/lib/auth/`, `src/app/auth/` | **VERIFIED** |
| **Auth Provider** | Supabase Auth (GoTrue) with PKCE | `src/lib/supabase/client.ts`, `server.ts` | **VERIFIED** |
| **Database** | PostgreSQL (Supabase Hosted) | `supabase/migrations/` | **VERIFIED** |
| **Edge Middleware** | Route guard for `/account`, `/checkout`, `/admin/*` | `src/middleware.ts` | **VERIFIED** |
| **Callback Handler** | Handles PKCE token exchange and email confirmation | `src/app/auth/callback/route.ts` | **VERIFIED** |
| **Customer Login UI** | Mobile OTP (Default) + Email/Password (Legacy tab) | `src/app/(customer)/auth/login/page.tsx` | **REQUIRES UPDATE** |
| **Customer Register UI** | Full name, email, phone, address, password | `src/app/(customer)/auth/register/page.tsx` | **REQUIRES UPDATE** |
| **Admin Login UI** | Isolated admin console with master email and 1-Click access | `src/app/admin/login/page.tsx` | **VERIFIED (PRESERVED)** |
| **SMS Gateway Adapter** | Twilio / Supabase / Sandbox adapter | `src/lib/auth/sms-service.ts` | **REQUIRES MSG91 BRIDGE** |
| **Environment Keys** | `TWILIO_*` lines present but empty; `MSG91_*` missing | `.env.local`, `.env.example` | **REQUIRES CONFIG** |

---

## 3. Database Schema & RLS Policy State

The PostgreSQL database on Supabase contains the following authentication-linked tables:

1. **`auth.users`** (Supabase Internal):
   - Stores user UUID, normalized phone (`phone`), email (`email`), phone confirmation timestamp (`phone_confirmed_at`), and email confirmation timestamp (`email_confirmed_at`).
2. **`public.profiles`**:
   - `id` (references `auth.users.id` ON DELETE CASCADE)
   - `full_name` (TEXT)
   - `email` (TEXT, UNIQUE)
   - `phone` (TEXT)
   - `role` (TEXT: `'customer'` or `'admin'`)
   - `is_verified` (BOOLEAN)
   - RLS Policy: `auth.uid() = id` (Customers can only view and update their own profile).
3. **`public.addresses`**:
   - Stores delivery addresses linked to `user_id = auth.uid()`.
4. **`public.orders` & `public.order_items`**:
   - Stores customer orders linked to `user_id = auth.uid()`.
   - RLS Policy ensures strict cross-customer isolation (Customer B cannot view Customer A's orders).

---

## 4. Current Authentication Flows vs. Desired Policy

| Flow | Current Implementation | Desired Final Policy | Delta / Required Changes |
|:---|:---|:---|:---|
| **Customer Login** | Defaults to Mobile OTP, but provides "Email & Password" tab | **Mobile Number + SMS OTP ONLY.** No password login for customers. | Remove password login tab from customer login. Keep admin login separate. |
| **Customer Registration** | Asks for password, address, email, phone | Full name, Mobile number, Email address. | Remove password fields from customer registration. |
| **Email Verification** | PKCE email confirmation link | Mandatory email verification during registration. | Verify email token before account is marked active. |
| **SMS OTP Engine** | Twilio Verify / Sandbox fallback | **MSG91 Flow API / Supabase Send SMS Hook** | Connect MSG91 to Supabase Send SMS Hook or Next.js route handler. |
| **Carrier Support** | Emulated in sandbox; blocked in cellular mode | Real delivery across Jio, Airtel, Vi, BSNL. | Add MSG91 AuthKey and DLT Template ID to environment. |
| **Admin Login** | Separate console at `/admin/login` | Separate console at `/admin/login` | **Preserved untouched** (Master email + 1-Click access). |

---

## 5. Errors & Incomplete Features Identified

1. **Missing SMS Gateway Credentials:**
   In `.env.local`, no telecom credentials are configured:
   ```bash
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_VERIFY_SERVICE_SID=
   ```
   No MSG91 variables (`MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`) exist yet.
2. **Direct Supabase Phone Auth Limitation:**
   Calling `supabase.auth.signInWithOtp({ phone: '+91...' })` directly returns:
   `HTTP 400 Unsupported phone provider`
   Because Supabase requires either:
   - Enabling a paid Twilio/MessageBird integration in Supabase Dashboard, OR
   - Configuring the **Supabase Send SMS Hook (`custom_sms_provider`)** pointing to a webhook endpoint that invokes MSG91!
3. **Customer Password Legacy Fields:**
   Customer registration and login currently include password fields that must be cleanly removed to enforce the strict "Mobile OTP Only" policy.

---

## 6. Phase 1 Conclusion & Audit Sign-Off

The existing codebase is structurally sound, uses modern Next.js 16 Server Actions, has valid Supabase PostgreSQL schema with RLS, and maintains clean separation between customer and store administrator journeys. The backend is ready for Phase 2: Architectural Decision.

