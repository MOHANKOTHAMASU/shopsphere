import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMsg91FlowSms, getSmsProviderStatus } from '@/lib/auth/sms-service';
import { maskPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from '@/lib/auth/phone-utils';

/**
 * POST /api/auth/send-sms
 * Supabase GoTrue Auth Webhook Endpoint for Custom SMS Delivery
 * Integrates Supabase Phone Auth with MSG91 Flow API (India DLT Compliant)
 * 
 * Cryptographically verifies SUPABASE_HOOK_SECRET to prevent unauthorized relay.
 */
export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.SUPABASE_HOOK_SECRET;

    // 1. Mandatory Secret Verification in Production
    if (!configuredSecret) {
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        console.error('[ShopSphere SMS Hook] SUPABASE_HOOK_SECRET is not configured on the server. Rejecting request.');
        return NextResponse.json(
          { error: 'SMS Hook is disabled: Server authentication secret not configured.' },
          { status: 503 }
        );
      }
    } else {
      const authHeader = req.headers.get('authorization') || '';
      const hookSecretHeader = req.headers.get('x-hook-secret') || '';
      const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim() || hookSecretHeader.trim();

      const secretBuffer = Buffer.from(configuredSecret);
      const providedBuffer = Buffer.from(providedSecret);

      if (
        secretBuffer.length !== providedBuffer.length ||
        !crypto.timingSafeEqual(secretBuffer, providedBuffer)
      ) {
        console.warn('[ShopSphere SMS Hook] Unauthorized webhook attempt: secret signature mismatch.');
        return NextResponse.json(
          { error: 'Unauthorized: Invalid hook secret' },
          { status: 401 }
        );
      }
    }

    // 2. Parse payload from Supabase GoTrue
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Supabase GoTrue sends: { user: { phone: string }, sms: { otp: string } }
    const phone = payload?.user?.phone || payload?.phone;
    const otp = payload?.sms?.otp || payload?.otp;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and otp' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    // Validate OTP format: 4 to 8 numeric digits
    if (!/^\d{4,8}$/.test(cleanOtp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Must be numeric.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber('+91', String(phone));
    const phoneValidation = validatePhoneNumber('+91', normalizedPhone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error || 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    const masked = maskPhoneNumber(normalizedPhone);
    console.log(`[ShopSphere SMS Hook] Authorized dispatch request for ${masked}`);

    // 3. Dispatch via MSG91 Flow API
    const providerStatus = getSmsProviderStatus();

    if (providerStatus.provider === 'msg91') {
      const msg91Result = await sendMsg91FlowSms(normalizedPhone, cleanOtp);

      if (!msg91Result.success) {
        console.error(`[ShopSphere SMS Hook] MSG91 delivery rejected for ${masked}:`, msg91Result.message);
        return NextResponse.json(
          { error: 'SMS delivery failed at carrier gateway', code: msg91Result.error },
          { status: 502 }
        );
      }

      console.log(`[ShopSphere SMS Hook] Successfully dispatched OTP to ${masked} via MSG91 (ID: ${msg91Result.messageId})`);
      return NextResponse.json({ success: true, messageId: msg91Result.messageId }, { status: 200 });
    }

    // Fallback: If Twilio is configured
    if (providerStatus.provider === 'twilio') {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      if (twilioSid && twilioToken) {
        const bodyParams = new URLSearchParams();
        bodyParams.set('To', normalizedPhone);
        if (messagingServiceSid) {
          bodyParams.set('MessagingServiceSid', messagingServiceSid);
        } else if (fromPhone) {
          bodyParams.set('From', fromPhone);
        }
        bodyParams.set('Body', `Your ShopSphere verification code is: ${cleanOtp}. Valid for 5 minutes.`);

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (!res.ok) {
          return NextResponse.json(
            { error: 'Twilio carrier dispatch failed' },
            { status: 502 }
          );
        }

        return NextResponse.json({ success: true, provider: 'twilio' }, { status: 200 });
      }
    }

    // In development or test without live telecom keys, acknowledge for test runner
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'test') {
      console.log(`[ShopSphere SMS Hook Sandbox] Mocked SMS OTP dispatch for ${masked}: OTP [PROTECTED]`);
      return NextResponse.json(
        { success: true, sandbox: true, note: 'Mock delivery in non-production mode' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'No SMS delivery gateway configured (MSG91 or Twilio required)' },
      { status: 503 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[ShopSphere SMS Hook] Unhandled exception:', errorMsg);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : errorMsg },
      { status: 500 }
    );
  }
}
