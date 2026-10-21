export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SignupValidationInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  agreedToTerms?: boolean;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format (with country code or standard 10-15 digits)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
}

/**
 * Validate postal / PIN code format
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  const cleaned = postalCode.trim();
  return /^[a-zA-Z0-9\s-]{4,10}$/.test(cleaned);
}

/**
 * Validate password requirements:
 * - At least 8 characters
 * - Contains at least one letter
 * - Contains at least one digit
 */
export function isValidPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }
  return { valid: true };
}

/**
 * Validate Signup Input (with address, phone, and terms consent)
 */
export function validateSignupData(data: SignupValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (data.phone !== undefined && data.phone !== '') {
    if (!isValidPhone(data.phone)) {
      errors.phone = 'Please provide a valid phone number (10-15 digits with country code, e.g. +91 98765 43210).';
    }
  }

  const passCheck = isValidPassword(data.password);
  if (!passCheck.valid) {
    errors.password = passCheck.message || 'Invalid password.';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  // Address validation (if address fields are supplied in form)
  if (data.street !== undefined && data.street.trim() === '') {
    errors.street = 'Delivery address street line is required.';
  }

  if (data.city !== undefined && data.city.trim() === '') {
    errors.city = 'City is required.';
  }

  if (data.state !== undefined && data.state.trim() === '') {
    errors.state = 'State / Province is required.';
  }

  if (data.postalCode !== undefined && data.postalCode !== '') {
    if (!isValidPostalCode(data.postalCode)) {
      errors.postalCode = 'Please enter a valid postal / PIN code.';
    }
  } else if (data.postalCode !== undefined && data.postalCode.trim() === '') {
    errors.postalCode = 'Postal / PIN code is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Login Input
 */
export function validateLoginData(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Please enter your password.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
