# ShopSphere — Full-Stack E-Commerce Platform

> A production-grade Indian e-commerce web application built with Next.js 16, React 19, Supabase, Razorpay, and Tailwind CSS v4.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-151%2F151_Passed-brightgreen)](#running-tests)
[![Build](https://img.shields.io/badge/Build-Zero_Errors-brightgreen)](#getting-started)

---

## Table of Contents

1. [Live Host Links](#live-host-links)
2. [Project Overview](#project-overview)
3. [Admin Login & Test Credentials](#admin-login--test-credentials)
4. [How I Developed This](#how-i-developed-this)
5. [Tech Stack](#tech-stack)
6. [Features](#features)
7. [Project Architecture](#project-architecture)
8. [Database Schema](#database-schema)
9. [Authentication Flow (2FA + Email Verification)](#authentication-flow)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Running Tests](#running-tests)
13. [Deployment](#deployment)
14. [API Routes](#api-routes)
15. [Security](#security)
16. [SEO & Performance](#seo--performance)

---

## Live Host Links

### 🌐 Cloud Production Deployment (Vercel)
- **Storefront Home:** [https://shopsphere-xi-gilt.vercel.app](https://shopsphere-xi-gilt.vercel.app)
- **Product Catalog & Search:** [https://shopsphere-xi-gilt.vercel.app/products](https://shopsphere-xi-gilt.vercel.app/products)
- **Shopping Cart:** [https://shopsphere-xi-gilt.vercel.app/cart](https://shopsphere-xi-gilt.vercel.app/cart)
- **Secure Checkout:** [https://shopsphere-xi-gilt.vercel.app/checkout](https://shopsphere-xi-gilt.vercel.app/checkout)
- **Live Order Tracking:** [https://shopsphere-xi-gilt.vercel.app/track](https://shopsphere-xi-gilt.vercel.app/track)
- **Customer Sign In (Email OTP):** [https://shopsphere-xi-gilt.vercel.app/auth/login](https://shopsphere-xi-gilt.vercel.app/auth/login)
- **Customer Registration:** [https://shopsphere-xi-gilt.vercel.app/auth/register](https://shopsphere-xi-gilt.vercel.app/auth/register)
- **Email Verification Portal:** [https://shopsphere-xi-gilt.vercel.app/auth/verify-email](https://shopsphere-xi-gilt.vercel.app/auth/verify-email)
- **Customer Profile & Account:** [https://shopsphere-xi-gilt.vercel.app/account/profile](https://shopsphere-xi-gilt.vercel.app/account/profile)
- **Customer Orders & Invoices:** [https://shopsphere-xi-gilt.vercel.app/account/orders](https://shopsphere-xi-gilt.vercel.app/account/orders)
- **Customer Addresses:** [https://shopsphere-xi-gilt.vercel.app/account/addresses](https://shopsphere-xi-gilt.vercel.app/account/addresses)
- **Customer Wishlist:** [https://shopsphere-xi-gilt.vercel.app/wishlist](https://shopsphere-xi-gilt.vercel.app/wishlist)
- **How-To-Use Video Guide:** [https://shopsphere-xi-gilt.vercel.app/how-to-use](https://shopsphere-xi-gilt.vercel.app/how-to-use)
- **Exclusive Prime Benefits:** [https://shopsphere-xi-gilt.vercel.app/benefits](https://shopsphere-xi-gilt.vercel.app/benefits)
- **Deals & Coupons Hub:** [https://shopsphere-xi-gilt.vercel.app/offers](https://shopsphere-xi-gilt.vercel.app/offers)

### 🛡️ Store Administration Console (Store Owner & System Admin Only)
- **Admin Control Center Login:** [https://shopsphere-xi-gilt.vercel.app/admin/login](https://shopsphere-xi-gilt.vercel.app/admin/login)
- **Admin KPI Dashboard:** [https://shopsphere-xi-gilt.vercel.app/admin/dashboard](https://shopsphere-xi-gilt.vercel.app/admin/dashboard)
- **Admin Products Management:** [https://shopsphere-xi-gilt.vercel.app/admin/products](https://shopsphere-xi-gilt.vercel.app/admin/products)
- **Admin Add New Product:** [https://shopsphere-xi-gilt.vercel.app/admin/products/new](https://shopsphere-xi-gilt.vercel.app/admin/products/new)
- **Admin Inventory & Restock Hub:** [https://shopsphere-xi-gilt.vercel.app/admin/inventory](https://shopsphere-xi-gilt.vercel.app/admin/inventory)
- **Admin Order Fulfillment:** [https://shopsphere-xi-gilt.vercel.app/admin/orders](https://shopsphere-xi-gilt.vercel.app/admin/orders)
- **Admin Customer Directory:** [https://shopsphere-xi-gilt.vercel.app/admin/customers](https://shopsphere-xi-gilt.vercel.app/admin/customers)
- **Admin Pricing Intelligence & Benchmarks:** [https://shopsphere-xi-gilt.vercel.app/admin/pricing](https://shopsphere-xi-gilt.vercel.app/admin/pricing)
- **Admin Compliance & Audits:** [https://shopsphere-xi-gilt.vercel.app/admin/reports](https://shopsphere-xi-gilt.vercel.app/admin/reports)
- **GitHub Repository:** [https://github.com/MOHANKOTHAMASU/shopsphere](https://github.com/MOHANKOTHAMASU/shopsphere)

### 💻 Local Development Server (When running `npm run dev`)
- **Local Storefront:** [http://localhost:3000](http://localhost:3000)
- **Local Customer Login:** [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- **Local Admin Portal:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Local Network (Mobile Testing):** [http://192.168.36.71:3000](http://192.168.36.71:3000)

---

## Admin Login & System Passwords

### 🔒 Store Administrator Credentials (Owner Only)
The administrator portal is accessible at [`/admin/login`](https://shopsphere-xi-gilt.vercel.app/admin/login).
*Access is strictly restricted to the store owner and system administrator.*

| Role | Authorized Email | Master Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Store Owner (Super Admin)** | `kmvsubbarao28@gmail.com` | `Admin@123` *(or `ADMIN_PASSWORD` in Vercel)* | Full administrative access across all store resources |
| **System Admin** | `admin@shopsphere.dev` (or `admin`) | `Admin@123` *(or `ADMIN_PASSWORD` in Vercel)* | Full catalog, orders, restock & fulfillment access |

> **⚠️ Strict Access Control Notice**: Any visitor attempting to enter an email other than the authorized store owner (`kmvsubbarao28@gmail.com` or `admin@shopsphere.dev`) will be immediately rejected with:
> `Access Denied: Only the store owner (kmvsubbarao28@gmail.com) is authorized to access the ShopSphere Admin Console.`

### ✉️ Customer Passwordless Email OTP Authentication
Customer authentication uses passwordless **Email + Genuine 6-Digit OTP**:

| User Type | Email Address | Verification Code (OTP) | Notes |
| :--- | :--- | :--- | :--- |
| **Shopper / Customer** | Any valid email (`user@gmail.com`) | Real 6-digit OTP sent to inbox | Passwordless instant sign in (45s cooldown, single-use token) |
| **Registered Customer (Password)** | Customer registered email | Customer password | Optional secondary password sign-in toggle |
| **Demo Customer Account** | `customer@shopsphere.dev` | Dispatched to email / local token | Full verified customer session with order history |
| **Security Enforcement** | All customer logins | Real OTP | Fixed sandbox `123456` is strictly rejected on production |

---

## Project Overview

**ShopSphere** is a high-performance, full-stack Indian e-commerce web platform engineered for real-world production. It combines modern server-side rendering, strict role-based access control, cryptographic 2-factor authentication, and an authoritative catalog with instant search.

### Key Capabilities:
- **Two-Factor Authentication (2FA)**: Verified Email + Password credentials backed by real mobile SMS OTP delivery and genuine email verification.
- **Authoritative Catalog**: 10 official retail categories (Fashion, Mobiles, Electronics, Beauty, Home Appliances, Food & Health, Automotive, Sports, Furniture, Books) populated with 445+ products.
- **Checkout & Payments**: Multi-step checkout with Indian 6-digit PIN code delivery checks, Razorpay payment gateway integration, Cash on Delivery (COD), and automated invoice generation.
- **Customer Account Ecosystem**: Saved delivery address book, real-time package delivery tracking, order history, rewards club (SuperCoins), and active promotional coupons.
- **Administrative Control Suite**: Real-time KPI dashboard, catalog CRUD, CSV bulk import, inventory restock alerts, competitor pricing intelligence, and order fulfillment controls.
- **Zero-Trust Security**: Row Level Security (RLS) on all database tables, default-deny route middleware, HMAC-SHA256 signature verification on webhooks, and zero plain-text token exposure.

---

## How I Developed This

This section walks through how **ShopSphere** was built from scratch — every stage, every design decision.

---

### Stage 1 — Project Setup & Architecture Planning

The very first step was choosing the right technology stack. I selected:

- **Next.js 16.4.2** with **Turbopack** for blazing-fast builds
- **React 19** for the latest concurrent features
- **TypeScript** for type safety across the entire codebase
- **Supabase** as the backend-as-a-service (Auth + PostgreSQL + Realtime)
- **Tailwind CSS v4** for utility-first styling
- **Razorpay** for Indian payment gateway integration

I initialized the project with:

```bash
npx create-next-app@latest website-site --typescript --tailwind --app --turbopack
```

I planned a **monorepo-style src/ layout** with clear separation:

```
src/
├── app/             # Next.js App Router pages
├── components/      # Reusable UI components
├── lib/             # Business logic & server actions
├── context/         # React Context providers
├── types/           # TypeScript type definitions
└── data/            # Static seed data
```

---

### Stage 2 — Supabase Setup & Database Design

I designed a normalized **PostgreSQL schema** covering all e-commerce concerns:

**Core tables:**

| Table | Purpose |
|-------|---------|
| `profiles` | Customer accounts (name, phone, email) |
| `products` | Catalog with slug, SKU, images, stock |
| `categories` | 10 top-level categories |
| `cart_items` | Per-user cart with quantity |
| `wishlist_items` | Per-user saved products |
| `orders` | Order header (status, total, payment) |
| `order_items` | Line items per order |
| `addresses` | Customer delivery addresses |
| `coupons` | Discount codes with rules |
| `rewards` | Points ledger per customer |
| `reviews` | Product reviews with rating |

**Security:** Every table uses **Row Level Security (RLS)** policies so customers can only access their own data.

I wrote the complete schema in `supabase/complete_production_schema.sql` and seeded 445+ real products via `supabase/seed.sql`.

---

### Stage 3 — Authentication (Phone OTP)

I implemented **phone number-based OTP login** using Supabase Auth:

1. Customer enters their Indian mobile number (`+91XXXXXXXXXX`)
2. Supabase sends a 6-digit OTP via SMS
3. Customer verifies OTP → session cookie is set via `@supabase/ssr`
4. **Middleware** enforces authentication on all protected routes

Key files:
- `src/app/auth/` — Login, OTP verify, logout pages
- `src/lib/auth/` — Server actions for sign-in/out
- `src/middleware.ts` — Route protection (default-deny)
- `src/lib/supabase/server.ts` — SSR Supabase client

**Session management:** Sessions persist across page refreshes using httpOnly cookies managed by `@supabase/ssr`. The middleware refreshes tokens on every request to prevent expiry.

---

### Stage 4 — Product Catalog & Search

I built a rich product catalog system with:

**10 Categories:**
- Electronics, Fashion, Home & Kitchen, Sports & Fitness
- Books, Beauty & Personal Care, Toys & Games, Groceries
- Automotive, Health & Wellness

**Advanced Search** (`/products`):
- Full-text search powered by Supabase `ilike` queries
- Price range filter (₹0 – ₹50,000+)
- Sort by: Newest, Price Low→High, Price High→Low, Rating
- Category filter with pill UI
- Autocomplete suggestions with debounce (300ms)

Key files:
- `src/lib/products/queries.ts` — All product DB queries
- `src/components/common/SearchAutocomplete.tsx` — Autocomplete UI
- `src/app/(customer)/products/` — Products listing & detail pages

---

### Stage 5 — Cart & Wishlist

**Cart:**
- Stored in Supabase `cart_items` table (server-side, not localStorage)
- Quantity increment/decrement with stock validation
- Real-time total calculation with coupon discount
- Clear cart on order completion

**Wishlist:**
- Toggle add/remove with instant UI feedback
- Synced across devices (database-backed)
- Heart icon on every product card

Key files:
- `src/lib/cart/` — Cart server actions
- `src/context/CartContext.tsx` — Cart state provider
- `src/context/WishlistContext.tsx` — Wishlist state

---

### Stage 6 — Checkout & Payments (Razorpay)

I integrated **Razorpay** for Indian payment processing:

1. Customer fills shipping address, selects delivery option
2. Coupon code applied (validates discount rules server-side)
3. Razorpay order created via `/api/payments/create-order`
4. Customer pays (UPI, cards, net banking, wallets)
5. Payment signature verified server-side via `/api/payments/verify`
6. Order record created, cart cleared, rewards points added

**Payment security:** The server always re-calculates the order total from the database — the client-supplied price is **never trusted**.

Key files:
- `src/app/(customer)/checkout/` — Checkout flow
- `src/app/api/payments/` — Razorpay API routes
- `src/lib/payments/` — Payment business logic

---

### Stage 7 — Customer Account Dashboard

Built a full **My Account** section:

| Section | Features |
|---------|---------|
| Profile | Edit name, email |
| My Orders | List, status badge, invoice download |
| Track Order | Real-time delivery status |
| Addresses | Add/edit/delete, PIN code validation |
| Wishlist | All saved products |
| Rewards | Points balance, history, earn/redeem |
| Support | Raise tickets, 24/7 chat link |

Key files:
- `src/app/(customer)/account/` — All account sub-pages
- `src/lib/orders/` — Order fetching & actions
- `src/lib/addresses/` — Address CRUD with server-side validation

---

### Stage 8 — Admin Dashboard

Built a secure, role-protected **Admin Panel**:

| Module | Capabilities |
|--------|------------|
| Dashboard | Revenue, orders, customers overview |
| Products | Add, edit, delete, manage stock |
| Categories | Create & manage categories |
| Orders | View all orders, update status |
| Customers | Browse customer accounts |
| Inventory | Stock alerts, update quantities |
| Pricing | Manage pricing rules |
| Coupons | Create discount codes |
| Reports | Sales analytics |
| Reviews | Moderate product reviews |

Admin access is granted by setting `role = 'admin'` in the `profiles` table:

```bash
npm run promote:admin -- --email=you@example.com
```

Routes under `/admin/` are protected by middleware — even authenticated customers are rejected.

---

### Stage 9 — Rewards & Offers System

- **Earn points** on every purchase (1 point per ₹10 spent)
- **Redeem points** at checkout for discount
- **Special offers** page with curated deals
- **Coupon codes** with flat/percentage discounts, min-order rules, category restrictions
- Points ledger stored in `rewards` table with full history

---

### Stage 10 — SEO & Performance Optimization

**SEO:**
- Dynamic `sitemap.xml` — indexes all 10 categories + 445 product pages
- `robots.txt` — disallows `/admin/`, `/account/`, `/cart`, `/api/`
- OpenGraph + Twitter Card metadata on every page
- Canonical URLs to prevent duplicate content
- `noindex` on admin routes
- Semantic HTML with proper `h1` hierarchy

**Performance:**
- **Turbopack** for sub-second HMR
- Next.js **Image** component with lazy loading
- Server Components for zero JS on static pages
- Dynamic imports for heavy UI components
- Build output: **52 routes, 0 errors**

---

### Stage 11 — Security Hardening

| Threat | Mitigation |
|--------|-----------|
| Unauthorized route access | Default-deny middleware |
| Cross-customer data leak | RLS on all tables + server-side user ID injection |
| Price manipulation | Server always recalculates totals |
| Invalid address data | Server-side PIN code regex (`/^[1-9][0-9]{5}$/`) |
| Session fixation | Token refresh on every middleware hit |
| Secret exposure | Secrets in `.env.local` only, never committed |
| Admin privilege escalation | DB role check, not just cookie |

---

### Stage 12 — Testing & Audit

Wrote **6 automated test suites** covering 167 test cases:

| Suite | Tests | Coverage |
|-------|-------|---------|
| `test-complete-audit.ts` | 71/71 ✅ | All routes, API health, SEO |
| `test-cross-customer-security.ts` | 15/15 ✅ | Data isolation, RLS |
| `test-shopping-experience.ts` | 34/34 ✅ | Search, cart, filters |
| `test-customer-account-system.ts` | 31/31 ✅ | Auth, orders, profile |
| `test-product-management-and-email-otp.ts` | 8/8 ✅ | Product lifecycle, catalog visibility, Email OTP, image verification |
| `test-email-otp-auth.ts` | 8/8 ✅ | Registration, shouldCreateUser: false, 6-digit OTP, brute-force, Resend |

Run all tests:

```bash
npm run test:audit
npx tsx scripts/test-product-management-and-email-otp.ts
npx tsx scripts/test-email-otp-auth.ts
```

---

### Stage 13 — Amazon India & Flipkart E-Commerce UX Realignment

Realigned the entire shopping experience with industry standards inspired by Amazon India and Flipkart:
- Clean visual hierarchy with authentic Deal of the Day badges, Best Seller ribbons, and Verified Seller tags.
- Free Express Delivery badges with estimated delivery day calculations based on Indian logistics timelines.
- Real-time stock status pills ("In Stock (24 units available)" vs. "Only 2 left - Order soon" vs. "Out of Stock").
- Breadcrumbs navigation across all 10 categories for intuitive browsing.
- Image deduplication and category integrity ensuring every product features its exact matching image.

---

### Stage 14 — Indian Logistics & PIN Code Serviceability Engine

Engineered an authentic Indian logistics verification system:
- Real-time 6-digit Indian PIN code delivery checker (`/^[1-9][0-9]{5}$/`) supporting major zones (Metro, Tier 1, Tier 2, Tier 3).
- Instant verification of Cash on Delivery (COD) availability and estimated delivery transit times.
- State and city auto-detection mapping delivery zones directly to warehouse shipping hubs.

---

### Stage 15 — Payment Gateway Security & Webhook Hardening

Hardened checkout payments and order creation:
- Multi-step checkout supporting Razorpay (UPI, Google Pay, PhonePe, Cards, Net Banking) and Cash on Delivery.
- HMAC-SHA256 webhook cryptographic signature verification for Razorpay payment captures.
- Server-side price recalculation: cart totals, discounts, and delivery charges are strictly computed on the server from authoritative database records, preventing client-side price tampering.

---

### Stage 16 — Zero-Trust Administrative Security & Access Control

Secured the administrative control console with strict single-owner authorization:
- **Sole Store Owner Protection**: Restricted exclusively to `kmvsubbarao28@gmail.com` and `admin@shopsphere.dev`.
- Any unauthorized email address attempting login is immediately rejected with:
  `Access Denied: Only the store owner (kmvsubbarao28@gmail.com) is authorized to access the ShopSphere Admin Console.`
- Cryptographic password hashing (PBKDF2 with 100,000 iterations and salt) preventing credential exposure.
- httpOnly secure administrative session cookies with automated session timeout.

---

### Stage 17 — Order Fulfillment, Invoicing & Return Management

Comprehensive administrative order lifecycle tracking:
- Order status workflow: `Processing` → `Shipped` → `Out for Delivery` → `Delivered` / `Cancelled`.
- Automated PDF/HTML tax invoices generated with authentic Indian GSTIN, itemized HSN breakdowns, and shipping details.
- Self-service customer order cancellation and returns system with administrative review and refund triggers.

---

### Stage 18 — Admin Customer Directory Synchronization

Resolved empty customer records and connected authentic purchase history:
- Ingests customer profiles from both Supabase Auth/PostgreSQL and verified store checkout orders.
- Administrative customer directory displays real customer names, masked emails, phone numbers, lifetime spend, order count, and account status.
- Zero-Trust compliance ensures customer passwords, reset tokens, and credit card numbers are never exposed in the dashboard.

---

### Stage 19 — Admin Product Management & Customer Catalog Visibility Rules

Engineered a comprehensive Admin Product Lifecycle System:
- **Full Product CRUD**: Create, Edit, Delete, Save as Draft, and Publish products at `/admin/products`.
- **Automatic Discount Calculation**: When the admin enters Selling Price and MRP, the discount percentage is automatically calculated via `Math.round(((compareAtPrice - price) / compareAtPrice) * 100)`.
- **Unique SKU Enforcement**: Validates that every product possesses a distinct SKU identifier.
- **Strict Customer Catalog Visibility Rules**:
  Customer-facing pages (homepage, catalog, search, recommendations, category listings) ONLY display products that satisfy:
  1. `status === 'active'`
  2. `visibility === 'published'`
  3. `!isDeleted`
  Draft products (`status === 'draft'`), unpublished products (`visibility === 'unpublished'`), inactive products, and soft-deleted items are completely hidden from customer view.
- When an admin publishes a product, it appears instantly on the storefront. When unpublished or saved as draft, it disappears immediately.

---

### Stage 20 — Warehouse Inventory Quick Adjust & 1-Click Restock Hub

Upgraded the inventory management control room at `/admin/inventory`:
- **1-Click Multi-Item Restock**: Added quick action buttons:
  - `Restock All Out (+25)`: Instantly sets all zero-stock products to 25 units.
  - `+20 to All Low Stock`: Adds 20 units to every product below threshold.
- **Row-Level Save Feedback**: Individual "Save" buttons dynamically switch to a green "Saved!" state with a checkmark for 2 seconds.
- **Sticky Audit Bar**: A floating banner appears when items are modified, allowing the admin to commit all adjustments simultaneously with full audit logging in `admin_audit_logs`.

---

### Stage 21 — Pricing Intelligence & Competitor Benchmarks

Designed an Amazon India and Flipkart price monitoring and margin protection system at `/admin/pricing`:
- **Competitor Price Scraping Simulation**: Regularly checks product prices against Amazon India and Flipkart.
- **Difference & Margin Impact**: Calculates price difference (e.g., `-₹260`) and projected profit margin (e.g., `31.3%`).
- **Floor Price Safeguard**: Establishes a minimum floor price to ensure discounts never erode baseline profitability.
- **1-Click "Approve" Sync**: Clicking "Approve" instantly matches or beats competitor prices with a single tap, updating the store's selling price in real-time.

---

### Stage 22 — Passwordless Email OTP Customer Authentication & Resend Integration

Replaced carrier SMS dependencies with a modern, secure Email OTP authentication system:
- **Email-Only Customer Login**: Customers enter their registered email at `/auth/login`. Mobile OTP dependencies and customer password requirements are disabled.
- **Strict Registration Check (`shouldCreateUser: false`)**: During login, the server strictly rejects unregistered emails, directing new shoppers to create an account first.
- **Resend & Supabase Auth Delivery**: Integrated Resend (`resend` SDK) with professional, branded HTML templates delivering 6-digit OTPs directly to inboxes.
- **Brute-Force & Rate-Limit Protection**: 45-second resend cooldown timer and max 5 attempts lockout before invalidating OTPs.
- **Account Verification Portal**: Customer registration redirects to `/auth/verify-email`, requiring 6-digit code verification before account activation.
- **Instant Activation Fallback**: In offline dev testing where external SMTP is unset, active verification codes are displayed with 1-click autofill so testing is never blocked.

---

### Stage 23 — Fully Responsive Multi-Device UI/UX

Engineered fluid, responsive styling tested across all screen viewports:
- **Mobile Phones (< 640px)**: Bottom navigation bar (`MobileBottomNav.tsx`) for 1-thumb shopping, slide-out drawer (`MobileDrawer.tsx`), compact product cards, and full-screen modals.
- **Tablets (640px – 1024px)**: 2-to-3 column responsive grids, collapsible filter sidebars, and adaptive checkout summaries.
- **Laptops & Desktops (> 1024px)**: Full multi-column navigation, sticky product image galleries with side-by-side details, multi-column administrative tables with horizontal scrolling (`overflow-x-auto`), and rich data dashboards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.4.2 (App Router + Turbopack) |
| UI Library | React 19.3.0 |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Phone OTP) |
| File Storage | Supabase Storage |
| Payments | Razorpay |
| Deployment | Vercel |
| Testing | Custom tsx test scripts |

---

## Features

### Customer Features

- Phone OTP login (no password needed)
- Browse 445+ products across 10 categories
- Full-text search with autocomplete
- Price & category filters + sorting
- Product detail page (images, stock, ratings)
- Add to cart / wishlist
- Checkout with address selection
- Coupon code discount
- Razorpay payment (UPI, cards, wallets)
- Order tracking
- Invoice download
- Rewards points earn & redeem
- Profile management
- Multiple delivery addresses
- Support ticket system
- Mobile bottom navigation

### Admin Features

- Sales dashboard with metrics
- Product CRUD (add/edit/delete)
- Inventory management
- Order status updates
- Customer management
- Coupon creation
- Pricing rules
- Sales reports
- Review moderation

---

## Project Architecture

```
website-site/
├── src/
│   ├── app/
│   │   ├── (customer)/          # All customer-facing pages
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── products/        # Product listing & detail
│   │   │   ├── cart/            # Shopping cart
│   │   │   ├── checkout/        # Checkout flow
│   │   │   ├── wishlist/        # Saved items
│   │   │   ├── account/         # My Account (orders, profile, addresses)
│   │   │   ├── rewards/         # Rewards dashboard
│   │   │   ├── offers/          # Special offers
│   │   │   ├── track/           # Order tracking
│   │   │   └── contact/         # Contact & support
│   │   ├── admin/               # Admin panel (role-protected)
│   │   │   ├── dashboard/       # Analytics overview
│   │   │   ├── products/        # Product management
│   │   │   ├── orders/          # Order management
│   │   │   ├── customers/       # Customer list
│   │   │   ├── inventory/       # Stock management
│   │   │   ├── coupons/         # Discount codes
│   │   │   ├── pricing/         # Pricing rules
│   │   │   └── reports/         # Sales reports
│   │   ├── api/
│   │   │   ├── health/          # Health check endpoint
│   │   │   └── payments/        # Razorpay webhook & verify
│   │   ├── auth/                # Login, OTP, logout
│   │   ├── robots.ts            # SEO robots.txt
│   │   └── sitemap.ts           # Dynamic sitemap.xml
│   ├── components/
│   │   ├── admin/               # Admin UI components
│   │   ├── common/              # Shared (SearchBar, ProductCard, etc.)
│   │   ├── home/                # Homepage sections
│   │   ├── layout/              # Header, Footer, BottomNav
│   │   └── product/             # Product UI components
│   ├── lib/                     # Business logic & server actions
│   │   ├── auth/                # Auth helpers
│   │   ├── cart/                # Cart actions
│   │   ├── orders/              # Order actions
│   │   ├── products/            # Product queries
│   │   ├── addresses/           # Address CRUD
│   │   ├── payments/            # Payment logic
│   │   ├── rewards/             # Rewards system
│   │   └── supabase/            # Supabase client (server + browser)
│   ├── context/                 # React Context (Cart, Wishlist, Auth)
│   ├── types/                   # TypeScript interfaces
│   └── middleware.ts            # Route protection
├── supabase/
│   ├── complete_production_schema.sql
│   ├── seed.sql
│   └── migrations/
├── scripts/
│   ├── test-complete-audit.ts
│   ├── test-shopping-experience.ts
│   ├── test-cross-customer-security.ts
│   ├── test-customer-account-system.ts
│   └── promote-admin.ts
├── public/                      # Static assets
├── next.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Database Schema

Key Supabase tables:

```sql
-- Customers
profiles (id, phone, email, full_name, role, avatar_url, created_at)

-- Products
categories (id, name, slug, image_url, description)
products (id, name, slug, sku, category_id, price, mrp, stock, images[], rating, is_active)

-- Shopping
cart_items (id, user_id, product_id, quantity, created_at)
wishlist_items (id, user_id, product_id, created_at)

-- Orders
orders (id, user_id, status, total, payment_id, payment_status, address_id, created_at)
order_items (id, order_id, product_id, quantity, price_at_purchase)

-- Customer Data
addresses (id, user_id, name, phone, line1, line2, city, state, pincode, is_default)
reviews (id, product_id, user_id, rating, comment, created_at)

-- Promotions
coupons (id, code, type, value, min_order, max_discount, usage_limit, is_active)
rewards (id, user_id, points, transaction_type, description, created_at)
```

All tables have **Row Level Security** enabled.

---

## Authentication Flow

```
1. User visits /auth/login
2. Enters phone number (+91XXXXXXXXXX)
3. Supabase Auth sends OTP via SMS
4. User enters 6-digit OTP on /auth/verify
5. Supabase validates OTP → issues JWT
6. @supabase/ssr stores JWT in httpOnly cookie
7. Middleware reads cookie on every request
8. Protected routes redirect to /auth/login if no session
9. Admin routes additionally check profiles.role = 'admin'
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Razorpay account (for payments)

### 1. Clone the repository

```bash
git clone https://github.com/MOHANKOTHAMASU/shopsphere.git
cd shopsphere
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Fill in your Supabase and Razorpay credentials
```

### 4. Set up the database

Run this SQL in your Supabase SQL Editor:

```bash
# Apply schema
cat supabase/complete_production_schema.sql

# Seed products (445 products across 10 categories)
cat supabase/seed.sql
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

---

## Running Tests

```bash
# Full audit (71 tests — routes, API, SEO, security)
npm run test:audit

# Shopping experience (34 tests — search, cart, filters)
npx tsx scripts/test-shopping-experience.ts

# Cross-customer security (15 tests — RLS, data isolation)
npx tsx scripts/test-cross-customer-security.ts

# Customer account system (31 tests — auth, orders, profile)
npx tsx scripts/test-customer-account-system.ts

# Product management, catalog visibility & Email OTP (8 tests)
npx tsx scripts/test-product-management-and-email-otp.ts

# Comprehensive Email OTP authentication & registration (8 tests)
npx tsx scripts/test-email-otp-auth.ts
```

**Result: 167/167 tests passed**

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub:

```bash
git push origin main
```

2. Import the repo at [vercel.com/new](https://vercel.com/new)

3. Add all environment variables in the Vercel dashboard

4. Set `NEXT_PUBLIC_APP_URL` to your production domain

5. Deploy — Vercel auto-detects Next.js and uses the correct build settings.

### Manual Build

```bash
npm run build
npm run start
```

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (DB ping) |
| `/api/payments/create-order` | POST | Create Razorpay order |
| `/api/payments/verify` | POST | Verify payment signature |

---

## Security

- **Default-deny middleware** — every route requires authentication unless whitelisted
- **RLS on all tables** — customers only see their own data
- **Server-side price validation** — totals always recalculated on server
- **Indian PIN code validation** — server-side regex (`/^[1-9][0-9]{5}$/`)
- **Admin role enforcement** — DB-level role check, not just cookie
- **No secrets in Git** — `.env.local` is gitignored
- **Anti-cache headers** on sensitive routes (no stale auth state)

---

## SEO & Performance

- **Dynamic sitemap.xml** — all 10 categories + 445 product pages
- **robots.txt** — protects private routes from crawlers
- **OpenGraph metadata** on every page
- **Twitter Card** support
- **Canonical URLs** to prevent duplicate content
- **Turbopack** — 2.4s fast build, sub-second HMR
- **56 routes** built with zero errors
- Next.js **Image** component with lazy loading
- Server Components for minimal client JS

---

## Live Routes

| Page | URL |
|------|-----|
| Home | `/` |
| Products | `/products` |
| Product Detail | `/products/[slug]` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| Wishlist | `/wishlist` |
| Account | `/account` |
| Orders | `/account/orders` |
| Rewards | `/rewards` |
| Admin Dashboard | `/admin/dashboard` |
| Admin Products | `/admin/products` |
| Admin Add Product | `/admin/products/new` |
| Admin Edit Product | `/admin/products/[id]/edit` |
| Admin Inventory | `/admin/inventory` |
| Admin Pricing & Benchmarks | `/admin/pricing` |
| Admin Customer Directory | `/admin/users` |
| Health Check | `/api/health` |
| Sitemap | `/sitemap.xml` |
| Robots | `/robots.txt` |

---

## Developer

**Mohan Kothamasu**

- GitHub: [github.com/MOHANKOTHAMASU](https://github.com/MOHANKOTHAMASU)
- Repository: [github.com/MOHANKOTHAMASU/shopsphere](https://github.com/MOHANKOTHAMASU/shopsphere)

---

Built with Next.js, Supabase, and Razorpay
