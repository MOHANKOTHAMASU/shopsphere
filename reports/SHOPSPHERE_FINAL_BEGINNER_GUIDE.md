# ShopSphere: Complete Beginner's Operational & Deployment Guide (Phase 8)
**Document:** Official Project Guide for Beginners  
**Application:** ShopSphere Next-Gen Indian E-Commerce  
**Date:** November 4, 2026  

---

## 1. What Each Feature Does & How Customers Use It

| Feature | How Customers Use It | Benefits to the Customer |
| :--- | :--- | :--- |
| **Mobile OTP Login** | Enter 10-digit mobile number, receive 6-digit SMS OTP, and log in. | No passwords to remember or lose. Instant access matching Amazon India and Flipkart. |
| **Search & Filters** | Type keywords in the search bar or pick price presets. | Finds the exact product in seconds among 445 catalog items. |
| **PIN Delivery Check** | Enter 6-digit Indian PIN code on any product page. | Instant delivery timeline check before adding to cart. |
| **Free Shipping Rule** | Cart progress bar shows remaining amount to reach ₹1,999. | Encourages savings and gives transparent delivery rates. |
| **Secure Checkout** | Select address, choose UPI (GPay/PhonePe), Card, or Cash on Delivery. | 100% encrypted, safe transactions with immediate order number (`ORD-...`). |
| **Order Tracking** | Visit `/track` and enter order ID to view live delivery status. | Peace of mind knowing exactly where the package is. |
| **1-Click Cancellation** | Cancel pending orders directly from `/account/orders/[id]`. | Instant order cancellation with immediate stock restoration. |
| **7-Day Returns** | Click "Request Return" on delivered orders within 7 days. | Doorstep pickup scheduled within 48 business hours. |
| **Video Guide Page** | Visit `/how-to-use` to watch scenes with Telugu audio & English subtitles. | Complete clarity on how the entire shopping platform works. |

---

## 2. How the Store Administrator Manages the Platform

1. **Accessing the Admin Portal:**
   - Go to [`/admin/login`](https://shopsphere-xi-gilt.vercel.app/admin/login).
   - Click the amber button **`[⚡ 1-Click Sign In as Store Admin]`** or enter `admin@shopsphere.dev` / `Admin@123`.
2. **Managing Products:**
   - Visit [`/admin/products`](https://shopsphere-xi-gilt.vercel.app/admin/products) to view stock, edit prices, or add new items.
3. **Fulfilling Orders:**
   - Visit [`/admin/orders`](https://shopsphere-xi-gilt.vercel.app/admin/orders) to update shipment statuses (Confirmed $\rightarrow$ Shipped $\rightarrow$ Delivered) or manage cancellations.
4. **Price Approvals:**
   - Visit [`/admin/pricing`](https://shopsphere-xi-gilt.vercel.app/admin/pricing) to review and approve discount campaigns.

---

## 3. External Services & Configuration Status

| Service | Purpose | Current Configuration | What to Do Next |
| :--- | :--- | :---: | :--- |
| **Supabase** | PostgreSQL Database & Session Authority | Active & Live | Hosted at `https://stynwsnmkxxmkpxdhpus.supabase.co`. Works out of the box. |
| **MSG91** | Indian Carrier SMS Delivery | Code Ready & Tested | When ready for cellular delivery, add your `MSG91_AUTH_KEY` to `.env.local`. |
| **Razorpay** | UPI & Online Payments | Test Mode Configured | Keys in `.env.local` enable sandbox payments. Switch to live keys when ready. |
| **Vercel** | Production Cloud Hosting | Deployed & Live | Automatically rebuilds when you push to GitHub `main`. |

---

## 4. How to Run the Project Locally

```bash
# 1. Install dependencies (already done)
npm install

# 2. Run local development server
npm run dev

# 3. Open in your browser:
# http://localhost:3000
```

---

## 5. How to Deploy Updates to Production

```bash
# 1. Check git status
git status

# 2. Stage and commit your changes
git add .
git commit -m "feat: your update message"

# 3. Push to GitHub (Vercel automatically builds and deploys)
git push origin main
```
