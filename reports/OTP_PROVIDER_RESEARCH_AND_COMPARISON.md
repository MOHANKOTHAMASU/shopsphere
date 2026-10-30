# ShopSphere: OTP Telecom Provider Research & Comparison
**Document:** Telecom Gateway Evaluation & Scoring Matrix  
**Target Region:** India (Jio, Airtel, Vi, BSNL) & Global  
**Date:** October 30, 2026  
**Auditor:** Telecom Integration Specialist & Full-Stack Architect  

---

## 1. Comprehensive Provider Comparison Matrix

| Provider | India Operator Delivery (Jio/Airtel/Vi/BSNL) | DLT Compliance Burden | Node.js & Next.js Integration | Managed OTP Verification | Est. Cost per OTP (India) | Overall Score (1-10) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Twilio Verify v2** | **Excellent (9.5/10)**<br>Delivers via premier Indian routes | **Low**<br>Verify handles carrier DLT templates automatically for OTPs | **10/10**<br>Native REST API & official SDK | **10/10**<br>Twilio generates, stores, tracks, and verifies OTP | **\$0.05 / verification** (~₹4.20 per approved OTP) | **9.2 / 10** |
| **MSG91 (SendOTP)** | **Excellent (9.6/10)**<br>India-native telecom routing | **High**<br>Requires manual DLT registration & Template ID | **8.5/10**<br>REST API & widget SDK | **9/10**<br>Provides SendOTP managed service | **₹0.18 - ₹0.25 / SMS** (Requires ₹5,000 min recharge) | **8.6 / 10** |
| **Firebase Phone Auth** | **Very Good (8.8/10)**<br>Google telecom partnerships | **Zero**<br>Managed entirely by Google Cloud | **7.5/10**<br>Requires client reCAPTCHA / invisible verifier | **10/10**<br>Managed end-to-end by Firebase | **Free (10k/mo)**<br>Then \$0.01 - \$0.06 / verification | **8.5 / 10** |
| **Gupshup** | **Excellent (9.3/10)**<br>Enterprise Indian telecom routes | **High**<br>Requires strict DLT approval & corporate GSTIN | **8.0/10**<br>Enterprise HTTP REST API | **8/10**<br>Two-factor API with templates | **₹0.20 - ₹0.30 / SMS** (Enterprise minimums apply) | **8.0 / 10** |
| **Supabase Phone Auth** | **Dependent on Provider**<br>(Wraps Twilio/MessageBird) | **Inherited** from connected vendor | **9.0/10**<br>Direct Supabase SDK `signInWithOtp()` | **9/10**<br>Managed by Supabase GoTrue engine | **Vendor cost + Supabase tier** | **8.4 / 10** |
| **Vonage (Nexmo)** | **Good (8.2/10)**<br>Global gateway | **Medium**<br>Requires template submission | **8.5/10**<br>Verify API v2 | **8.5/10**<br>Managed verification flow | **€0.04 - €0.08 / OTP** (~₹4 - ₹7) | **7.8 / 10** |

---

## 2. In-Depth Provider Breakdown

### 1. Twilio Verify API v2 (Score: 9.2 / 10)
- **Strengths:**
  - **No Plain-Text Storage:** Twilio generates the code on its telecom servers and verifies it with a single API call (`/VerificationCheck`).
  - **Zero DLT Friction for Testing:** Twilio Verify utilizes pre-approved carrier channels, eliminating the multi-week TRAI DLT registration barrier for startups.
  - **Global & Indian Coverage:** Instant delivery across Jio, Airtel, Vodafone Idea (Vi), and BSNL without operator filtering.
- **Limitations:**
  - Pricing is denominated in USD (\$0.05 per successful verification), which is higher per message than bulk Indian aggregators, though economical for startup traffic.

### 2. MSG91 (Score: 8.6 / 10)
- **Strengths:**
  - India's leading transactional SMS provider. Ultra-low cost per domestic SMS (₹0.18 - ₹0.25).
  - Excellent direct SMPP connections with Jio and Airtel gateways.
- **Limitations:**
  - Requires Indian business registration (GSTIN), DLT registration (VilPower / Jio DLT), and upfront wallet recharge (typically ₹2,000 - ₹5,000 minimum).

### 3. Firebase Phone Authentication (Score: 8.5 / 10)
- **Strengths:**
  - Free tier offers 10,000 phone verifications per month.
  - Google manages telecom carrier contracts and DLT compliance behind the scenes.
- **Limitations:**
  - Requires Firebase Client SDK and reCAPTCHA widget in the browser, which can cause UX friction on slow 3G mobile connections in India.

---

## 3. Decision Recommendation

- **For Immediate Production Launch & Frictionless Setup:** Use **Twilio Verify v2**. It connects directly to your existing Next.js backend with 3 environment variables in `.env.local` and delivers to all Indian mobile operators immediately.
- **For High-Scale Cost Optimization (10,000+ OTPs/month):** Transition to **MSG91** once your business entity completes DLT registration on VilPower/Jio DLT to reduce per-message cost to ~₹0.20.
