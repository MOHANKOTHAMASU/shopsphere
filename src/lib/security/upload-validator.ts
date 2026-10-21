// -----------------------------------------------------------------------------
// src/lib/security/upload-validator.ts
// Security Utility: File Upload Restrictions and Image Validation
// -----------------------------------------------------------------------------

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Validates an image file's size, MIME type, and extension
 */
export function validateImageFile(file: {
  name: string;
  size: number;
  type: string;
  buffer?: Buffer;
}): ImageValidationResult {
  // 1. File size check
  if (!file.size || file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum permitted limit of 5 MB.`,
    };
  }

  // 2. MIME type check
  const cleanMime = file.type.toLowerCase().trim();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(cleanMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Unsupported image format (${cleanMime}). Permitted formats: JPEG, PNG, WebP, AVIF. (SVG and executables are blocked for security).`,
    };
  }

  // 3. File extension check
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'File extension does not match permitted image formats (.jpg, .jpeg, .png, .webp, .avif).',
    };
  }

  // 4. Magic bytes inspection if buffer is provided
  if (file.buffer && file.buffer.length >= 8) {
    const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    const isPng =
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47;
    const isRiffWebp =
      file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      file.buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const isAvif = file.buffer.subarray(4, 12).toString('ascii') === 'ftypavif';

    if (!isJpeg && !isPng && !isRiffWebp && !isAvif) {
      return {
        valid: false,
        error: 'Image file signature (magic bytes) does not match declared image format.',
      };
    }
  }

  // 5. Generate secure, non-guessable sanitized filename
  const ext = lowerName.slice(lowerName.lastIndexOf('.'));
  const randomId = Math.random().toString(36).substring(2, 10);
  const sanitizedFilename = `prod-${Date.now()}-${randomId}${ext}`;

  return { valid: true, sanitizedFilename };
}

/**
 * Validates an image URL for safe protocol, preventing SSRF and XSS
 */
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = url.trim();

  // Reject dangerous schemes
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return { valid: false, error: 'Unsafe URL scheme detected. Only HTTP/HTTPS URLs are allowed.' };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Image URL must use http or https protocol.' };
    }

    // SSRF protection: reject local / loopback / metadata addresses
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '::1', '169.254.169.254', '0.0.0.0'];
    if (blockedHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { valid: false, error: 'Internal or loopback addresses are prohibited for security.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}
