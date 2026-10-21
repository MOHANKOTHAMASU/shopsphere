// -----------------------------------------------------------------------------
// src/lib/security/rate-limit.ts
// In-Memory Sliding Window Rate Limiter for Sensitive Endpoints
// -----------------------------------------------------------------------------

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    // Keep timestamps from the last 15 minutes
    const valid = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks whether an action identified by key exceeds the rate limit.
 *
 * @param key Unique identifier (e.g. `login:${ipOrEmail}`)
 * @param limit Maximum allowed requests within the window
 * @param windowSeconds Time window duration in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  purgeExpiredRecords(now);

  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };
  // Retain only requests within current window
  const activeTimestamps = record.timestamps.filter((t) => t > cutoff);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      current: activeTimestamps.length,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Register this attempt
  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  const remaining = limit - activeTimestamps.length;
  const oldest = activeTimestamps[0];
  const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

  return {
    allowed: true,
    current: activeTimestamps.length,
    limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * Reset rate limit for a specific key (useful after successful login or for unit testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (for test suites)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
