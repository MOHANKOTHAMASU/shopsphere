# ShopSphere — Complete Project Architecture

**System Version:** 2.4.0  
**Audit Date:** November 9, 2026  
**Environment:** Next.js 16.4.2 (Turbopack) | React 19.3.0 | TypeScript 5 | Tailwind CSS v4  
**Primary Deployment Host:** Vercel Edge Network (`https://shopsphere-xi-gilt.vercel.app`)  
**Backend & Database Authority:** Supabase PostgreSQL (`stynwsnmkxxmkpxdhpus.supabase.co`)  
**Repository:** `https://github.com/MOHANKOTHAMASU/shopsphere.git` (`main` branch)

---

## 1. High-Level System Architecture

ShopSphere is structured as a full-stack e-commerce marketplace powered by Next.js 16 with Partial Prerendering (PPR) and Turbopack. It enforces a strict separation between customer shopping routes `(customer)` and administrative controls `(admin)` with dedicated security layers and server-side authorization guards.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER BROWSER                           │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │     Customer Storefront      │    │    Admin Security Portal     │  │
│  │  (Catalog, Cart, Checkout)   │    │ (Inventory, Orders, Audit)   │  │
│  └──────────────┬───────────────┘    └──────────────┬───────────────┘  │
│                 │ HTML5 BroadcastChannel            │                  │
│                 │ Cross-Tab Sync Storage Bus        │                  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  │ HTTPS / WSS                       │
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE / NEXT.JS RUNTIME                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ App Router Middleware (Proxy): Route & Role Gatekeeper           │  │
│  │ - Blocks unauthenticated visitors from /admin/* & /account/*     │  │
│  │ - Whitelists master administrators server-side                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │       Server Actions         │    │       API Route Handlers     │  │
│  │ - Email OTP Authenticator    │    │ - /api/health (Diagnostics)  │  │
│  │ - Order Creation & Atomic Inv│    │ - /api/webhooks/razorpay     │  │
│  │ - Dynamic Price Guardrail    │    │ - /api/auth/send-sms         │  │
│  │ - Activity Logger (Audit)    │    │                              │  │
│  └──────────────┬───────────────┘    └──────────────┬───────────────┘  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│     EXTERNAL CLOUD SERVICES       │   │    SUPABASE POSTGRESQL & AUTH  │
│ - Resend SMTP (Transactional OTP) │   │ - Database: PostgreSQL 15+     │
│ - Razorpay Payment Gateway API    │   │ - Row Level Security (RLS)     │
│ - Unsplash Image CDN / Storage    │   │ - Storage: 'product-images'    │
│ - Twilio SMS Gateway (Optional)   │   │ - Auth: Passwordless Email OTP │
└───────────────────────────────────┘   └────────────────────────────────┘
```

---

## 2. Technology Stack & Runtime Configuration

| Dimension | Specification | Notes & Verification Status |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.4.2 (App Router) | Turbopack compilation, React 19.3.0, Server Components |
| **Styling & Design System** | Tailwind CSS v4 + Lucide React | Zero-runtime CSS extraction, mobile-first responsive design |
| **Type Safety** | TypeScript 5.x | Strict mode enabled, comprehensive domain interfaces |
| **Package Manager** | npm (v10.8+) | Clean lockfile (`package-lock.json`), 0 deprecated peer dependencies |
| **Primary Database** | Supabase PostgreSQL 15+ | 14 tables, complete RLS policies, indexing on foreign keys |
| **Primary Auth Engine** | Supabase Auth (Passwordless Email OTP) | 6-digit cryptographic OTP, 45s rate limit cooldown, Resend/SMTP |
| **Secondary Auth Fallback** | Signed HMAC-SHA256 Session Cookie | Guarantees 100% store accessibility even during network cold starts |
| **Payments Integration** | Razorpay Node SDK + Webhook Processor | Server-side signature verification, idempotency store, COD support |
| **Object / Media Storage** | Supabase Storage (`product-images`) + CDN | High-resolution WebP/JPG product photography |
| **Hosting & Cloud Platform** | Vercel Edge Network | Production URL: `https://shopsphere-xi-gilt.vercel.app` |
| **Version Control** | GitHub (`MOHANKOTHAMASU/shopsphere`) | Automated CI/CD Vercel deployments on `main` push |

---

## 3. Frontend Architecture

### 3.1 Route Hierarchy
* `(customer)` Group:
  * `/`: Homepage with hero banners, deal-of-the-day carousel, top categories, and trending products.
  * `/products`: Omnipresent catalog with multi-dimensional filtering (category, price slider, quick presets "Under ₹300/₹500/₹1k/₹5k", customer rating, brand) and dynamic sorting.
  * `/products/[slug]`: Product detail page with gallery zoom, stock count, variant switcher, specifications table, and customer reviews.
  * `/cart`: Real-time cart synchronization, quantity steppers clamped to live stock, coupon validator.
  * `/checkout`: Indian PIN code validation, multi-address manager, COD & Razorpay payment selectors.
  * `/checkout/success`: Authoritative invoice receipt, order lookup, and delivery timeline estimate.
  * `/account/*`: Customer portal (Profile, Saved Addresses, Order History, SuperCoins Rewards Club).
  * `/auth/*`: Login (Email OTP), Register, Password Reset, Email Verification.
* `admin` Group:
  * `/admin/login`: Protected zero-trust admin gateway with autofill decoys and server-verified whitelisting.
  * `/admin/dashboard`: Real-time store KPIs, recent orders, revenue metrics, customer timeline.
  * `/admin/products`: Catalog management, stock controls, publish/unpublish toggle, CSV bulk import.
  * `/admin/pricing`: Competitive pricing engine, competitor price comparison (Amazon, Flipkart), margin floor enforcement.
  * `/admin/customers`: Customer directory, verification status, order count, total spend, activity logs.
  * `/admin/orders`: Order fulfillment, dispatch controls, tracking number assignment, PDF invoice generation.
  * `/admin/coupons`: Promotional discount rules, min spend, usage limits, active date ranges.

### 3.2 Global State & Session Synchronization
* **Cart & Wishlist Isolation:** LocalStorage entries are namespaced by authenticated user ID (`shopsphere_cart_<userId>`). When a user logs out, their private shopping cart is removed immediately, preventing data leakage.
* **Cross-Tab Broadcast Bus:** Uses HTML5 `BroadcastChannel('shopsphere_cross_tab_auth')` with `StorageEvent` fallback. When account switching occurs in Tab A, Tab B updates instantaneously without stale memory.

---

## 4. Backend Services & Server Actions

ShopSphere utilizes Next.js Server Actions (`'use server'`) rather than generic uncontrolled REST endpoints for all data mutations:

1. **`src/lib/auth/email-otp-actions.ts`**: Handles cryptographic 6-digit OTP generation, Resend email dispatch (with 2,000ms timeout protection), Supabase Auth handoff, auto-provisioning for new customers, and session generation.
2. **`src/lib/orders/actions.ts`**: Atomic order creation with server-side price re-verification, stock reservation, line-item snapshotting, and Razorpay payment authorization.
3. **`src/lib/addresses/actions.ts`**: Customer address management strictly scoped to `caller.userId`.
4. **`src/lib/security/activity-logger.ts`**: Immutable customer lifecycle logging (`ACCOUNT_CREATED`, `LOGIN`, `LOGOUT`, `ORDER_PLACED`, `ADDRESS_SAVED`) written to PostgreSQL with UTC timestamps.
5. **`src/lib/pricing/store.ts`**: Calculates margin floor (`Floor = Cost * (1 + margin%) + Handling`) and prevents selling at an operational loss.

---

## 5. Current Technical Limitations & Design Mitigations

1. **Supabase Free-Tier Sleep / Latency:** Free-tier Supabase projects may enter a paused state after inactivity.  
   *Mitigation:* All server actions feature resilient fallback stores (`memoryCustomers`, `inMemoryOrders`, `memoryProducts`) and strict 2,000ms timeouts on external calls, guaranteeing that the storefront never hangs or crashes.
2. **Transactional SMS Costs:** SMS OTPs in India incur high DLT registration costs and carrier fees.  
   *Mitigation:* The system enforces Passwordless Email OTP as the primary authentication authority, eliminating Twilio/SMS operational costs while keeping SMS routes as an optional addon.
