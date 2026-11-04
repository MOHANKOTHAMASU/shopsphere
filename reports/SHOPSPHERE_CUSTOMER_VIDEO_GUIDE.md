# ShopSphere: Customer Video Guide Production Specification (Phase 5)
**Document:** Official Video Production & Screen Recording Specification  
**Page URL:** [`/how-to-use`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/src/app/how-to-use/page.tsx)  
**Target Audience:** Indian e-commerce shoppers (Telugu & English speakers)  
**Resolution:** 1080p Full HD (1920x1080) @ 60 FPS  
**Date:** November 4, 2026  

---

## 1. Overview & Objectives

This document provides scene-by-scene screen recording instructions for producing the official **ShopSphere Customer Video Guide**. 

The video demonstrates the **ACTUAL** ShopSphere website (not mockups) using screen recordings of the live application running on desktop and mobile viewports.

---

## 2. Scene-by-Scene Screen Recording Instructions

| Scene # | Scene Title | Timestamp | Page / Route | Visual Screen Recording Instructions |
| :---: | :--- | :---: | :--- | :--- |
| **1** | Introduction to ShopSphere | 00:00 - 00:55 | `/` | Open homepage, scroll smoothly through hero banner, 10 category circles, and Deals of the Day. |
| **2** | Mobile OTP Registration & Login | 00:55 - 01:50 | `/auth/login` | Show entering Indian 10-digit mobile number (+91), receiving 6-digit OTP, entering code, and arriving at customer dashboard. |
| **3** | Homepage & Official Categories | 01:50 - 02:45 | `/` $\rightarrow$ `/products` | Click category circles (Fashion, Mobiles, Electronics) and show category-specific product feeds. |
| **4** | Product Search & Price Filters | 02:45 - 03:40 | Header $\rightarrow$ `/products` | Type "headphone" into search bar to demonstrate live autocomplete, then apply price filters ("Under ₹500"). |
| **5** | Product Details & PIN Serviceability | 03:40 - 04:35 | `/products/[slug]` | Open Sony Headphones, switch image gallery thumbnails, enter PIN code `560001`, and show delivery estimate badge. |
| **6** | Shopping Cart & Wishlist | 04:35 - 05:30 | `/cart` & `/wishlist` | Heart toggle item into Wishlist, navigate to `/cart`, adjust quantity steppers, and point out the ₹1,999 Free Shipping progress bar. |
| **7** | Delivery Address & Checkout | 05:30 - 06:25 | `/checkout` | Select delivery address, enter coupon code `SHOPSPHERE10`, and observe instant 10% discount deduction. |
| **8** | Payment Options (Razorpay & COD) | 06:25 - 07:20 | `/checkout` | Show Razorpay payment modal with UPI, Cards, Net Banking, and show Cash on Delivery option. |
| **9** | Order Confirmation & Tracking | 07:20 - 08:15 | `/checkout/success` & `/track` | Show confirmed order number (`ORD-...`), click "Track Order", and walk through the public shipment timeline. |
| **10** | Cancellation & 7-Day Doorstep Returns | 08:15 - 09:10 | `/account/orders/[id]` | Demonstrate the "Cancel Order" modal for pending orders, and the "Request Return" modal for delivered orders. |
| **11** | Customer Account & Invoices | 09:10 - 10:05 | `/account` & invoice | Show saved addresses, SuperCoins rewards balance, and open printable GST tax invoice. |
| **12** | Start Shopping Call to Action | 10:05 - 11:00 | `/products` | Conclude on product catalog, encouraging customers to shop with confidence. |

---

## 3. Video Hosting & Storage Options

When the screen recording and Telugu voiceover are rendered into `.mp4`:
1. **Option A (Supabase Storage - Recommended):**
   - Upload `shopsphere-guide.mp4` to Supabase Storage bucket `product-images` or a new public bucket `media`.
   - Embed URL in `<video src="..." controls />` on `/how-to-use`.
2. **Option B (YouTube / Cloudflare Stream):**
   - Upload unlisted to YouTube with English CC subtitles enabled.
   - Embed responsive iframe on `/how-to-use`.
3. **Current Safe State:**
   - The `/how-to-use` page currently presents an interactive placeholder player clearly stating that video production is in progress, preventing any false claims while providing the full script and chapter guide.

