// -----------------------------------------------------------------------------
// src/lib/auth/phone-utils.ts
// ShopSphere Phone Number & OTP Utilities (Shared between Client & Server)
// -----------------------------------------------------------------------------


/**
 * Clean & normalize phone number to standard E.164-like format (e.g. "+919876543210")
 */
export function normalizePhoneNumber(countryCode: string, phone: string): string {
  const code = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  const digits = phone.replace(/\D/g, '');
  return `${code}${digits}`;
}

/**
 * Mask phone number for display (e.g. "+91 98*** **210")
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 8) return phone;
  const prefix = cleaned.slice(0, 5); // e.g. "+9198"
  const suffix = cleaned.slice(-3);   // e.g. "210"
  return `${prefix}*** **${suffix}`;
}

/**
 * Validate phone number format for India (+91) or international
 */
export function validatePhoneNumber(countryCode: string, phone: string): { isValid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');
  const code = countryCode.trim();

  if (!digits) {
    return { isValid: false, error: 'Mobile number is required' };
  }

  // India: 10 digits starting with 6, 7, 8, or 9
  if (code === '+91' || code === '91') {
    if (digits.length !== 10) {
      return { isValid: false, error: 'Indian mobile number must be exactly 10 digits' };
    }
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, error: 'Indian mobile number must begin with 6, 7, 8, or 9' };
    }
  } else {
    // International standard: 7 to 15 digits
    if (digits.length < 7 || digits.length > 15) {
      return { isValid: false, error: 'Please enter a valid phone number (7 to 15 digits)' };
    }
  }

  return { isValid: true };
}
