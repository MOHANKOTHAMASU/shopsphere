// -----------------------------------------------------------------------------
// src/lib/utils/video.ts
// Secure Product Demonstration Video URL Parser & Embed Helper
// Supports YouTube (watch, youtu.be, shorts), Vimeo, and direct MP4/WebM videos
// -----------------------------------------------------------------------------

export interface ParsedVideoInfo {
  isValid: boolean;
  type: 'youtube' | 'vimeo' | 'mp4' | 'unknown';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  originalUrl: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  // Handle YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = clean.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // Handle youtu.be/VIDEO_ID
  const youtuBeMatch = clean.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // Handle standard watch?v=VIDEO_ID or embed/VIDEO_ID
  const standardMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/i);
  if (standardMatch && standardMatch[1]) return standardMatch[1];

  return null;
}

/**
 * Extracts Vimeo video ID from Vimeo URL formats:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:vimeo\.com\/(?:video\/)?)([0-9]+)/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Parses any supported video URL into a secure embed specification
 */
export function parseVideoUrl(url?: string | null): ParsedVideoInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, type: 'unknown', originalUrl: '' };
  }

  const clean = url.trim();

  // 1. YouTube Detection
  const ytId = extractYouTubeId(clean);
  if (ytId) {
    return {
      isValid: true,
      type: 'youtube',
      videoId: ytId,
      // Use youtube-nocookie for privacy & rel=0 to prevent irrelevant recommendations
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      originalUrl: clean,
    };
  }

  // 2. Vimeo Detection
  const vimeoId = extractVimeoId(clean);
  if (vimeoId) {
    return {
      isValid: true,
      type: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?dnt=1`,
      thumbnailUrl: undefined,
      originalUrl: clean,
    };
  }

  // 3. Direct Video File (MP4, WebM, Supabase Storage)
  const isDirectVideo =
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.includes('/storage/v1/object/public/') ||
    clean.includes('.blob.core.windows.net');

  if (isDirectVideo) {
    return {
      isValid: true,
      type: 'mp4',
      embedUrl: clean,
      originalUrl: clean,
    };
  }

  return {
    isValid: false,
    type: 'unknown',
    originalUrl: clean,
  };
}

/**
 * Validates if the given URL is a valid demonstration video link
 */
export function isValidVideoUrl(url?: string | null): boolean {
  return parseVideoUrl(url).isValid;
}
