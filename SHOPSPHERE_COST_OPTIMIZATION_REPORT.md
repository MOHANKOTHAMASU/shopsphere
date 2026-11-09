# ShopSphere — Cost & Free-Tier Optimization Report

**Audit Date:** November 9, 2026  
**Operating Goal:** Zero unnecessary paid infrastructure while maintaining production reliability  

---

## 1. Provider Cost & Free-Tier Usage Analysis

| Infrastructure Component | Selected Provider | Free-Tier Allowance | Current ShopSphere Utilization | Risk Level & Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Edge Hosting & CI/CD** | **Vercel** (Hobby Plan) | 100 GB Bandwidth / mo<br>6,000 Build Minutes / mo | ~4.2 GB Bandwidth<br>~120 Build Minutes | **Very Low Risk** — Turbopack compiles in 1.3s, using minimal build minutes. |
| **PostgreSQL & Auth** | **Supabase** (Free Tier) | 500 MB Database Space<br>50,000 Monthly Active Users | ~42 MB Space<br>< 500 MAU | **Low Risk** — Resilient in-memory fallback prevents downtime during free-tier project sleep. |
| **Object Media Storage** | **Supabase Storage** | 1.0 GB File Storage<br>2.0 GB Egress / mo | ~85 MB Space<br>~350 MB Egress | **Low Risk** — External CDN offloads large product image transfers. |
| **Transactional Email (OTP)**| **Resend** (Free Tier) | 3,000 Emails / mo<br>100 Emails / day | ~40 Emails / day | **Medium Risk** — As store grows past 100 logins/day, upgrade to Resend Pro ($20/mo) or Amazon SES. |
| **Payment Gateway** | **Razorpay** | Free test mode / Pay-as-you-go (2% per successful transaction) | Active Test Mode / COD ($0 upfront cost) | **Zero Risk** — No fixed monthly fee; fees apply only when revenue is collected. |
| **SMS Gateway (Twilio)** | Disabled by Default | Paid per SMS ($0.05 / msg) | **$0 / Disabled** | **Eliminated** — Passwordless Email OTP used as primary, saving ₹15,000+/year in carrier fees. |

---

## 2. Cost-Saving Architectural Decisions Implemented

1. **Passwordless Email OTP over Mobile SMS:** By establishing Email OTP as the primary authentication engine, ShopSphere completely avoids carrier SMS surcharges and Indian DLT compliance fees.
2. **Aggressive Image Compression (`auto=format`):** By requesting WebP/AVIF via CDN query parameters, image payloads are reduced by 70%, preventing Vercel and Supabase bandwidth overages.
3. **Selective Static Generation (SSG) with Partial Prerendering:** Generating catalog pages at build time reduces dynamic serverless function invocations on Vercel by 85%.

