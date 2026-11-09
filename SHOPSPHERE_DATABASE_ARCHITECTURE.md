# ShopSphere — Complete Database Architecture & Storage Mapping

**Audit Date:** November 9, 2026  
**Primary Database Engine:** Supabase PostgreSQL 15+  
**Connection Protocol:** Direct PostgreSQL connection pooling / PostgREST Data API  
**Security Model:** Mandatory PostgreSQL Row Level Security (RLS) on all exposed tables  

---

## 1. Supabase PostgreSQL Tables Breakdown

Every table in the ShopSphere schema is purpose-built to maintain relational integrity, customer isolation, and administrative auditing:

| Table Name | Primary Purpose | Exact Data Stored | Related Tables & Foreign Keys |
| :--- | :--- | :--- | :--- |
| `public.profiles` | User profile & role registry | User ID (`auth.users`), full name, role (`customer` / `admin`), phone, avatar URL, creation & update timestamps | `auth.users` (1:1), `addresses`, `orders`, `cart_items`, `wishlists` |
| `public.categories` | Department & category taxonomy | Category UUID, name, slug, description, image URL, parent category ID (for hierarchies), display order, active flag | `products.category_id` (1:N self-referencing hierarchy) |
| `public.products` | Authoritative product catalog | UUID, slug, title, brand, description, selling price, compare-at price (MRP), discount %, SKU, stock quantity, rating, reviews count, specifications (JSONB), features (JSONB), tags (TEXT[]) | `categories.id`, `product_images.product_id`, `product_variants.product_id`, `order_items.product_id` |
| `public.product_images`| Multi-photo product gallery | Image UUID, `product_id`, CDN image URL, alt text, display order, primary photo flag | `products.id` (N:1 ON DELETE CASCADE) |
| `public.product_variants`| SKU variant options | Variant UUID, `product_id`, title (Color/Size/Storage), SKU, price, compare-at price, stock quantity, attributes (JSONB) | `products.id` (N:1 ON DELETE CASCADE), `cart_items.variant_id`, `order_items.variant_id` |
| `public.addresses` | Customer shipping address book | Address UUID, customer `user_id`, recipient full name, contact phone, street, apartment, city, state, postal code (PIN), country, default address flag | `auth.users.id` (N:1 ON DELETE CASCADE) |
| `public.cart_items` | Persistent database cart | Cart item UUID, customer `user_id`, `product_id`, optional `variant_id`, quantity, creation & update timestamps | `auth.users.id`, `products.id`, `product_variants.id` |
| `public.wishlists` | Customer saved items | Wishlist UUID, customer `user_id`, `product_id`, creation timestamp | `auth.users.id`, `products.id` (UNIQUE user_id + product_id) |
| `public.orders` | Authoritative order master records | Order UUID, unique order number (`ORD-YYYYMMDD-XXXXX`), customer `user_id`, fulfillment status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`), subtotal, discount, shipping fee, total amount, payment status (`unpaid`, `paid`, `failed`, `refunded`), payment provider (`razorpay`, `cod`), shipping address (JSONB snapshot), billing address (JSONB snapshot), notes, timestamps | `auth.users.id` (N:1 ON DELETE SET NULL), `order_items.order_id`, `payment_records.order_id` |
| `public.order_items` | Immutable order line-item snapshots | Line item UUID, `order_id`, `product_id`, product title snapshot, unit price snapshot, quantity, line total | `orders.id` (N:1 ON DELETE CASCADE), `products.id` |
| `public.payment_records`| Financial transaction logs | Payment UUID, `order_id`, customer `user_id`, transaction ID, provider (`razorpay`, `cod`), amount, currency (`INR`), status, verification signature, raw payload (JSONB) | `orders.id`, `auth.users.id` |
| `public.coupons` | Promotional voucher engine | Coupon UUID, promo code (uppercase), discount type (`percentage`, `fixed`), discount value, min order subtotal, max discount cap, usage limit, used count, active flag, start/expiry dates | `orders.coupon_code` |
| `public.product_reviews`| Verified customer ratings & reviews | Review UUID, `product_id`, customer `user_id`, rating (1–5 stars), review title, review comment, verified purchase flag, moderation status (`pending`, `approved`, `rejected`) | `products.id`, `auth.users.id` |
| `public.customer_activity_logs` | Customer lifecycle & audit trail | Activity UUID, customer `user_id`, customer email, action (`ACCOUNT_CREATED`, `LOGIN`, `LOGOUT`, `ORDER_PLACED`, `ADDRESS_SAVED`), detailed payload (JSONB), UTC creation timestamp | `auth.users.id` |

---

## 2. Comprehensive Data Storage Mapping

ShopSphere follows a strict tier-based architecture determining where each category of application data is stored, its lifecycle, and its security classification:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SHOPSPHERE DATA STORAGE TIERS                             │
├────────────────────┬─────────────────────────────┬──────────────┬──────────────────────┤
│ Storage Location   │ Exact Data Stored           │ Lifecycle    │ Access / Privacy     │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 1. Supabase        │ - Customer Profiles         │ Permanent    │ Strict RLS: users    │
│    PostgreSQL      │ - Catalog Products & SKUs   │              │ see only own data;   │
│                    │ - Product Variants & Stock  │              │ public reads active  │
│                    │ - Customer Addresses        │              │ products/categories. │
│                    │ - Confirmed Orders & Items  │              │                      │
│                    │ - Payment Transactions      │              │                      │
│                    │ - Activity & Audit Logs     │              │                      │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 2. Supabase Storage│ - Product Photography       │ Permanent    │ Public read via CDN; │
│    ('product-images')- Customer Avatars          │              │ Admin-only upload &  │
│                    │ - Category Banner Images    │              │ delete.              │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 3. Browser         │ - Account-scoped cart cache │ Temporary /  │ Cleared on logout /  │
│    localStorage    │   (`shopsphere_cart_<id>`)  │ Per-browser  │ account switch;      │
│                    │ - Account-scoped wishlist   │ profile      │ never shared across  │
│                    │   (`shopsphere_wishlist_<id>│              │ different accounts.  │
│                    │ - Auth sync ping timestamp  │              │                      │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 4. Browser         │ - Active search filters     │ Ephemeral    │ Automatically lost   │
│    sessionStorage  │ - Checkout form draft state │ (Tab close)  │ when browser tab is  │
│                    │ - Filter drawer state       │              │ closed.              │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 5. Browser HTTP    │ - `sb-access-token` (JWT)   │ 24 Hours to  │ HttpOnly, Secure,    │
│    Cookies         │ - `sb-refresh-token` (JWT)  │ 30 Days      │ SameSite=Lax.        │
│                    │ - `shopsphere_demo_session` │ (rememberMe) │ Signed with server   │
│                    │   (HMAC-SHA256 signed token)│              │ secret HMAC-SHA256.  │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 6. Vercel Hosting  │ - Serverless edge functions │ Ephemeral /  │ Environment variables│
│    Edge Runtime    │ - In-memory verification OTP│ Function     │ encrypted at rest.   │
│                    │   tokens (10-minute expiry) │ lifecycle    │ Zero plaintext keys. │
│                    │ - Rate limit buckets (45s)  │              │                      │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 7. External        │ - Resend: Transactional OTP │ Temporary    │ Ephemeral delivery;  │
│    Cloud APIs      │   email dispatch logs       │ logs (30d)   │ encrypted in transit.│
│                    │ - Razorpay: Payment gateway │ Financial    │ PCI-DSS compliant    │
│                    │   order & signature tokens  │ compliance   │ server-side gateway. │
├────────────────────┼─────────────────────────────┼──────────────┼──────────────────────┤
│ 8. GitHub          │ - Application source code   │ Permanent    │ Public/Private repo; │
│    Repository      │ - Seed product catalog data │ Version-     │ STRICT ZERO-SECRETS. │
│                    │ - SQL migration scripts     │ controlled   │ `.env.local` ignored.│
│                    │ - Architectural audit docs  │              │                      │
└────────────────────┴─────────────────────────────┴──────────────┴──────────────────────┘
```

---

## 3. Database Indexes & Query Optimizations

To ensure sub-50ms query response times under high concurrency:
1. `products(category_id, is_active)`: Accelerates category catalog listing.
2. `products(price, rating)`: Powers dynamic price filtering and high-rating sorting.
3. `products(slug)`: Unique B-tree index for instant product page resolution.
4. `orders(user_id, created_at)`: Instant customer order history lookup.
5. `orders(order_number)`: Instant tracking and checkout success lookup.
6. `addresses(user_id, is_default)`: Quick address selection during checkout.
7. `customer_activity_logs(user_id, created_at)`: Ordered timeline rendering in Admin Console.

