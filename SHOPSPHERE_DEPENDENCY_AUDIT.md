# ShopSphere — Dependency Security & Package Audit

**Audit Date:** November 9, 2026  
**Auditor:** Senior DevOps & Security Engineer  
**Runtime:** Node.js v24.21.0 | npm v10.8.2  
**Package Status:** Verified Lean, Clean, and Audited  

---

## 1. Production Runtime Dependencies Breakdown

Every single dependency in `package.json` is strictly vetted for maintenance status, security, and necessity:

| Package | Version | Purpose in ShopSphere | Maintenance & Security Status |
| :--- | :--- | :--- | :--- |
| `next` | `16.4.2` | Core full-stack React framework (Turbopack, PPR, SSR) | **Active & Maintained** (Vercel flagship) |
| `react` | `19.3.0` | Frontend UI library, concurrent rendering, Server Actions | **Active & Maintained** (Meta flagship) |
| `react-dom` | `19.3.0` | DOM bindings for React 19 | **Active & Maintained** |
| `@supabase/ssr` | `^0.12.7` | Official Supabase SSR cookie session adapter for Next.js | **Active & Maintained** (Official Supabase) |
| `@supabase/supabase-js` | `^2.118.0` | Official Supabase PostgreSQL and Auth client library | **Active & Maintained** (Official Supabase) |
| `resend` | `^6.37.0` | Transactional email delivery engine for 6-digit OTPs | **Active & Maintained** (Official Resend) |
| `razorpay` | `^2.9.8` | Indian payment gateway SDK (UPI, Cards, Netbanking) | **Active & Maintained** (Official Razorpay) |
| `lucide-react` | `^1.60.0` | Clean, accessible SVG icon library with tree-shaking | **Active & Maintained** (Zero runtime bloat) |

---

## 2. Development Dependencies & Build Tooling

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `tailwindcss` | `^4.0.0` | Ultra-fast utility-first CSS styling engine |
| `@tailwindcss/turbopack`| `^4.0.0` | Turbopack native CSS integration module |
| `typescript` | `^5.0.0` | Strict static type checking across all 56 routes |
| `eslint` / `eslint-config-next`| `^9.0.0` / `16.4.2` | Code standards and Next.js Best Practices enforcement |
| `lightningcss-win32-x64-msvc` | `^1.32.0` | Native Windows CSS parsing optimization binary |

---

## 3. Dependency Security & Hygiene Analysis

1. **Zero High/Critical Vulnerabilities:** Vetted and patched via `npm audit fix`.
2. **Lockfile Integrity:** `package-lock.json` is fully committed and synchronized with `package.json`.
3. **No Unused Bloat:** Excluded heavy legacy libraries (such as Moment.js, Lodash, jQuery, or unoptimized carousel plugins) in favor of native standard Web APIs (`crypto`, `Date`, `fetch`).

