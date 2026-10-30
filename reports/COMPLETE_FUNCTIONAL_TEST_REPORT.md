# ShopSphere: Complete Functional Journey & QA Test Report
**Classification:** End-to-End User Experience & Journey Verification  
**Date:** October 30, 2026  
**Auditor:** QA Automation Lead & Senior Full-Stack Engineer  
**Pass Rate:** 100% (30 / 30 Journey Tests Passed)  

---

## 1. Customer Shopping Journey Tests (21 Scenarios)

| # | Journey Stage | Action Performed | Expected Behavior | Observed Result | Status |
|:---:|:---|:---|:---|:---|:---:|
| **01** | **Homepage Load** | Open `http://localhost:3000/` | Hero carousel, 10 category chips, top deals render cleanly. | Renders in < 300ms without layout shift. | **PASS** |
| **02** | **Customer Registration** | Submit name, email, phone, password at `/auth/register` | Input validated, user account created, unverified flag set. | Account created, redirected to `/auth/verify-email`. | **PASS** |
| **03** | **Email Verification** | Open verification link `/auth/callback?code=...` | PKCE token exchanged, `email_confirmed_at` timestamp set. | User confirmed, redirected to `/auth/login?verified=true`. | **PASS** |
| **04** | **Receive Mobile OTP** | Initiate login with verified credentials | Server issues 2FA challenge and dispatches SMS. | 2FA screen displays masked phone (`+91 96*** **899`). | **PASS** |
| **05** | **Complete Login** | Enter 6-digit OTP code on 2FA screen | Server validates OTP, mints session cookie. | Authenticated, redirected to `/account`. | **PASS** |
| **06** | **View Profile** | Navigate to `/account/profile` | Shows user details, masked email, and phone. | Full name and account metadata displayed. | **PASS** |
| **07** | **Search Products** | Type "headphones" in search bar | Autocomplete popover displays live product matches. | Live suggestions rendered with keyboard navigation. | **PASS** |
| **08** | **Filter Products** | Select Category "Electronics" and filter by price $\le$ ₹2,000 | Filters catalog items to matching criteria. | Catalog dynamically updates bounds and items. | **PASS** |
| **09** | **Product Details** | Click product card `/products/[slug]` | Rich page with gallery, rating, specs, and PIN checker. | Displays stock status and delivery estimation. | **PASS** |
| **10** | **Add to Cart** | Click "Add to Cart" button | Item added to cart context; badge increments. | Header cart counter updates immediately. | **PASS** |
| **11** | **Change Quantities** | Increment quantity stepper in `/cart` (1 $\rightarrow$ 3) | Subtotal recalculated; line total updates. | Calculations correct: line item multiplied by 3. | **PASS** |
| **12** | **Remove Products** | Click trash icon on cart line item | Item removed from cart; totals update. | Cart reflects updated items count and subtotal. | **PASS** |
| **13** | **Wishlist Toggle** | Click heart icon on product card | Product added to wishlist; badge shows count. | Heart icon fills with rose color; persisted. | **PASS** |
| **14** | **Delivery Address** | Add Indian delivery address with 6-digit PIN | Address saved to profile; default flag set. | Address appears in checkout selection. | **PASS** |
| **15** | **Proceed to Checkout** | Click "Proceed to Checkout" from cart | Checkout screen opens with order breakdown. | Free shipping applied if total $\ge$ ₹999. | **PASS** |
| **16** | **Payment Gateway** | Select Test Payment Gateway | Razorpay test sandbox modal triggers. | Secure test payment flow handles response. | **PASS** |
| **17** | **Create Order** | Submit confirmed order | Unique order number (`ORD-...`) generated. | Order record created; cart cleared. | **PASS** |
| **18** | **View My Orders** | Open `/account/orders` | Displays newly placed order and status. | Order card shows status stepper and items. | **PASS** |
| **19** | **Track Order** | Enter order number on public `/track` page | Order status progression (Placed $\rightarrow$ Delivered) shown. | Tracking timeline matches order record. | **PASS** |
| **20** | **Customer Logout** | Click "Sign Out" in header menu | Session destroyed, cookie deleted. | User signed out and redirected to homepage `/`. | **PASS** |
| **21** | **Protected Access** | Attempt visiting `/account` after logout | Middleware intercepts unauthenticated request. | Immediately redirected to `/auth/login`. | **PASS** |

---

## 2. Store Administrator Journey Tests (9 Scenarios)

| # | Admin Stage | Action Performed | Expected Behavior | Observed Result | Status |
|:---:|:---|:---|:---|:---|:---:|
| **01** | **Admin Authentication** | Access `/admin/login` & submit credentials or click 1-Click | Authenticates administrator role. | Dashboard opens at `/admin/dashboard`. | **PASS** |
| **02** | **Admin Dashboard** | Inspect KPI dashboard cards | Displays total sales, order count, and low stock count. | Real metrics loaded from store database. | **PASS** |
| **03** | **Product Creation** | Fill new product form at `/admin/products/new` | Validates price, SKU, category, and inserts product. | Product created and appears in catalog. | **PASS** |
| **04** | **Product Editing** | Edit product price and stock at `/admin/products/[id]/edit` | Updates product record in catalog. | Changes reflected in storefront immediately. | **PASS** |
| **05** | **Inventory Management** | Adjust stock level in `/admin/inventory` | Stock quantity updated with audit entry. | Store displays updated inventory count. | **PASS** |
| **06** | **Order Management** | Open `/admin/orders` | View all customer orders across store. | Full order list with customer details shown. | **PASS** |
| **07** | **Customer Management** | Open `/admin/customers` | View active customer profiles and order counts. | Customer summaries displayed with status tags. | **PASS** |
| **08** | **Order Status Update** | Update status from "Placed" to "Shipped" | Status badge updates; audit timestamp saved. | Tracking page reflects "Shipped" status. | **PASS** |
| **09** | **Dashboard Metrics** | Verify calculation accuracy of gross revenue | Accurate sum of completed order totals. | Mathematical verification matches order data. | **PASS** |

---

## 3. Responsive & Environmental Edge Case Testing

- **Mobile Responsiveness:** Tested on 375px (iPhone SE), 414px (iPhone Pro Max), and 768px (iPad). Navigation collapses into `MobileBottomNav` and `MobileDrawer` without horizontal overflow.
- **Browser Refresh:** Form state and authenticated session persist safely using cookies and localStorage.
- **Empty States:** Cart, Wishlist, and Orders pages display friendly illustrations and direct "Explore Products" call-to-action buttons when empty.
- **Error Boundaries:** Broken URLs render custom 404 page (`/_not-found`) with return home button.

