# ShopSphere — Complete Beginner-Friendly Guide

**Welcome to ShopSphere!** This guide is written in clear, simple English for store owners, developers, and administrators to understand exactly how the website works, where data is kept, and how to run the store safely.

---

### 1. What frontend technologies are used?
ShopSphere uses **Next.js 16** with **React 19** and **TypeScript**. For styling, it uses **Tailwind CSS v4** for clean, modern mobile-friendly designs, and **Lucide React** for icons. The frontend runs with Next.js Turbopack, making pages load in fractions of a second.

---

### 2. What backend technologies are used?
ShopSphere uses **Next.js Server Actions** and **Node.js** running on the server. For the database and authentication, it connects to **Supabase** (powered by PostgreSQL). For email delivery, it uses **Resend**, and for Indian online payments, it uses **Razorpay**.

---

### 3. Where is customer data stored?
Customer data is stored securely in **Supabase PostgreSQL** in the `profiles`, `addresses`, and `customer_activity_logs` tables. Each customer can only see and edit their own data. Passwords, secret tokens, and credit card numbers are **never stored** in the database.

---

### 4. Where are products stored?
Product details (title, description, price, MRP, SKU, stock count, specifications) are stored in the `products`, `categories`, and `product_variants` tables in **Supabase PostgreSQL**. For backup and instant offline testing, a copy is also kept in memory so the store never goes down.

---

### 5. Where are product images stored?
Product images are stored in **Supabase Storage** in the `product-images` bucket, and served through a fast Content Delivery Network (CDN). Image URLs use auto-formatting (`WebP/AVIF`) so photos look sharp on phones without consuming customer data.

---

### 6. How does Email OTP login work?
When a customer enters their email on `/auth/login`:
1. The server generates a random 6-digit code.
2. The code is emailed to the customer using Resend / Supabase Auth.
3. The customer types the 6-digit code.
4. When verified, the customer is signed in immediately.
5. If they are a new customer, their account is created automatically!
6. No password is required, and mobile SMS charges are completely avoided.

---

### 7. How does Supabase work?
Supabase is an online cloud database powered by PostgreSQL. It stores your tables, handles user accounts, and enforces **Row Level Security (RLS)**—meaning rules in the database ensure Customer A cannot read Customer B's addresses or orders.

---

### 8. How does GitHub work?
GitHub stores the source code of ShopSphere in a repository (`https://github.com/MOHANKOTHAMASU/shopsphere`). Whenever changes are made and pushed to the `main` branch, GitHub notifies Vercel to automatically build and update the website.

---

### 9. How does Vercel work?
Vercel is the cloud hosting platform that runs the Next.js website. It runs copies of the website on servers located in Mumbai (India) and around the world, ensuring lightning-fast load times for Indian shoppers.

---

### 10. How does deployment happen?
Deployments are **100% automated**:
1. You make an edit or fix in the code.
2. You run `git commit` and `git push origin main`.
3. Vercel automatically detects the push, runs `npm run build`, and publishes the live update in under 1 minute without any downtime.

---

### 11. How does the Admin add products?
1. Open [`/admin/login`](https://shopsphere-xi-gilt.vercel.app/admin/login).
2. Enter your authorized admin email and master password.
3. In the sidebar, click **Products** -> **Add New Product**.
4. Fill in the title, category, price, MRP, SKU, stock, and image URL.
5. Click **Publish Product**. It will appear on the customer website immediately.

---

### 12. How do customer orders work?
1. Customer adds items to their cart.
2. Customer proceeds to checkout and enters their delivery address.
3. Customer chooses **Cash on Delivery (COD)** or **Razorpay (UPI / Card)**.
4. The server validates stock and creates the order in the `orders` table.
5. The customer receives an order confirmation with an order number (e.g. `ORD-20261109-12345`).
6. The customer can track the package on `/track` or download a GST tax invoice in `/account/orders`.

---

### 13. How to manage product inventory?
In the Admin Dashboard, click **Inventory**. You can see low-stock alerts, type exact quantities, or use the quick **+10, +25, -10, -25** restock buttons. The system prevents stock from ever dropping below 0.

---

### 14. How to check errors?
1. **On your computer:** Run `npm run build` or `npm run dev`. Any error will display in the terminal.
2. **On Vercel:** Open your Vercel Dashboard -> click **Logs** to view real-time server events.
3. **On Supabase:** Open Supabase Dashboard -> click **Logs Explorer** to inspect database queries.

---

### 15. How to update the website?
1. Edit the relevant file in `src/`.
2. Test the change with `npm run build`.
3. Commit and push:
   ```bash
   git add -A
   git commit -m "Description of change"
   git push origin main
   ```
4. Vercel updates the live site automatically.

---

### 16. How to add new features?
Create modular components under `src/components/` and server functions under `src/lib/`. Always keep customer data queries isolated to the authenticated user ID (`caller.userId`) to maintain security.

---

### 17. How to prevent data loss?
* Never click "Reset Database" in Supabase.
* Keep all database changes in SQL migration files inside `supabase/migrations/`.
* Download regular backups of your database from the Supabase Dashboard (`Database -> Backups`).

---

### 18. How to manage costs?
* Use the **Free Tier** of Vercel and Supabase.
* Keep Email OTP as primary (free with Resend up to 3,000 emails/month).
* Avoid enabling paid third-party SMS providers unless necessary.
* Use image auto-compression so you stay well within bandwidth allowances.

---

### 19. How to scale ShopSphere?
Because ShopSphere uses static pre-rendering, edge CDN caching, and serverless database connection pooling, it can easily handle **thousands of concurrent shoppers** on the current free architecture without requiring expensive virtual machines or Docker setups.

---

### 20. What should I do next?
1. Open your live website: [`https://shopsphere-xi-gilt.vercel.app`](https://shopsphere-xi-gilt.vercel.app).
2. Test signing in with your email using the 6-digit verification code.
3. Browse the new budget products (under ₹500 and ₹1,000 in Furniture, Mobiles, and Electronics).
4. Log into the Admin Console at [`/admin/login`](https://shopsphere-xi-gilt.vercel.app/admin/login) using your master credentials to view the live dashboard and customer activity timeline.

