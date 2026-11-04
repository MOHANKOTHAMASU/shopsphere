import { NextRequest, NextResponse } from 'next/server';
import { sendMsg91FlowSms, getSmsProviderStatus } from '@/lib/auth/sms-service';
import { maskPhoneNumber, normalizePhoneNumber } from '@/lib/auth/phone-utils';

/**
 * POST /api/auth/send-sms
 * Supabase GoTrue Auth Webhook Endpoint for Custom SMS Delivery
 * Integrates Supabase Phone Auth with MSG91 Flow API (India DLT Compliant)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Webhook Secret if configured
    const configuredSecret = process.env.SUPABASE_HOOK_SECRET;
    if (configuredSecret) {
      const authHeader = req.headers.get('authorization') || '';
      const hookSecretHeader = req.headers.get('x-hook-secret') || '';
      const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim() || hookSecretHeader.trim();

      if (providedSecret !== configuredSecret) {
        console.warn('[ShopSphere SMS Hook] Unauthorized webhook attempt: secret mismatch.');
        return NextResponse.json(
          { error: 'Unauthorized: Invalid hook secret' },
          { status: 401 }
        );
      }
    }

    // 2. Parse payload from Supabase GoTrue
    const payload = await req.json().catch(() => null);
    if (!payload) {
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

    const normalizedPhone = normalizePhoneNumber('+91', phone);
    const masked = maskPhoneNumber(normalizedPhone);

    console.log(`[ShopSphere SMS Hook] Received dispatch request for ${masked}`);

    // 3. Dispatch via MSG91 Flow API
    const providerStatus = getSmsProviderStatus();

    if (providerStatus.provider === 'msg91') {
      const msg91Result = await sendMsg91FlowSms(normalizedPhone, String(otp));

      if (!msg91Result.success) {
        console.error(`[ShopSphere SMS Hook] MSG91 delivery rejected for ${masked}:`, msg91Result.message);
        return NextResponse.json(
          { error: msg91Result.message, code: msg91Result.error },
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
        bodyParams.set('Body', `Your ShopSphere verification code is: ${otp}. Valid for 5 minutes.`);

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: errData.message || 'Twilio dispatch failed' },
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
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
