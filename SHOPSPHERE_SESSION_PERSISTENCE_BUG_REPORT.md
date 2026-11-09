# ShopSphere — Session Persistence & Cookie Isolation Bug Report

**Audit Subject:** Investigating Customer Session Disappearance When Navigating Between Customer Store & Admin Console  
**Severity:** High (Fixed)  
**Date:** November 9, 2026  

---

## 1. Problem Description & User Symptoms

### Reported Symptoms:
1. A customer logs into the ShopSphere storefront as `k43413889@gmail.com` (showing "Verified Customer" in header).
2. The user then navigates to the Admin Management Console at `/admin` or `/admin/login`.
3. After logging into the admin console, or upon logging out of the admin console via the header, the user returns to the customer store (`/` or `/products`).
4. **The customer session vanished completely**, forcing the user to re-enter their email on `/auth/login`.

---

## 2. Root Cause Analysis

Inspection of `src/lib/auth/demo-users.ts` and `src/lib/auth/actions.ts` revealed that:
* **Single Shared Cookie Collision:** Both Customer sessions and Admin sessions wrote to the exact same cookie identifier:
  ```ts
  // LEGACY FLAW:
  export const DEMO_COOKIE_NAME = 'shopsphere_demo_session';
  ```
* When an administrator logged in via `performFallbackSignIn()`, `setDemoUserSession()` overwrote `shopsphere_demo_session` with the admin user object (`usr-admin-master`).
* When the administrator clicked "Sign Out" in `AdminHeader.tsx`, it executed `signOutAction()`, which invoked `cookieStore.delete('shopsphere_demo_session')`.
* Consequently, logging out of the admin console destroyed the customer's active session cookie on the browser!

---

## 3. Permanent Architectural Resolution

### 3.1 Cookie Domain Isolation (`src/lib/auth/demo-users.ts`)
The single cookie was divided into two distinct, isolated cookies:
```ts
export const CUSTOMER_SESSION_COOKIE = 'shopsphere_customer_session';
export const ADMIN_SESSION_COOKIE = 'shopsphere_admin_session';
```

### 3.2 Role-Aware Session Dispatching (`src/lib/auth/actions.ts`)
* `setDemoUserSession(user)`:
  * If `user.role === 'admin'`: writes exclusively to `ADMIN_SESSION_COOKIE`.
  * If `user.role === 'customer'`: writes exclusively to `CUSTOMER_SESSION_COOKIE`.
* `getDemoUserAction(role)`:
  * Customer storefront routes check `CUSTOMER_SESSION_COOKIE`.
  * Administrative routes check `ADMIN_SESSION_COOKIE`.
* `adminSignOutAction()`:
  * Exclusively deletes `ADMIN_SESSION_COOKIE`.
  * **Never touches** `CUSTOMER_SESSION_COOKIE`.
* `signOutAction()`:
  * Exclusively deletes `CUSTOMER_SESSION_COOKIE` and customer Supabase tokens.
  * **Never touches** `ADMIN_SESSION_COOKIE`.

### 3.3 Active Session Detection on Login Page (`/auth/login`)
When an already authenticated customer visits `/auth/login`:
* Instead of showing an empty form, it recognizes the active session (`k43413889@gmail.com`).
* Displays a clear choice:
  * **"Go to Account"** (`/account`)
  * **"Switch Account"** (invokes `signOut('/auth/login?switch=true')`, cleanly clearing cookies before allowing another email to be entered).

---

## 4. Verification & Automated Test Confirmation

Automated tests in `scripts/test-product-video-and-session-isolation.ts` verified:
1. Customer logs in (`k43413889@gmail.com`) -> session stored in `CUSTOMER_SESSION_COOKIE`.
2. Admin logs in (`kmvsubbarao28@gmail.com`) -> session stored in `ADMIN_SESSION_COOKIE`.
3. Customer session retrieved and confirmed intact.
4. Admin logs out -> `ADMIN_SESSION_COOKIE` deleted.
5. Customer session retrieved and confirmed **still 100% active and authenticated**.
