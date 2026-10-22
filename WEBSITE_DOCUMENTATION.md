# ShopSphere — Master Technical & Architecture Documentation

> **Project Name:** ShopSphere E-Commerce Platform  
> **Repository:** [https://github.com/MOHANKOTHAMASU/shopsphere](https://github.com/MOHANKOTHAMASU/shopsphere)  
> **Version:** 0.1.0 (Production-Ready Architecture)  
> **Architecture Inspiration:** Amazon India & Flipkart Marketplace Models  

---

## 1. Project Overview

**ShopSphere** is a full-stack, enterprise-grade e-commerce web platform engineered for modern online retail. Designed around the high-volume operational models of Amazon and Flipkart, ShopSphere combines a customer storefront with an administrative operations console.

### Core Capabilities:
- **Default-Deny Secure Storefront:** Unauthenticated visitors are automatically intercepted by edge middleware and prompted to register or log in before browsing catalog features, managing carts, or placing orders.
- **Curated Multi-Category Marketplace:** A comprehensive catalog of 416 items across 8 distinct retail categories (Smartphones, Laptops, Audio & Headphones, Smartwatches, Luxury Watches, Fashion & Apparel, Home & Kitchen, and Books & Stationery).
- **Category-Calibrated Budget Tiers:** Intelligent price classification tailored to specific product categories (e.g., Budget earphones under ₹4,999 vs. Budget laptops under ₹40,000) with real-time Indian retail competitor price comparisons.
- **Zero-Trust Pricing & Cart Integrity:** Client-side prices submitted from the browser are strictly rejected by server actions. Product pricing, discounts, and order subtotals are always computed and locked on the server.
- **Dual-Mode Backend Engine:** Seamlessly transitions between a local in-memory persistence store (for zero-latency development and sandbox testing) and a live PostgreSQL database hosted on Supabase.
- **Complete Administrative ERP:** A dedicated dashboard for catalog management, stock replenishment, order status updates, coupon campaigns, and customer user auditing.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.2` | Server Components, Server Actions, Edge Middleware, Static Prerendering |
| **Runtime UI** | React / React DOM | `19.3.0` | Declarative UI, Concurrent Rendering, Suspense streaming |
| **Styling** | Tailwind CSS / PostCSS | `v4.0` | High-performance CSS engine with custom utility classes |
| **Icons** | Lucide React | `^1.60.0` | Accessible vector icon set |
| **Language** | TypeScript | `^5.0` | Strict type safety across client and server boundaries |
| **Database** | PostgreSQL / Supabase | `^2.118.0` | Relational database, Row Level Security (RLS), and schema triggers |
| **Auth Bridge** | `@supabase/ssr` | `^0.12.7` | Cookie-based SSR session management across server components & middleware |
| **Payments** | Razorpay Node SDK | `^2.9.8` | Indian payment gateway (UPI, Cards, Netbanking) with HMAC-SHA256 signature verification |
| **Dev Tooling** | TSX / Node.js | Node 24 | High-speed TypeScript execution for background audit and maintenance scripts |

---

## 3. Folder and File Structure

```
website-site/
├── .agents/                      # Custom AI agent skills and configuration
├── docs/                         # Project architecture reference notes
├── public/                       # Static media, icons, and assets
├── reports/                      # Security audits, performance benchmarks, and pricing reports
│   ├── AUTHENTICATION_AUDIT.md   # Complete authentication enforcement report
│   └── ...
├── scripts/                      # Automated validation suites and database tooling
│   ├── build-catalog-400.mjs     # 416-product catalog generator
│   ├── promote-admin.ts          # CLI script to grant admin privileges to users
│   ├── test-authentication-enforcement.mjs # 30-assertion access control test
│   ├── test-cross-customer-security.ts     # 15-assertion customer isolation test
│   ├── test-customer-auth.ts     # 49-assertion customer auth & RBAC audit
│   ├── test-phase9.ts            # 97-assertion comprehensive production audit
│   ├── test-phase10-all.mjs      # Catalog and overselling protection audit
│   ├── test-pricing-suite.mjs    # 37-assertion pricing & competitor benchmark test
│   └── test-product-sync.ts      # Admin-to-customer storefront real-time sync test
├── src/
│   ├── app/                      # Next.js App Router (Routes & Layouts)
│   │   ├── (customer)/           # Customer Storefront Route Group
│   │   │   ├── account/          # Customer dashboard, orders, addresses, profile
│   │   │   ├── auth/             # Login, register, forgot-password (OTP), reset-password
│   │   │   ├── cart/             # Shopping cart management page
│   │   │   ├── checkout/         # Multi-step checkout with COD and Razorpay
│   │   │   ├── contact/          # Customer inquiries & helpdesk form
│   │   │   ├── products/         # Catalog search, filter, and detail pages
│   │   │   ├── track/            # Real-time order delivery milestone tracker
│   │   │   ├── wishlist/         # Saved items collection
│   │   │   └── page.tsx          # Homepage with hero slider, deals, and featured categories
│   │   ├── admin/                # Administrator Operations Console
│   │   │   ├── categories/       # Category management
│   │   │   ├── coupons/          # Promotional discount codes management
│   │   │   ├── customers/        # Customer directory and status management
│   │   │   ├── dashboard/        # Executive metrics, revenue analytics, stock alerts
│   │   │   ├── inventory/        # Restock tools and low-stock monitor
│   │   │   ├── login/            # Dedicated administrator portal login
│   │   │   ├── orders/           # Order fulfillment, shipment dispatch, status updater
│   │   │   ├── pricing/          # Competitor benchmarks and price approval queue
│   │   │   ├── products/         # Product catalog CRUD and bulk CSV import
│   │   │   ├── reports/          # Financial summaries and export tools
│   │   │   ├── reviews/          # Customer review moderation
│   │   │   └── users/            # Customer account directory with privacy masking
│   │   ├── api/                  # API Route Handlers
│   │   │   ├── health/           # Health check and engine diagnostic endpoint
│   │   │   └── webhooks/razorpay # Cryptographic payment webhook receiver
│   │   ├── auth/callback/        # Supabase OAuth and magic link token exchange
│   │   ├── layout.tsx            # Global layout with providers and top notification bar
│   │   └── globals.css           # Global stylesheet and Tailwind directives
│   ├── components/               # Reusable React UI Components
│   │   ├── admin/                # Admin navigation bar, sidebar, and metric widgets
│   │   ├── common/               # PriceDisplay, RatingStars, badges, and modals
│   │   ├── home/                 # HeroBanner, DealsSection, CategoryGrid, TrustBar
│   │   ├── layout/               # Header, Footer, MobileDrawer, SearchBar
│   │   └── product/              # ProductCard, ProductGrid, ProductGallery, Reviews
│   ├── context/                  # React Context Providers (Client State)
│   │   ├── AuthContext.tsx       # User session state and profile synchronization
│   │   ├── CartContext.tsx       # Shopping cart items, subtotals, and persistence
│   │   └── WishlistContext.tsx   # Saved products collection
│   ├── data/                     # Seed Catalog Repositories
│   │   ├── category-thresholds.ts# Category-specific budget/mid/premium pricing tiers
│   │   ├── seed-categories.ts    # 8 curated marketplace categories
│   │   ├── seed-products-data.ts # Comprehensive 416-product seed dataset
│   │   └── seed-products.ts      # Active catalog loader
│   ├── lib/                      # Core Business Logic & Server Actions
│   │   ├── addresses/            # Customer delivery address book actions
│   │   ├── admin/                # Administrative dashboard actions and in-memory store
│   │   ├── auth/                 # Authentication actions, validation, and demo sessions
│   │   ├── cart/                 # Server-side cart validation and synchronization
│   │   ├── orders/               # Order placement, status tracking, coupon validation
│   │   ├── payments/             # Razorpay payment orders and HMAC verification
│   │   ├── pricing/              # Pricing engine, competitor benchmarks, cost floors
│   │   ├── products/             # Data access layer queries for search and filters
│   │   ├── security/             # Rate limiters and open redirect sanitization
│   │   └── supabase/             # Supabase SSR clients (server, client, admin)
│   ├── middleware.ts             # Route protection middleware & anti-bfcache headers
│   └── types/                    # TypeScript Data Interfaces
│       ├── ecommerce.ts          # Core entities (User, Product, Order, Address, etc.)
│       └── pricing.ts            # Competitor benchmarks and pricing tier interfaces
├── supabase/
│   ├── complete_production_schema.sql # 100% idempotent master database SQL schema
│   └── seed.sql                  # Initial database seeds
├── .env.example                  # Template of required environment variables
├── .env.local                    # Active local environment variables
├── next.config.ts                # Next.js configuration (images, turbopack, headers)
├── package.json                  # Dependencies, scripts, and build metadata
└── tsconfig.json                 # TypeScript compiler options
```

---

## 4. Setup Instructions

### Prerequisites
- **Node.js:** v20.x or higher (v24.x recommended)
- **Package Manager:** `npm` (comes with Node.js)
- **Git:** Installed and configured

### Step-by-Step Local Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/MOHANKOTHAMASU/shopsphere.git
   cd shopsphere
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   *For local development and testing, ShopSphere functions out-of-the-box using built-in memory stores. To connect a live Supabase backend, update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser to: **`http://localhost:3000`**

5. **Run the Full Automated Test Suite:**
   ```bash
   npm run test:audit
   ```
   *(Executes all 97 automated production readiness checks across authentication, cart calculation, overselling prevention, and security).*

---

## 5. Registration and Login Workflow

### Complete Customer Authentication Lifecycle

```mermaid
graph TD
    A[Visitor opens ShopSphere URL] --> B{Authenticated Session?}
    B -- No --> C[Redirect to /auth/login]
    B -- Yes --> D[Grant Access to Protected Storefront]
    
    C --> E[Choose: Sign In or Register]
    E -- New User --> F[Open /auth/register]
    E -- Existing User --> G[Submit Email & Password]
    
    F --> H[Enter Full Name, Email, Phone, Password, Address]
    H --> I[Server Action: signUpAction]
    I --> J{Duplicate Email?}
    J -- Yes --> K[Show Error: Account already exists]
    J -- No --> L[Create Account & Store Session]
    L --> D
    
    G --> M[Server Action: signInAction]
    M --> N{Valid Credentials?}
    N -- No --> O[Show Generic Error: Invalid email or password]
    N -- Yes --> P[Set Secure HTTP-Only Session Cookie]
    P --> D
    
    C -- Forgot Password --> Q[Open /auth/forgot-password]
    Q --> R[Enter Email Address]
    R --> S[Server generates 6-Digit OTP]
    S --> T[Enter 6-Digit OTP + New Password]
    T --> U[Server Action: verifyOtpAndResetPasswordAction]
    U --> V[Password Updated Successfully]
    V --> G
```

### Registration Fields & Validation Rules:
1. **Full Name:** Required, minimum 2 characters.
2. **Email Address:** Required, must conform to RFC 5322 format (e.g., `user@domain.com`).
3. **Phone Number:** Required, supports Indian standard (`+91 98765 43210`) or 10-digit mobile numbers.
4. **Password:** Required, minimum 8 characters with at least one letter and one number.
5. **Confirm Password:** Must match Password exactly.
6. **Street Address, City, State, PIN Code:** Optional during registration, saved directly to the user's primary delivery address book when provided.
7. **Terms Agreement:** Checkbox acceptance required before account creation.

---

## 6. User Guide (Customer Perspective)

### Step 1: Accessing the Storefront
1. Visit `http://localhost:3000/`.
2. Because ShopSphere enforces default-deny access control, unauthenticated visitors are automatically directed to the **Sign In** screen.
3. If you have an account, enter your credentials. If you are a new visitor, click **"Create Account"** or use the **"1-Click Demo Customer Sign In"** button for immediate testing.

### Step 2: Browsing & Discovering Products
1. After signing in, you are greeted with the homepage featuring:
   - Featured category cards (Smartphones, Laptops, Audio, Watches, Fashion, Home, Books).
   - Real-time **Deals of the Day** with active discount percentages.
   - Bestseller carousels and Indian competitor price benchmarks.
2. Click **"Products"** in the top navigation bar to explore the complete catalog.
3. Use the sidebar filters to refine by:
   - **Category:** Select any of the 8 categories.
   - **Budget Tier:** Filter by "Budget", "Mid-Range", or "Premium" (custom-calibrated for each category).
   - **Brand:** Filter by manufacturer (Apple, Samsung, Sony, boAt, Titan, etc.).
   - **Price Range & Ratings:** Slide between minimum and maximum prices or filter by 4★ and above.
   - **Search Bar:** Type any keyword (e.g., "wireless earbuds") in the header search input.

### Step 3: Product Details & Alternatives
1. Click any product card to view the comprehensive product details page.
2. View high-resolution product photography, detailed technical specifications, bulleted key features, and verified customer reviews.
3. **Competitor Benchmark Box:** Review current prices for the exact item on Amazon India, Flipkart, and Official Brand Stores.
4. **In-Stock Alternatives:** If an item is low in stock or sold out, ShopSphere automatically suggests available alternatives from the same category.

### Step 4: Cart Management
1. Select your desired quantity (protected by real-time inventory limits) and click **"Add to Cart"**.
2. A visual confirmation drawer slides out showing your added item.
3. Click the Cart icon in the header to review line items, increase/decrease quantities, or remove items.
4. The cart subtotal, delivery fees, and savings are computed automatically on the server.

### Step 5: Checkout & Order Placement
1. From the cart, click **"Proceed to Checkout"**.
2. **Step 1 — Delivery Address:** Select a saved delivery address or enter a new address (Full Name, Street, Apartment, City, State, PIN Code, and Phone Number).
3. **Step 2 — Coupon Application:** Enter promotional discount codes:
   - `SHOPSPHERE10` (10% off for orders over ₹500, max discount ₹2,000)
   - `WELCOME500` (Flat ₹500 off for orders over ₹2,500)
   - `FESTIVE20` (20% off for orders over ₹5,000, max discount ₹5,000)
4. **Step 3 — Payment Method:** Choose **Cash on Delivery (COD)** or **Online Payment (Razorpay / UPI / Cards)**.
5. Click **"Place Order"**. An authoritative order number (e.g., `ORD-20261022-75725`) is generated and locked on the server.

### Step 6: Order Tracking & Order History
1. Navigate to **Account** &rarr; **My Orders** to inspect past orders, invoice details, and item breakdowns.
2. Visit **Track Order** (`/track`) and enter your Order Number to view real-time milestone progress:
   - *Order Placed* &rarr; *Confirmed* &rarr; *Packed* &rarr; *In Transit* &rarr; *Delivered*.

### Step 7: Signing Out
1. Click **Account** &rarr; **"Sign Out"** or the logout button in the header.
2. Your session cookies and memory state are cleared immediately.
3. You are redirected to `/auth/login`. Clicking the browser Back button will not display protected customer details due to strict `no-store, no-cache` anti-bfcache response headers.

---

## 7. Administrator Guide (Operations Perspective)

### Secure Administrator Provisioning
ShopSphere enforces role-based access control (RBAC). Standard customer signups cannot assign themselves an administrative role. Administrator accounts are provisioned via:
1. **Automated Seed Admin:** `admin@shopsphere.dev` / `Admin@123` (pre-configured for development).
2. **Designated Administrator:** `kmvsubbarao28@gmail.com` / `Admin@123`.
3. **Command-Line Promotion (Production):**
   ```bash
   npm run promote:admin <user-email>
   ```

### Admin Operations Workflow

#### 1. Administrator Dashboard (`/admin/dashboard`)
- **Key Metrics:** Total Marketplace Revenue, Active Orders Count, Catalog Product Count, and Total Registered Customers.
- **Low-Stock Alert Box:** High-priority visual alerts showing products nearing zero inventory (quantity &le; 10).
- **Recent Orders Widget:** Live stream of incoming customer orders requiring fulfillment.

#### 2. Product Catalog Management (`/admin/products`)
- **Add Product (`/admin/products/new`):** Input Title, Category, SKU, Brand, Selling Price, Compare-at Price, Stock Quantity, Description, Features, and Image URLs.
- **Bulk CSV Import (`/admin/products/import`):** Upload product lists via CSV format with automated schema validation.
- **Edit / Delete:** Modify pricing, titles, or descriptions with immediate storefront propagation.

#### 3. Pricing Intelligence & Approval Queue (`/admin/pricing`)
- **Indian Retail Benchmarks:** Displays competitor prices from Amazon India and Flipkart alongside internal gross margins.
- **Profitability Safety Floor:** Alerts the admin if a competitor price is lower than the product's operational cost floor.

#### 4. Inventory & Restock Hub (`/admin/inventory`)
- Real-time stock editor allows quick one-click incrementing (`+10`, `+25`, `+50`) and direct stock override to avoid overselling.

#### 5. Order Fulfillment (`/admin/orders`)
- Filter orders by status (*Pending, Confirmed, Processing, Shipped, Delivered, Cancelled*).
- Change order status with one click to trigger milestone updates on the customer tracking page.

#### 6. Customer User Management (`/admin/users`)
- Browse all registered customer profiles with email masking for privacy.
- Review registration dates, order counts, and lifetime spend per customer.

---

## 8. Database Schema and Relationships

ShopSphere is backed by a relational PostgreSQL schema defined in `supabase/complete_production_schema.sql`:

```mermaid
erDiagram
    PROFILES ||--o{ ADDRESSES : "owns"
    PROFILES ||--o{ ORDERS : "places"
    PROFILES ||--o{ CART_ITEMS : "holds"
    PROFILES ||--o{ WISHLISTS : "saves"
    PROFILES ||--o{ REVIEWS : "writes"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ CART_ITEMS : "referenced_in"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered_as"
    PRODUCTS ||--o{ REVIEWS : "reviewed_in"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ PAYMENTS : "paid_by"
    
    PROFILES {
        uuid id PK
        string full_name
        string role
        string phone
        string avatar_url
        timestamp created_at
    }
    
    PRODUCTS {
        uuid id PK
        string slug UK
        string title
        string brand
        numeric price
        numeric compare_at_price
        string sku UK
        integer stock_quantity
        uuid category_id FK
        boolean is_active
        numeric rating
    }
    
    ORDERS {
        uuid id PK
        string order_number UK
        uuid user_id FK
        string status
        string payment_status
        string payment_method
        numeric subtotal
        numeric discount_amount
        numeric total
        jsonb shipping_address
        string tracking_number
        timestamp created_at
    }
    
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string title
        string sku
        numeric price
        integer quantity
        numeric subtotal
    }
```

### Table Dictionary:
1. **`profiles`:** Extends Supabase `auth.users` with customer full name, telephone, and security role (`customer` or `admin`).
2. **`categories`:** 8 marketplace categories with slug, metadata, and display orders.
3. **`products`:** Core catalog table with pricing, compare-at prices, inventory quantity, ratings, and features.
4. **`product_images`:** Multiple photo URLs and primary image flag per product.
5. **`product_variants`:** Size/color SKUs with independent prices and stock.
6. **`addresses`:** Customer address book with default selection flags.
7. **`cart_items`:** Multi-device shopping cart persistence per user.
8. **`wishlists`:** Saved customer favorite items.
9. **`orders`:** Complete transaction records with snapshotted totals and shipping addresses.
10. **`order_items`:** Immutable price snapshots of products at the time of purchase.
11. **`payments`:** Transaction logs for Razorpay payment IDs, signatures, and refund statuses.
12. **`coupons`:** Promotional codes with minimum spend requirements and discount ceilings.
13. **`reviews`:** Customer star ratings and text comments with verified purchase flags.
14. **`admin_audit_logs`:** Immutable record of administrative operations (price updates, inventory edits).

---

## 9. API & Server Actions Documentation

ShopSphere utilizes Next.js Server Actions with zero-trust server validation:

### Authentication Actions (`src/lib/auth/actions.ts`)
| Function | Input | Returns | Description |
| :--- | :--- | :--- | :--- |
| `signUpAction` | `FormData` | `AuthActionResult` | Validates all 11 fields, checks duplicates, hashes password, creates user. |
| `signInAction` | `FormData` | `AuthActionResult` | Validates credentials, sets secure session cookie, redirects. |
| `signOutAction` | *None* | `void` | Clears cookies, invalidates session, redirects to `/auth/login`. |
| `requestPasswordResetOtpAction` | `FormData` | `AuthActionResult & { otp? }` | Generates 6-digit OTP code with 10-minute validity. |
| `verifyOtpAndResetPasswordAction` | `FormData` | `AuthActionResult` | Validates OTP and updates customer password. |

### Order & Cart Actions (`src/lib/orders/actions.ts`, `src/lib/cart/actions.ts`)
| Function | Input | Returns | Description |
| :--- | :--- | :--- | :--- |
| `revalidateCartAction` | `CartItem[]` | `CartValidationResult` | Re-fetches prices from database, recalculates subtotals, checks stock. |
| `validateCouponAction` | `code, subtotal` | `CouponValidation` | Checks minimum spend thresholds and applies discounts. |
| `createOrderAction` | `OrderInput` | `{ success, order }` | Locks inventory, creates order number, saves immutable price snapshot. |
| `getCustomerOrdersAction` | *None* | `{ success, orders }` | Retrieves authenticated caller's order history only. |
| `cancelOrderAction` | `orderId` | `{ success }` | Cancels pending order and restores catalog inventory. |

### Admin Operations Actions (`src/lib/admin/actions.ts`)
| Function | Input | Returns | Description |
| :--- | :--- | :--- | :--- |
| `getAdminDashboardMetricsAction` | *None* | `{ success, metrics }` | Requires admin role; computes total sales, order count, stock alerts. |
| `updateInventoryAction` | `productId, qty` | `{ success }` | Requires admin role; updates product stock quantity. |
| `updateOrderStatusAction` | `orderId, status`| `{ success }` | Requires admin role; advances fulfillment state machine. |
| `createCouponAction` | `CouponInput` | `{ success }` | Requires admin role; creates promotional discount codes. |

---

## 10. Authentication and Authorization Explanation

ShopSphere implements defense-in-depth access control:

1. **Edge Middleware Interception (`src/middleware.ts`):**
   - Intercepts incoming HTTP requests before any component renders.
   - Evaluates the URL against a strict whitelist (`PUBLIC_PATHS`).
   - If unauthenticated, immediately issues a `307 Redirect` to `/auth/login?redirect=<target>`.
   - Protects `/admin/*` routes by verifying both authentication and the `role === 'admin'` claim. Customers attempting to access the admin portal are redirected to `/admin/login?error=admin-required`.

2. **Server Action Caller Identification (`src/lib/auth/admin-guard.ts`):**
   - Functions never trust client-supplied `user_id` arguments.
   - `getAuthenticatedCaller()` dynamically checks the Supabase session token or verified HTTP-only demo session cookie.
   - If no valid session exists, actions throw `UnauthorizedError`.

3. **Cross-Customer Authorization Isolation:**
   - Order history queries strictly filter by `WHERE user_id = caller.id`.
   - Customers cannot view, modify, or cancel orders belonging to other customers.
   - Saved delivery addresses are partitioned by user ID.

4. **Anti-Browser Cache (Anti-bfcache) Headers:**
   Every response carries:
   ```http
   Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
   Pragma: no-cache
   Expires: 0
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   ```
   This guarantees that clicking the browser's Back button after logging out cannot restore cached customer personal data or order histories.

---

## 11. Deployment Instructions

### Deploying to Vercel

ShopSphere is pre-configured for zero-configuration deployment on Vercel:

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Navigate to [Vercel Dashboard](https://vercel.com/) and click **"Add New"** &rarr; **"Project"**.
3. Import the repository: `MOHANKOTHAMASU/shopsphere`.
4. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://stynwsnmkxxmkpxdhpus.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-supabase-publishable-key>`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `<your-supabase-publishable-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: `<your-razorpay-key-id>`
   - `RAZORPAY_KEY_ID`: `<your-razorpay-key-id>`
   - `RAZORPAY_KEY_SECRET`: `<your-razorpay-key-secret>`
   - `RAZORPAY_WEBHOOK_SECRET`: `<your-razorpay-webhook-secret>`
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.vercel.app`
5. Click **"Deploy"**. Vercel will build and launch all 47 routes in under 2 minutes.

---

## 12. Testing Results

All test suites have been executed against the active application code with **100% pass rate**:

| Suite Name | Script Command | Checks | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Access Control** | `node scripts/test-authentication-enforcement.mjs` | 30 | 30 | 0 | **PASS** |
| **Cross-Customer Security** | `npx tsx scripts/test-cross-customer-security.ts` | 15 | 15 | 0 | **PASS** |
| **Production Readiness (Phase 9)** | `npm run test:audit` | 97 | 97 | 0 | **PASS** |
| **Customer Auth & RBAC** | `npx tsx scripts/test-customer-auth.ts` | 49 | 49 | 0 | **PASS** |
| **Full Phase 1-10 Lifecycle** | `npx tsx scripts/test-phase10-all.mjs` | 7 | 7 | 0 | **PASS** |
| **Pricing & Competitor Intelligence** | `npx tsx scripts/test-pricing-suite.mjs` | 37 | 37 | 0 | **PASS** |
| **Admin Storefront Real-Time Sync** | `npx tsx scripts/test-product-sync.ts` | 8 | 8 | 0 | **PASS** |
| **Next.js Production Build** | `npm run build` | 47 routes | 47 | 0 | **PASS** |

---

## 13. Known Limitations

1. **Supabase Free-Tier Email Rate Limit:**
   - The default Supabase shared mailer limits projects to 3-4 emails per hour.
   - *Mitigation implemented:* ShopSphere includes a built-in 6-digit OTP password reset flow and auto-activation fallback so developers and customers are never locked out.
2. **Payment Gateway Mode:**
   - Razorpay is configured with test credentials (`rzp_test_...`). Cash on Delivery (COD) is active for end-to-end checkout. Live online card processing requires production Razorpay KYC keys.
3. **Product Catalog Dual-Mode Sync:**
   - Catalog querying uses a robust hybrid model: queries run against PostgreSQL when tables are initialized, with seamless fallback to the 416-product seed dataset if the database is in maintenance.

---

## 14. Security Recommendations for Public Launch

1. **Run Master SQL Schema on Supabase:**
   - Copy `supabase/complete_production_schema.sql` into the Supabase SQL Editor to establish all 14 tables, indexes, and RLS policies on live Postgres.
2. **Turn Off Email Confirmation for Local/Beta Testing:**
   - In Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Email, toggle "Confirm email" OFF to avoid free-tier mail limits.
3. **Configure Custom SMTP for Live Production:**
   - Connect an authenticated SMTP provider (Resend, SendGrid, or AWS SES) in Supabase settings so transactional emails land reliably in customer inboxes.
4. **Provision Live Razorpay API Keys:**
   - Replace `rzp_test_placeholderKey123` with live Razorpay Merchant keys before accepting real credit cards or UPI payments.

---

## 15. Future Improvements

1. **SMS Gateway Integration:** Add Twilio or MSG91 for mobile SMS OTP verification.
2. **PWA (Progressive Web App):** Configure service workers for offline catalog browsing on mobile devices.
3. **Automated Return Requests:** Add self-service returns and automated pickup scheduling in the customer account area.
4. **Multi-Vendor Marketplace:** Enable seller sub-accounts with partitioned inventory and commission payouts.
