# ShopSphere: Authentication & Multi-Account Guide for Developers & Store Admins

**Document Version:** 1.0.0  
**Target Audience:** Developers, Store Administrators, and Support Engineers  

---

## 1. How Web Authentication Works (The Basics)

When a customer logs into ShopSphere:
1. **Email OTP Verification:** The user enters their registered email address. The server generates a cryptographic one-time password (OTP) and sends it securely to their inbox.
2. **Session Creation:** When the user enters the correct 6-digit code, the server verifies it and issues a signed cryptographic session token (JWT).
3. **Cookie Storage:** The browser stores this session token in a secure cookie (`sb-access-token`). Every time the browser makes a request to the server, it automatically attaches this cookie to prove the user's identity.

---

## 2. Why Multiple Browser Tabs Share the Same Account

In all web browsers (Chrome, Edge, Safari, Firefox):
* **One Profile = One Cookie Jar:** Every tab open in the same browser window or profile shares the **exact same cookies and localStorage**.
* If you log into Customer A in Tab 1, and then log into Customer B in Tab 2 within the same browser, Tab 2 overwrites the cookie jar with Customer B's session.
* Previously, Tab 1 didn't know Tab 2 logged in as Customer B, leading to visual confusion.

### How ShopSphere Solved This
ShopSphere uses a browser technology called `BroadcastChannel`:
* Whenever you log into an account or log out in any tab, that tab broadcasts a message: `"Session updated!"`.
* Every other open tab receives this broadcast instantly and immediately updates its display.
* If you need to test or use two different customer accounts simultaneously, open the second account in an **Incognito / Private Window** or a **Separate Chrome Profile**.

---

## 3. How Data Isolation Works

### User Identity as the Single Source of Truth
Every customer in ShopSphere has a unique UUID (e.g., `usr-cust-12345`).
* Addresses are saved with: `userId: usr-cust-12345`
* Orders are saved with: `customerId: usr-cust-12345`
* Carts are cached in the browser with: `shopsphere_cart_usr-cust-12345`
* Wishlists are cached with: `shopsphere_wishlist_usr-cust-12345`

### No Fallback to Demo Data
In older versions, if a customer checked out without an address, the system previously used Mohan Kothamasu's seed address. That has been completely removed:
* All orders strictly belong to the authenticated caller.
* A customer only sees their own delivery addresses and order history.
* Other customers receive an `Unauthorized` error if they try to access an order number that doesn't belong to them.

---

## 4. How to Switch Accounts Cleanly

1. Click on **My Account** in the top navigation bar.
2. Click **Switch Account** or **Sign Out**.
3. When signing out:
   - The session token is cleared from browser cookies.
   - The user's cached cart and wishlist are detached from the active view.
   - The navigation header immediately returns to "Sign In".
4. Log in with the new email address and enter the 6-digit OTP.
5. The new customer's dashboard, addresses, and order history will load exclusively.

---

## 5. Security Best Practices for Administrators

* **Never Share Admin Credentials:** The ShopSphere Admin Console (`/admin/login`) is strictly restricted to authorized staff.
* **Master Admin vs Customer Accounts:** Customer accounts use passwordless Email OTP verification. The Admin Console uses Master Admin authentication protected by the server environment variables.
* **Multi-Tab Testing:** When testing customer workflows, use one standard browser window for Customer A, an Incognito window for Customer B, and a separate window for Admin.

