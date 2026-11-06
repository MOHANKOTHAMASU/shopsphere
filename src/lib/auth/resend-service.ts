import { Resend } from 'resend';

/**
 * Checks if Resend API is configured in environment
 */
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key.startsWith('re_') && !key.includes('placeholder'));
}

/**
 * Dispatches an authentic transactional OTP email via Resend
 */
export async function sendOtpEmailViaResend(
  to: string,
  token: string,
  type: 'login' | 'signup' = 'login'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_')) {
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured in environment variables.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    // Use RESEND_FROM_EMAIL or default to Resend onboarding verified sender
    const from = process.env.RESEND_FROM_EMAIL || 'ShopSphere <onboarding@resend.dev>';

    const subject =
      type === 'signup'
        ? 'Your ShopSphere Account Verification Code'
        : 'Your ShopSphere Login Verification Code';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">ShopSphere</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Customer Authentication Service</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 12px 0; font-weight: 700;">
        ${type === 'signup' ? 'Verify Your Customer Account' : 'Your Login Verification Code'}
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        ${
          type === 'signup'
            ? 'Thank you for registering with ShopSphere. Please use the following 6-digit verification code to activate your account:'
            : 'Please use the following 6-digit One-Time Password (OTP) to securely sign in to your ShopSphere account:'
        }
      </p>
      <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">Your verification code is:</span>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', Courier, monospace;">
          ${token}
        </div>
      </div>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
        <p style="color: #991b1b; font-size: 12px; line-height: 1.5; margin: 0; font-weight: 500;">
          ⚠️ <strong>This OTP is confidential. Do not share it with anyone.</strong> ShopSphere staff will never ask you for your verification code.
        </p>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        This code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.
      </p>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} ShopSphere E-Commerce. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Your ShopSphere Verification Code: ${token}\n\nYour verification code is: ${token}\n\nThis OTP is confidential. Do not share it with anyone.\n\nValid for 10 minutes.`;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[ShopSphere Email] Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[ShopSphere Email] Successfully sent OTP via Resend to ${to} (MessageId: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown Resend error';
    console.error('[ShopSphere Email] Resend exception:', msg);
    return { success: false, error: msg };
  }
}

