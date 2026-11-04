import crypto from 'crypto';
import { DemoUserSession } from './demo-users';

// Server-only signing secret (NEVER exposed to client bundles)
const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'shopsphere-hmac-session-signing-secret-key-32bytes-min';

interface SignedSessionPayload {
  user: DemoUserSession;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a cryptographically signed session cookie value
 * Format: base64(payload).hmac_signature
 */
export function createSignedSessionToken(
  user: DemoUserSession,
  maxAgeSeconds: number = 60 * 60 * 24 * 30
): string {
  const payload: SignedSessionPayload = {
    user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };

  const payloadString = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadString, 'utf8').toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the cryptographic signature of a session token
 * Returns the decoded user if valid and unexpired; null if tampered or expired
 */
export function verifySignedSessionToken(token: string): DemoUserSession | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      console.warn('[ShopSphere Security] Session signature mismatch: Tampering attempt detected.');
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SignedSessionPayload = JSON.parse(payloadJson);

    // Verify expiration timestamp
    if (Date.now() > payload.expiresAt) {
      console.warn('[ShopSphere Security] Session expired.');
      return null;
    }

    return payload.user;
  } catch (err) {
    console.warn('[ShopSphere Security] Failed to decode session payload:', err);
    return null;
  }
}

