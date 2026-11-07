# ShopSphere: Multi-Account Security Audit & Root Cause Analysis

**Document Version:** 1.0.0  
**Audit Date:** November 7, 2026  
**System Evaluated:** ShopSphere E-Commerce Next.js & Supabase Platform  
**Target Vulnerability:** Multi-Account Login Mismatch, Cross-Tab Session Inconsistency, and Customer Profile Data Mixing  

---

## Executive Summary

During multi-account testing across browser tabs, customer accounts exhibited state bleeding:
1. When logging into Account A in Tab 1 and Account B in Tab 2, Tab 1's UI could still show Account A's name while making requests as Account B.
2. After a page refresh, both tabs would suddenly align to whichever account was most recently authenticated, confusing users into thinking accounts were randomly overwritten.
3. Placing an order under a new account (e.g. Venkatesh) previously displayed the store seed profile ("Mohan Kothamasu") on checkout confirmation.
4. Carts and wishlists previously shared un-scoped localStorage keys, leading to Customer B inheriting items added by Customer A.

This audit details the exact root causes, technical mechanisms, and security remediations implemented.

---

## Phase 1 — Root Cause Analysis & Reproduction

### Root Cause 1: Browser Storage & Cookie Sharing Architecture
* **Mechanism:** All tabs within the same browser profile share the exact same HTTP cookie jar and `localStorage`.
* **Behavior:** When Tab 2 logs in as Customer B, Supabase Auth updates the session cookies (`sb-access-token`, `sb-refresh-token`) and `localStorage` auth keys. Tab 1 was not notified of this change because there was no active cross-tab event bus (`BroadcastChannel`).
* **Result:** Tab 1 kept Customer A in React state in memory, while any subsequent server action or API request made by Tab 1 sent Customer B's cookies to the server.

### Root Cause 2: Profile Race Conditions & Stale UI Validation
* **Mechanism:** In `src/components/layout/Header.tsx`, the display name was rendered as:
  ```tsx
  // VULNERABLE CODE:
  const displayName = profile?.full_name || user?.user_metadata?.full_name || ...
  ```
  If a user switched accounts, `profile` in React state still held the previous customer's record while `user` had already updated to the new user. The header displayed the old name alongside the new email address.
* **Mechanism 2:** Asynchronous profile fetches had no sequence counter (`profileRequestIdRef`). If the profile fetch for Customer A resolved *after* Customer B logged in over a slow cellular or 3G connection, Customer A's profile data overwrote Customer B's active React state.

### Root Cause 3: Un-Scoped Cart & Wishlist LocalStorage Keys
* **Mechanism:** `CartContext` and `WishlistContext` previously used global keys:
  ```ts
  // VULNERABLE:
  localStorage.getItem('shopsphere_cart');
  localStorage.getItem('shopsphere_wishlist');
  ```
* **Result:** Customer B logged in on the same browser profile and immediately read Customer A's cached cart and wishlist items, syncing Customer A's private items into Customer B's database record.

### Root Cause 4: Fallback to Mohan Kothamasu Seed Data
* **Mechanism:** In server actions (`rewards/actions.ts` and `orders/actions.ts`), unauthenticated or loosely authenticated callers fell back to `getDemoUserAction()` (seeded with Mohan Kothamasu's address and metrics).
* **Result:** When a newly registered customer checked out before their address record was fully populated, the backend resolved Mohan Kothamasu's pre-configured shipping address on the order success screen.

---

## Phase 2 — Multi-Account Threat Modeling Matrix

| Threat Scenario | Vulnerability Level (Before) | Root Cause | Remediated Status |
| :--- | :---: | :--- | :---: |
| **Tab 1 logged in as A; Tab 2 logs in as B** | **High** | Tabs shared cookie jar without cross-tab broadcast synchronization. | **Resolved**: Real-time `BroadcastChannel` instantly syncs both tabs. |
| **Stale customer name in navigation header** | **Medium** | Header rendered `profile.full_name` without verifying `profile.id === user.id`. | **Resolved**: Strict identity match required before rendering profile data. |
| **Cart item cross-contamination** | **High** | Shared `shopsphere_cart` storage key across all users. | **Resolved**: Keys scoped per-user (`shopsphere_cart_${user.id}`). |
| **Wishlist pollution on login** | **Medium** | Guest/previous user items auto-persisted to new user database record. | **Resolved**: Strict scoped keys + immediate clearing on user switch. |
| **Order history / address leakage** | **Critical** | Server action fallback to seed account for unresolved users. | **Resolved**: Strict `caller.userId` isolation; 401 Unauthorized for cross-account lookups. |
| **Asynchronous fetch race conditions** | **Low** | Slow profile responses overwriting newer user logins. | **Resolved**: `profileRequestIdRef` sequence counter discards stale responses. |

---

## Conclusion
The security flaws were not caused by database schema flaws or Supabase Auth service bugs, but by **missing client-side synchronization and un-scoped browser storage**. By implementing `BroadcastChannel` synchronization, user-scoped storage partitions, and strict server-side caller validation, multi-account isolation is completely secured.
