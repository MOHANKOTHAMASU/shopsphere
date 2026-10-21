# SHOPSPHERE PRODUCTION DEPLOYMENT & OPERATIONS CHECKLIST

**Date:** October 21, 2026  
**File Location:** `reports/DEPLOYMENT_CHECKLIST.md`  
**Target Environments:** Vercel (Edge & Node.js Serverless) + Supabase (PostgreSQL 15) + Razorpay (Payments)

---

## 1. PRE-DEPLOYMENT VERIFICATION CHECKLIST

- [x] **Zero TypeScript Errors:** Verified via `npm run build` (46/46 static and dynamic routes compiled).
- [x] **No Hardcoded Secrets in Git:** Verified `.gitignore` excludes `.env*` files; only `.env.example` committed.
- [x] **Automated Tests Passing:** Verified 37/37 Pricing Suite tests & 97/97 Security/Integrity tests pass.
- [x] **Concurrent Load Stability:** Verified 1,000 virtual users handle 22,493 req/sec with 0% error rate.
- [x] **Server Authoritative Pricing:** Verified client-submitted prices are discarded at checkout.
- [x] **Admin RBAC Enforcement:** Verified `assertAdmin()` guards all sensitive routes and actions.
- [x] **Public Health Check:** Verified `/api/health` returns status without leaking API keys.

---

## 2. PRODUCTION ENVIRONMENT VARIABLES CHECKLIST

Configure these variables in your **Vercel Project Settings > Environment Variables**:

| Variable Name | Required For | Sensitive? | Example / Format |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical links & redirects | No | `https://shopsphere.yourbrand.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Client SDK | No | `https://abcdefghijkl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client queries (RLS enforced) | No | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin actions & migrations | **YES (Strictly Secret)** | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET` | Image storage bucket | No | `product-images` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Checkout Popup | No | `rzp_test_...` (or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Server-side signature verification | **YES (Strictly Secret)** | Secret key from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook cryptographic verification | **YES (Strictly Secret)** | Webhook secret from Razorpay dashboard |
| `NODE_ENV` | Runtime environment | No | `production` |

---

## 3. SUPABASE DATABASE MIGRATION GUIDE

Follow these exact steps when creating your production Supabase database:

1. **Create Project:** Sign in to [Supabase](https://supabase.com) and click **New Project**. Name it `shopsphere-production` and select your target region (e.g. `ap-south-1` Mumbai for India).
2. **Apply Database Schema:**
   - In Supabase Dashboard, open **SQL Editor** from the left navigation.
   - Click **New Query**.
   - Copy the entire contents of `supabase/complete_production_schema.sql` from your workspace.
   - Paste into the editor and click **Run**.
   - This creates 13 relational tables, indexes, triggers, and Row Level Security (RLS) policies.
3. **Configure Storage Buckets:**
   - Go to **Storage > Buckets**.
   - Ensure `product-images` bucket exists with **Public** read access enabled.
   - Ensure `avatars` bucket exists.
4. **Configure Authentication Redirects:**
   - In **Authentication > URL Configuration**:
     - Site URL: `https://your-domain.vercel.app`
     - Redirect URLs: `https://your-domain.vercel.app/**`, `http://localhost:3000/**`

---

## 4. PROVISIONING THE FIRST ADMINISTRATOR

For security, public admin signup is strictly disabled. Use one of these trusted methods to create your first administrator:

### Option A: Using the CLI Tool
```bash
npx tsx scripts/promote-admin.ts kmvsubbarao28@gmail.com
```

### Option B: Direct SQL Query in Supabase
Run this SQL query in the Supabase SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@domain.com';
```

---

## 5. VERCEL DEPLOYMENT STEPS

1. **Push Code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete ShopSphere production platform"
   git push origin main
   ```
2. **Import Project to Vercel:**
   - Log in to [Vercel](https://vercel.com).
   - Click **Add New > Project** and select your GitHub repository.
   - Framework Preset: **Next.js** (automatically detected).
   - Root Directory: `./`
3. **Add Environment Variables:**
   - Copy all keys from the Environment Variables table above into Vercel settings.
4. **Deploy:**
   - Click **Deploy**. Vercel will execute `npm run build` and provision the edge network.
   - Deployment typically completes in under 2 minutes.

---

## 6. PAYMENT SANDBOX-TO-PRODUCTION CHECKLIST

1. **Merchant KYC & Onboarding:** Complete business verification on [Razorpay Dashboard](https://dashboard.razorpay.com).
2. **Generate Live Keys:**
   - Switch toggle in Razorpay header from **Test Mode** to **Live Mode**.
   - Navigate to **Settings > API Keys > Generate Key**.
   - Copy Key ID and Key Secret.
3. **Register Live Webhook URL:**
   - Go to **Settings > Webhooks > Add New Webhook**.
   - Webhook URL: `https://your-domain.vercel.app/api/webhooks/razorpay`
   - Secret: Enter a strong random secret.
   - Active Events to enable:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `refund.processed`
4. **Update Production Environment Variables in Vercel:**
   - Replace test keys with the live Key ID, Key Secret, and Webhook Secret.
   - Redeploy the application.
5. **Execute a Real ₹1 Test Transaction:**
   - Purchase an inexpensive item, verify signature verification, and confirm order creation in admin dashboard.

---

## 7. BACKUP & DISASTER RECOVERY PROTOCOL

1. **Automated Daily Backups:** Supabase automatically creates daily snapshots retained for 7 to 30 days depending on plan.
2. **Manual SQL Export:**
   - In Supabase Dashboard, go to **Settings > Database > Backups**.
   - Click **Download Backup** or run via pg_dump:
     ```bash
     pg_dump -h db.your-ref.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
     ```
3. **Point-In-Time Recovery (PITR):** For critical production operations, enable PITR in Supabase settings to allow restoring the database to any specific second in the past 7 days.
