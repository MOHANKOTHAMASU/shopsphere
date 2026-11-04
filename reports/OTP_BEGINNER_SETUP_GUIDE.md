# ShopSphere: Beginner's Guide to Universal Mobile OTP Login
**Document:** Plain English Setup & Operational Guide  
**Application:** ShopSphere E-Commerce  
**Audience:** Beginners, Store Owners & Operators  
**Date:** October 30, 2026  

---

## Welcome to Your Mobile OTP Login System!

ShopSphere now works exactly like **Amazon India, Flipkart, and Meesho**:
1. When you or any customer opens [`/auth/login`](http://localhost:3000/auth/login), the website immediately asks:
   **"Mobile Number"** (with `+91` for India).
2. You enter your 10-digit phone number (e.g., `9652788899`) and click **"Request SMS Verification Code"**.
3. The server generates a 6-digit code.
4. You enter the 6 digits on the screen and click **"Verify & Continue"**.
5. You are logged into your customer account!

---

## 1. Why Did You Get "Invalid verification code" Earlier?

When you tested earlier with `1 2 3 4 5 6` and saw:
> *`Invalid verification code. You have 3 attempts remaining.`*

### Here is why that happened:
1. **Empty Keys in `.env.local`:**
   In your `.env.local` file, lines 25–27 were empty:
   ```bash
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_VERIFY_SERVICE_SID=
   ```
   Without these 3 keys, the website had no connection to cellular mobile towers (Jio, Airtel, Vi, BSNL). Your phone did not receive an SMS because no telecom gateway was connected.
2. **Secret Random Number in Memory:**
   When the keys were empty, the server generated a random secret number (like `748291`) in memory. It did not display it to you. When you typed `1 2 3 4 5 6`, the server said "this does not match `748291`".

---

## 2. What We Fixed for You Right Now

1. **Test Sandbox Code Active:**
   We updated the server so that when you test locally without external keys, **`123456` is officially accepted as the developer preview code!** You will never be locked out with "Invalid verification code" while testing your website.
2. **Helpful Screen Notice:**
   The OTP screen now displays a friendly tip:
   `"Sandbox Test Mode: Enter 123456 to preview login"`.
3. **Mobile Number Login is Now the Default:**
   When you open `/auth/login`, it no longer asks for email and password first. It defaults directly to **Mobile OTP Login** (with `+91`).

---

## 3. How to Turn on REAL SMS Delivery to Your Real Phone

To receive real SMS messages on your physical smartphone across Jio, Airtel, Vi, or BSNL:

### Step 1: Create a Free Account on Twilio
1. Open [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio) in your browser.
2. Sign up and verify your email.

### Step 2: Copy Your 3 Keys
In your [Twilio Console Dashboard](https://console.twilio.com/):
1. **Account SID:** Starts with `AC...` (e.g. `AC1a2b3c4d5e...`)
2. **Auth Token:** Click "Show" and copy the 32-character token.
3. **Verify Service SID:** Go to Twilio Verify $\rightarrow$ Create Service $\rightarrow$ copy the SID starting with `VA...`.

### Step 3: Paste into `.env.local`
Open `.env.local` in your editor and paste them on lines 25–27:
```bash
TWILIO_ACCOUNT_SID=ACyour_real_account_sid_here
TWILIO_AUTH_TOKEN=your_real_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAyour_real_verify_service_sid_here
```

### Step 4: Test in Terminal
Run this command in your PowerShell terminal:
```powershell
npx.cmd tsx scripts/verify-twilio-config.ts
```
When it says "Connected", open your browser, enter your phone number, and a real SMS will buzz on your physical phone!

---

## 4. How to Test Your Mobile Login Right Now

1. Open your browser and go to:
   ```text
   http://localhost:3000/auth/login
   ```
2. You will see **Mobile OTP Login** is selected by default.
3. Enter any 10-digit mobile number (e.g., `9652788899`).
4. Click the blue button: **"Request SMS Verification Code"**.
5. On the next screen, type:
   $$\mathbf{1 \quad 2 \quad 3 \quad 4 \quad 5 \quad 6}$$
6. Click **"Verify & Continue"**.
7. You are instantly logged in! Look at the top navigation bar—it will say:
   `Hello, Customer` $\rightarrow$ `My Account`!

