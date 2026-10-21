// -----------------------------------------------------------------------------
// src/lib/security/redirects.ts
// Security Utility: Open Redirect Prevention and Path Sanitization
// -----------------------------------------------------------------------------

/**
 * Validates and sanitizes internal redirection paths to prevent Open Redirect attacks.
 * Rejects protocol-relative URLs (e.g. "//attacker.com"), backslashes, absolute schemes (e.g. "https://", "javascript:"),
 * and non-relative inputs.
 */
export function sanitizeRedirectPath(path?: string | null, fallback: string = '/account'): string {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  const trimmed = path.trim();

  // Must begin with a single slash '/'
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject protocol-relative URLs that start with '//' (browsers treat this as http(s)://)
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject backslashes (some browsers normalize '\' to '/' which could bypass checks)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject if it contains URI scheme specifications like "http:", "javascript:", "data:"
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/i.test(trimmed.slice(1))) {
    return fallback;
  }

  // Reject control characters or newlines (CRLF header injection)
  if (/[\r\n\0]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
