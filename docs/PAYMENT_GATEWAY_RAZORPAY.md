# ShopSphere: Razorpay Payment Gateway Integration Guide (Phase 6)

## 1. Overview
ShopSphere integrates **Razorpay** as its primary digital payment gateway, powering seamless transactions for Credit/Debit Cards, UPI, NetBanking, and Digital Wallets with zero client-side trust and cryptographic signature verification.

---

## 2. Security Architecture (Zero-Client Trust)

1. **Server-Side Order Generation**:
   - Order totals are **never** trusted from browser payloads.
   - The server computes the authoritative payable total from database-verified items, shipping fees, and coupon discounts, converts the total to integer paise (₹1 = 100 paise), and calls the Razorpay Orders API (`POST https://api.razorpay.com/v1/orders`).

2. **Cryptographic Signature Verification**:
   - Every completed payment generates an HMAC-SHA256 signature calculated on the server:
     $$\text{expected\_signature} = \text{HMAC-SHA256}(\text{razorpay\_order\_id} \parallel "|" \parallel \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
   - Verified using `crypto.timingSafeEqual` to eliminate timing attack vulnerabilities.
   - **An order is NEVER marked as `paid` unless this cryptographic signature is verified.**

3. **Webhook Verification & Idempotency**:
   - The webhook handler at `/api/webhooks/razorpay` captures events asynchronously.
   - Verified using the raw unparsed request body text and `RAZORPAY_WEBHOOK_SECRET`.
   - The `payment_events` table enforces unique `event_id` storage, preventing duplicate processing when Razorpay delivers retry webhooks.

4. **Secret Isolation**:
   - `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are kept strictly in server-side environment variables and are **never** bundled or exposed to the client.

---

## 3. Environment Configuration

Add the following variables to `.env.local`:

```env
# Client-accessible Key ID for opening Checkout Modal
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_yourKeyIdHere

# Server-only API Credentials
RAZORPAY_KEY_ID=rzp_test_yourKeyIdHere
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Server-only Webhook Secret (Configured in Razorpay Dashboard > Webhooks)
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

---

## 4. Razorpay Test Mode Credentials & Test Cards

In test mode (keys starting with `rzp_test_`), use the following simulated payment details:

### A. Test Credit & Debit Cards
| Card Type | Card Number | Expiry | CVV | OTP | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visa (Success)** | `4111 1111 1111 1111` | Any future date (e.g. 12/28) | Any 3 digits (e.g. 123) | Any 4-6 digits | **Success** |
| **Mastercard (Success)**| `5123 4567 8901 2345` | Any future date | Any 3 digits | Any 4-6 digits | **Success** |
| **RuPay (Success)** | `5081 2611 1111 1111` | Any future date | Any 3 digits | Any 4-6 digits | **Success** |
| **Declined Card (Failure)** | `4000 0000 0000 0002` | Any future date | Any 3 digits | — | **Declined** |

### B. Test UPI
- **Success Virtual Payment Address (VPA)**: `success@razorpay`
- **Failure VPA**: `failure@razorpay`

### C. Test NetBanking
- Select any bank in test mode (e.g., **HDFC Bank**, **ICICI Bank**, **State Bank of India**).
- On the simulated bank portal, click **"Success"** to complete payment or **"Failure"** to test payment decline.

---

## 5. Webhook Configuration

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. Set **Webhook URL**:
   - Development (via ngrok / tunnel): `https://<your-tunnel-url>/api/webhooks/razorpay`
   - Production: `https://<your-domain>/api/webhooks/razorpay`
4. Set **Secret**: Enter a secure random string and set it as `RAZORPAY_WEBHOOK_SECRET` in `.env.local`.
5. Select active events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`
6. Click **Save**.

---

## 6. Production Activation Checklist

When transitioning from Test Mode to Live Production:

1. **Complete Business KYC**:
   - Submit business PAN, Certificate of Incorporation/GST, and bank account details on Razorpay Dashboard.
2. **Generate Live API Keys**:
   - In Razorpay Dashboard, toggle to **Live Mode**.
   - Navigate to **Settings** > **API Keys** > **Generate Live Key**.
   - Copy `rzp_live_...` Key ID and Secret.
3. **Update Production Environment Variables**:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
4. **Deploy Live Webhook**:
   - Configure your live webhook endpoint on Razorpay dashboard with the production URL and live secret.
5. **Verify HTTPS**:
   - Ensure SSL/TLS is active (`https://`). Razorpay Checkout modal requires HTTPS in production.
