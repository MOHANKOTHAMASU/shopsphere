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

1. [Project Overview](#project-overview)
2. [How I Developed This](#how-i-developed-this)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Architecture](#project-architecture)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Running Tests](#running-tests)
11. [Deployment](#deployment)
12. [API Routes](#api-routes)
13. [Security](#security)
14. [SEO & Performance](#seo--performance)

---

## Project Overview

**ShopSphere** is a complete, production-ready Indian e-commerce platform. It includes:

- Phone OTP authentication (Supabase Auth)
- Full cart & checkout with Razorpay payment integration
- Wishlist with persistent sync across devices
- Order management with real-time tracking
- Rewards & coupons system
- Advanced search with filters (price, category, sort)
- 10 product categories with 445+ active products
- Customer account dashboard (addresses, orders, profile)
- Admin dashboard (products, orders, customers, inventory, pricing, reports)
- Mobile-first responsive design with bottom navigation

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

Wrote **4 automated test suites** covering 151 test cases:

| Suite | Tests | Coverage |
|-------|-------|---------|
| `test-complete-audit.ts` | 71/71 ✅ | All routes, API health, SEO |
| `test-cross-customer-security.ts` | 15/15 ✅ | Data isolation, RLS |
| `test-shopping-experience.ts` | 34/34 ✅ | Search, cart, filters |
| `test-customer-account-system.ts` | 31/31 ✅ | Auth, orders, profile |

Run all tests:

```bash
npm run test:audit
```

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
```

**Result: 151/151 tests passed**

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
- **Turbopack** — 7s cold start, under 200ms HMR
- **52 routes** built with zero errors
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
