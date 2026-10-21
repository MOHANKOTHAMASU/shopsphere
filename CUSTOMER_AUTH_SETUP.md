# ShopSphere — Customer Authentication, Registration & User Management Guide

This document is your complete, beginner-friendly manual for **Customer Registration, Authentication, Account Management, Database Setup, and Administrative User Controls** in ShopSphere.

---

## Table of Contents
1. [System Architecture & Overview](#1-system-architecture--overview)
2. [Running the Website Locally](#2-running-the-website-locally)
3. [How Customer Registration (Sign Up) Works](#3-how-customer-registration-sign-up-works)
4. [How Login & Logout Work](#4-how-login--logout-work)
5. [How Customer & Address Records Are Stored](#5-how-customer--address-records-are-stored)
6. [Creating a Free Supabase Account](#6-creating-a-free-supabase-account)
7. [Creating the Database Project & Applying Migrations](#7-creating-the-database-project--applying-migrations)
8. [Configuring Environment Variables](#8-configuring-environment-variables)
9. [Creating the First Secure Administrator Account](#9-creating-the-first-secure-administrator-account)
10. [Testing Registration & Admin Metrics](#10-testing-registration--admin-metrics)
11. [Deploying Through GitHub and Vercel](#11-deploying-through-github-and-vercel)
12. [Verification Status & External Credentials Checklist](#12-verification-status--external-credentials-checklist)

---

## 1. System Architecture & Overview

ShopSphere uses a **zero-trust, dual-mode authentication and user management architecture**:

- **Local Sandbox Mode (Default)**: Runs completely on your computer without requiring any external accounts, credit cards, or internet database services. Accounts, sessions, addresses, and admin metrics update dynamically in server memory and secure cookies.
- **Production Mode (Supabase PostgreSQL)**: Uses Supabase Auth (bcrypt-hashed passwords, JWT tokens, optional email confirmation) and PostgreSQL tables (`profiles`, `addresses`, `orders`, `admin_audit_logs`) with strict Row Level Security (RLS) policies.
- **Role-Based Access Control (RBAC)**: All administrative pages and server actions are guarded by `assertAdmin()`. Regular customers cannot access admin tools or escalate their privileges.

---

## 2. Running the Website Locally

You can run ShopSphere on your computer right now:

### Step 1: Open Terminal in Project Root
```powershell
# Open terminal in:
c:\Users\kmvsu\OneDrive\Desktop\website-site
```

### Step 2: Start Development Server
```powershell
npm.cmd run dev
```
*(On macOS or Linux, use `npm run dev`)*

You will see:
```
▲ Next.js 16.4.2 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 1200ms
```

### Step 3: Access In Your Browser
- **Customer Storefront**: [http://localhost:3000](http://localhost:3000)
- **Customer Sign Up**: [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
- **Customer Sign In**: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- **Admin Control Center**: [http://localhost:3000/admin/users](http://localhost:3000/admin/users)

### Step 4: Stopping the Development Server
Press `Ctrl + C` in your terminal window, type `Y`, and press Enter.

---

## 3. How Customer Registration (Sign Up) Works

The customer registration page ([`src/app/(customer)/auth/register/page.tsx`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/src/app/(customer)/auth/register/page.tsx)) features an intuitive 2-column layout on desktop and single-column on mobile.

### Required Fields Collected:
1. **Full Name**: Minimum 2 characters.
2. **Email Address**: Valid email syntax (e.g., `user@example.com`).
3. **Phone Number**: Country code selector (defaults to `+91` India, with options for US, UK, UAE, etc.) and phone number (10 to 15 digits).
4. **Password**: Minimum 8 characters with at least one letter and one number, with a real-time visual strength meter.
5. **Confirm Password**: Validated to match the password exactly.
6. **Address Line**: House/flat number, street, and locality.
7. **City**: Delivery city.
8. **State**: Dropdown list of states.
9. **Postal PIN Code**: 4 to 10 alphanumeric characters (e.g. `560001`).
10. **Country**: Defaults to `India`.
11. **Consent Checkbox**: Explicit agreement to the Terms of Service and Privacy Policy.

### Backend Validation & Security:
- **Rate Limiting**: Protected against automated spam by limiting to 5 signups per 10 minutes per IP/email.
- **Duplicate Prevention**: If an account with the email already exists, the server returns: *"An account with this email address already exists. Please sign in instead."*
- **No Password Exposure**: Passwords are never stored in plain text, never logged, and never included in profile tables or browser storage.
- **Automatic Address Linking**: The customer's primary delivery address is automatically created in the `addresses` table and set as their default shipping address for fast checkout.

---

## 4. How Login & Logout Work

### Customer Login ([`src/app/(customer)/auth/login/page.tsx`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/src/app/(customer)/auth/login/page.tsx)):
1. **Credentials**: Email address and password.
2. **Show / Hide Password**: Eye toggle button to reveal password characters while typing.
3. **Invalid Credential Security**: If credentials do not match, the system returns a safe, unified error message (*"Invalid email or password"*) without disclosing whether the email exists.
4. **Email Verification Guidance**: If an account requires email verification, a guidance box advises the user to inspect their inbox and spam folder.
5. **Forgot Password Flow**: Quick link to `/auth/forgot-password` to trigger password reset instructions.
6. **Safe Redirects**: Supports `?redirect=/checkout` so customers returning to checkout after logging in return directly to their cart.

### Customer Logout:
- Clicking **Log Out** in the user navigation header or on the account page invokes `signOutAction()`.
- The session cookie (`shopsphere_demo_session` or Supabase JWT token) is invalidated.
- Protected pages (`/account`, `/account/*`, `/checkout`) immediately block access and redirect unauthenticated visitors to `/auth/login`.

---

## 5. How Customer & Address Records Are Stored

| Data Element | Local Sandbox Mode | Supabase Production Mode |
|---|---|---|
| **Account Identity** | Stored in `memoryCustomers` and cookie `shopsphere_demo_session` | Stored in PostgreSQL `auth.users` table with bcrypt hash |
| **Customer Profile** | Saved in `memoryCustomers` (`id`, `fullName`, `phone`, `role`) | Saved in `public.profiles` (`id REFERENCES auth.users(id)`) |
| **Delivery Addresses** | Saved in `memoryAddresses` array linked by `userId` | Saved in `public.addresses` table linked by `user_id` foreign key |
| **Shopping Cart** | Browser `localStorage` + server zero-trust price validation | `public.cart_items` table + server zero-trust price validation |
| **Orders & Invoices** | Saved in server memory `inMemoryOrders` | Saved in `public.orders` and `public.order_items` tables |
| **Audit Logs** | Stored in `memoryAuditLogs` | Stored in `public.admin_audit_logs` table |

---

## 6. Creating a Free Supabase Account

When you are ready to connect a live PostgreSQL database:

1. Visit [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in using your GitHub account or an email address.
3. Click **New organization** (e.g., `ShopSphere Org`), then click **New project**.
4. Configure your project:
   - **Name**: `ShopSphere`
   - **Database Password**: Generate and securely save a strong password.
   - **Region**: Choose a region close to your target customers (e.g., `South Asia (Mumbai)` for India).
5. Click **Create new project** and allow 1-2 minutes for provisioning.

---

## 7. Creating the Database Project & Applying Migrations

### Method A: Running the Master Schema (Recommended)
1. In your Supabase project dashboard, click the **SQL Editor** icon (`>_` in the left sidebar).
2. Click **New query**.
3. Open [`supabase/complete_production_schema.sql`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/supabase/complete_production_schema.sql) in your code editor.
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.
5. This creates all 13 tables, relationships, indexes, Row Level Security (RLS) policies, triggers, and storage buckets.

### Method B: Applying the Incremental Auth Migration
If you already applied previous tables, run [`supabase/migrations/20261021000005_customer_auth_and_rbac.sql`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/supabase/migrations/20261021000005_customer_auth_and_rbac.sql) in the SQL Editor.

---

## 8. Configuring Environment Variables

In your project root, open [`.env.local`](file:///c:/Users/kmvsu/OneDrive/Desktop/website-site/.env.local).

Retrieve your keys from **Supabase Dashboard -> Project Settings -> API**:

```bash
# Public Website URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Project URL (Project Settings -> API -> Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Public Anon Key (Project Settings -> API -> Project API keys -> anon)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Elevated Service Role Key (Project Settings -> API -> Project API keys -> service_role)
# CRITICAL: Keep strictly private. Never expose to client-side code!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save the file and restart your server (`npm.cmd run dev`). ShopSphere automatically detects real Supabase credentials and shifts into PostgreSQL mode.

---

## 9. Creating the First Secure Administrator Account

> ⚠️ **CRITICAL SECURITY RULE**: For security, ShopSphere has **no public admin registration form**. Customers can never grant themselves administrator status.

### Step 1: Register an Account as a Customer
Go to [http://localhost:3000/auth/register](http://localhost:3000/auth/register) and register using your admin email (e.g., `admin@yourdomain.com`).

### Step 2: Run the Trusted Server Promotion Command
Open your terminal in the project folder and run:

```powershell
npm.cmd run promote:admin admin@yourdomain.com
```

This utility uses the elevated `SUPABASE_SERVICE_ROLE_KEY` to update the user's role to `'admin'` directly in the database.

### Step 3: Sign In at Admin Portal
Visit [http://localhost:3000/admin/login](http://localhost:3000/admin/login) and sign in using your promoted admin credentials.

---

## 10. Testing Registration & Admin Metrics

You can verify the registration flow and admin customer metrics locally:

### 1. Run the Automated Test Suite
In your terminal, execute:
```powershell
npx.cmd tsx scripts/test-customer-auth.ts
```
All **49 automated assertions** will execute and report passing tests:
- Validation checks (email, phone, PIN code, password strength).
- Customer registration with all 11 fields.
- Address auto-creation and linking.
- Duplicate account prevention.
- Customer login, logout, and session clearing.
- Customer profile editing.
- Address management (add, edit, set default, delete).
- Privilege escalation prevention (`assertAdmin` blocks customers).
- Admin customer metrics calculation (Total, Today, Last 7 Days, Verified).

### 2. Manual Verification in Browser
1. Open [http://localhost:3000/auth/register](http://localhost:3000/auth/register) and register a new test user.
2. Confirm you are redirected to [http://localhost:3000/account](http://localhost:3000/account) showing your name, email, phone, and saved address.
3. Open a new tab or incognito window, navigate to [http://localhost:3000/admin/users](http://localhost:3000/admin/users), log in as Admin, and observe:
   - **Total Customers** metric has incremented.
   - **Joined Today** metric displays your newly created account.
   - The user table displays the customer with masked email for privacy compliance.

---

## 11. Deploying Through GitHub and Vercel

### Step 1: Push Project to GitHub
```powershell
git add .
git commit -m "ShopSphere complete customer authentication and user management"
git branch -M main
git remote add origin https://github.com/<your-username>/shopsphere.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to [https://vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `shopsphere` repository and click **Import**.

### Step 3: Add Vercel Environment Variables
Under **Environment Variables**, add:
- `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Step 4: Click Deploy
Vercel will compile all 44 routes and publish your live website.

### Step 5: Configure Supabase Redirect URLs
1. In Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to: `https://your-project.vercel.app`
3. Add **Redirect URL**: `https://your-project.vercel.app/auth/callback`
4. Click **Save**.

---

## 12. Verification Status & External Credentials Checklist

| Feature | Local Status | Production Status | Required Action to Enable in Production |
|---|---|---|---|
| **Customer Registration** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Customer Login & Logout** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Password Strength Meter** | `VERIFIED WORKING` | `VERIFIED WORKING` | Ready out of the box |
| **Address Book Management** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Customer Profile Editing** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Admin User Management** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Admin KPI Customer Counts** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Audit Logging (`admin_audit_logs`)** | `VERIFIED WORKING` | `READY FOR CONFIG` | Connect Supabase in `.env.local` |
| **Email Verification Dispatch** | `SIMULATED IN DEV` | `NEEDS CONFIGURATION` | Configure SMTP / Resend in Supabase Dashboard |
| **Online Payments (Razorpay)** | `COD WORKING` | `NEEDS CONFIGURATION` | Add Razorpay Key ID and Secret in `.env.local` |
| **Vercel Cloud Deployment** | `BUILD VERIFIED` | `NEEDS CONFIGURATION` | Import repository into Vercel |

---

*Manual prepared for the ShopSphere Development Team.*
