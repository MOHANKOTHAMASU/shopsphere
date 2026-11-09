'use client';

// -----------------------------------------------------------------------------
// src/components/product/ProductVideoSection.tsx
// Interactive Product Demonstration, Installation & Usage Video Player
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, ShieldCheck, Film, ExternalLink, RefreshCw } from 'lucide-react';
import { parseVideoUrl } from '@/lib/utils/video';

interface ProductVideoSectionProps {
  videoUrl?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  productTitle: string;
  category?: string;
  features?: string[];
}

export function ProductVideoSection({
  videoUrl,
  videoTitle,
  videoThumbnail,
  productTitle,
  category,
  features = [],
}: ProductVideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!videoUrl) return null;

  const parsed = parseVideoUrl(videoUrl);
  if (!parsed.isValid) return null;

  const title = videoTitle || `Demonstration & How to Use ${productTitle}`;
  const posterImage =
    videoThumbnail ||
    parsed.thumbnailUrl ||
    'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80';

  return (
    <section
      id="product-demo-video"
      aria-label="Product Demonstration Video"
      className="my-10 bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge & Title */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/70 border border-amber-500/30 px-3 py-1 rounded-full">
              <Film className="w-3.5 h-3.5" />
              <span>Watch How It Works</span>
            </span>
            {category && (
              <span className="text-xs text-slate-400 font-medium">
                • {category} Guide
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Authentic Demonstration</span>
        </div>
      </div>

      {/* Video Player Card */}
      <div className="relative z-10 bg-black rounded-2xl overflow-hidden border border-slate-800 aspect-video w-full shadow-inner flex items-center justify-center">
        {!isPlaying ? (
          /* Click-to-Play Thumbnail (Zero Initial Payload, No Slowing Down Page) */
          <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
            <img
              src={posterImage}
              alt={title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-90"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('photo-1508974239320')) {
                  target.src = 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80';
                }
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Big Centered Play Button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                aria-label={`Play demonstration video for ${productTitle}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 group-hover:scale-110 active:scale-95 transition-all cursor-pointer ring-4 ring-white/20"
              >
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
              </button>
              <div className="text-center px-4">
                <span className="text-xs sm:text-sm font-bold text-white bg-slate-900/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-700">
                  Click to Watch Video Demonstration
                </span>
                <p className="text-[11px] text-slate-300 mt-1.5 font-medium">
                  Learn setup, usage, and key features in under 3 minutes
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Embed Player */
          <div className="w-full h-full relative">
            {parsed.type === 'youtube' && parsed.embedUrl && (
              <iframe
                src={`${parsed.embedUrl}&autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
                onError={() => setHasError(true)}
              />
            )}

            {parsed.type === 'vimeo' && parsed.embedUrl && (
              <iframe
                src={`${parsed.embedUrl}&autoplay=1`}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                onError={() => setHasError(true)}
              />
            )}

            {parsed.type === 'mp4' && (
              <video
                src={parsed.embedUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full"
                onError={() => setHasError(true)}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            )}

            {hasError && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  The embedded demonstration stream could not be loaded.
                </p>
                <a
                  href={parsed.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                >
                  <span>Watch directly on official host</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Description & Usage Steps */}
      <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
        <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-indigo-900/80 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-200">
              1
            </span>
            <span>Step 1: Unboxing</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inspect item seal, accessories, warranty card, and user manual before operation.
          </p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-amber-900/80 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-200">
              2
            </span>
            <span>Step 2: Installation</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Follow genuine manufacturer instructions for secure mounting and power connection.
          </p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-200">
              3
            </span>
            <span>Step 3: Best Practice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Keep surface clean and dry. Washable parts can be cleaned with water to restore grip.
          </p>
        </div>
      </div>
    </section>
  );
}

