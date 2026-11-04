# Phase 6 — Admin Dashboard & Inventory Audit

> **Project:** ShopSphere — Full-Stack Indian E-Commerce Platform  
> **Target Surface:** `/admin/*` Administrative Suite  
> **Authorized Access:** Store Owner Only (`kmvsubbarao28@gmail.com` / `admin@shopsphere.dev`)  
> **Audit Status:** Verified & Compliant  

---

## 1. Administrative Suite Capabilities

| Admin Module | Route | Key Capabilities |
| :--- | :--- | :--- |
| **KPI Dashboard** | `/admin/dashboard` | Real-time sales revenue, order velocity, total active customers, low-stock warnings. |
| **Inventory & Stock** | `/admin/inventory` | Real-time stock counts, status pills, quick adjustment steppers (+10, +25, -10, -25). |
| **Catalog Products** | `/admin/products` | Product listings, edit product, create new product, CSV bulk importer. |
| **Order Fulfillment** | `/admin/orders` | Order lookup, fulfillment state transitions (Pending -> Confirmed -> Shipped -> Delivered -> Cancelled). |
| **Customer Directory** | `/admin/customers` | Verified accounts, mobile phone numbers, registration dates, suspension controls. |
| **Coupons & Deals** | `/admin/coupons` | Manage discount codes, percentage / flat discounts, minimum purchase rules. |
| **Pricing Intelligence** | `/admin/pricing` | Competitive price comparison vs Amazon India and Flipkart with dynamic margin floors. |
| **Compliance & Audits** | `/admin/reports` | Administrative event logging, immutable audit records, RLS compliance reports. |

---

## 2. Inventory Adjustment Stepper Protection

To prevent accidental inventory corruption or negative stock values:
* Clicking **`+10`** or **`+25`** increments stock quantity and commits directly to the store.
* Clicking **`-10`** or **`-25`** safely decrements stock with an automatic **`Math.max(0, current - delta)`** clamp. Stock can never become negative.
* When stock reaches 0, the item status badge transitions automatically to `Out of Stock` and `isAvailable: false`.

---

## 3. Strict Authorization Enforcement

1. **Owner-Only Whitelist:** Only `kmvsubbarao28@gmail.com` and `admin@shopsphere.dev` can access `/admin/*`.
2. **Access Denied Redirection:** Any unauthorized user is intercepted in `src/middleware.ts` and redirected to `/admin/login?error=admin-required`.
3. **No 1-Click Sandbox in Production:** The developer 1-click bypass button is conditionally hidden whenever `process.env.NODE_ENV === 'production'`.
