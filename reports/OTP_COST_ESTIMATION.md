# ShopSphere: OTP Telecom Cost & Scalability Estimation
**Document:** Financial Modeling & Monthly Telephony Projections  
**Currency:** Indian Rupee (INR ₹) & USD (\$) (Conversion: \$1 USD $\approx$ ₹84.00 INR)  
**Date:** October 30, 2026  
**Auditor:** DevOps Cost Specialist & Financial Analyst  

---

## 1. Cost Modeling Assumptions

To provide realistic financial estimates:
1. **Resend & Retry Factor:** We model a 15% OTP resend rate (average user behavior in e-commerce).
2. **Success Ratio:** 85% of OTPs are successfully verified on first attempt; 15% require a second code.
3. **Twilio Verify Pricing:** \$0.05 per successful verification (failed or expired attempts are free of verification fees).
4. **MSG91 India DLT Route:** ~₹0.20 per SMS + 18% GST = ~₹0.24 per SMS sent.
5. **Firebase Phone Auth:** First 10,000 verifications per month are **100% Free**; thereafter \$0.01 to \$0.06 per verification.

---

## 2. Monthly Cost Projections by Traffic Tier

### Tier 1: Startup Stage (100 Login OTPs / Month)
- **Twilio Verify:** $100 \times \$0.05 = \$5.00$ (**₹420 / month**)
- **MSG91:** $115 \text{ SMS} \times ₹0.24 = ₹27.60$ (Subject to ₹2,000 minimum wallet recharge)
- **Firebase:** **₹0 / month** (Within free 10k quota)

---

### Tier 2: Growing Store (1,000 Login OTPs / Month)
- **Twilio Verify:** $1,000 \times \$0.05 = \$50.00$ (**₹4,200 / month**)
- **MSG91:** $1,150 \text{ SMS} \times ₹0.24 = ₹276.00$ (**~₹276 / month**)
- **Firebase:** **₹0 / month** (Within free 10k quota)

---

### Tier 3: High-Volume Commercial Store (10,000 Login OTPs / Month)
- **Twilio Verify:** $10,000 \times \$0.05 = \$500.00$ (**₹42,000 / month**)
- **MSG91:** $11,500 \text{ SMS} \times ₹0.24 = ₹2,760.00$ (**~₹2,760 / month**)
- **Firebase:** **₹0 / month** (Hits 10k boundary)

---

### Tier 4: Enterprise Flipkart-Scale (100,000 Login OTPs / Month)
- **Twilio Verify:** $100,000 \times \$0.045 \text{ (Volume discount)} = \$4,500.00$ (**₹3,78,000 / month**)
- **MSG91:** $115,000 \text{ SMS} \times ₹0.18 \text{ (Enterprise volume)} = ₹20,700.00$ + GST = **~₹24,426 / month**
- **Firebase:** $90,000 \text{ overage} \times \$0.02 = \$1,800.00$ (**₹1,51,200 / month**)

---

## 3. Financial Summary & Strategic Roadmap

1. **Launch Phase (0 to 1,000 customers/mo):**
   - Use **Twilio Verify**. At ₹420 to ₹4,200/mo, you avoid the administrative and legal costs of enterprise DLT registration while launching immediately.
2. **Growth Phase (10,000+ customers/mo):**
   - Register your business on an Indian DLT portal (VilPower or Jio DLT) and connect **MSG91** to slash your monthly telecom bill from ₹42,000 down to ₹2,760 per month (a **93% cost reduction**).
