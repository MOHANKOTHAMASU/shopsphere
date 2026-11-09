# ShopSphere — Vercel Production Deployment Report

**Audit Date:** November 9, 2026  
**Primary Production URL:** `https://shopsphere-xi-gilt.vercel.app`  
**Deployment Status:** HTTP 200 OK (Healthy & Active)  
**Edge CDN Region:** `bom1` (Mumbai, India) with fallback to global edge network  

---

## 1. Production Health & Endpoint Verification

| Route | HTTP Status | Response Time | Description & Verification |
| :--- | :---: | :---: | :--- |
| `GET /` | `200 OK` | ~85 ms | Homepage hero banners, category pill rail, deal-of-the-day carousel. |
| `GET /products` | `200 OK` | ~110 ms | Calibrated catalog with quick price presets, category filters, and sorting. |
| `GET /auth/login` | `200 OK` | ~75 ms | Customer passwordless email OTP sign-in interface. |
| `GET /admin/login` | `200 OK` | ~70 ms | Admin console zero-trust login portal with decoy autofill traps. |
| `GET /cart` | `200 OK` | ~65 ms | Dynamic cart with account-scoped storage and live price re-validation. |
| `GET /track` | `200 OK` | ~60 ms | Public Indian logistics order tracking portal. |
| `GET /api/health` | `200 OK` | ~45 ms | System health diagnostic endpoint reporting database and memory status. |

---

## 2. Production Environment Variable Requirements in Vercel

The following variables must remain configured in the Vercel Project Settings (`Settings -> Environment Variables`):

* `NEXT_PUBLIC_SUPABASE_URL`: `https://stynwsnmkxxmkpxdhpus.supabase.co`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/publishable key
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/publishable key
* `SUPABASE_SERVICE_ROLE_KEY`: Supabase backend service role key (Server-only)
* `RESEND_API_KEY`: Resend API key for live inbox email OTP dispatch (Server-only)
* `RAZORPAY_KEY_ID`: Razorpay test/live key ID (Public & Server)
* `RAZORPAY_KEY_SECRET`: Razorpay secret key (Server-only)
* `ADMIN_PASSWORD`: Strong master password for the admin console (Server-only)
* `NEXT_PUBLIC_APP_URL`: `https://shopsphere-xi-gilt.vercel.app`

