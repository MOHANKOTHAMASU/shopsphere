'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  title: string;
  videoUrl?: string;
}

export function ProductGallery({ images, title, videoUrl }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '');

  const handleScrollToVideo = () => {
    const el = document.getElementById('product-demo-video');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnail Bar */}
        {(images.length > 1 || videoUrl) && (
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[460px] no-scrollbar shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  selectedImage === img
                    ? 'border-indigo-600 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('photo-1523275335684')) {
                      target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                    }
                  }}
                />
              </button>
            ))}

            {/* Video Thumbnail Button if available */}
            {videoUrl && (
              <button
                type="button"
                onClick={handleScrollToVideo}
                aria-label="Scroll to product demonstration video"
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-900 text-white flex flex-col items-center justify-center gap-1 shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm group-hover:bg-amber-300">
                  <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-amber-300">
                  Video
                </span>
              </button>
            )}
          </div>
        )}

        {/* Main Image View */}
        <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center group">
          <img
            src={selectedImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
            alt={title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('photo-1523275335684')) {
                target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
              }
            }}
          />

          {/* Quick Floating "Watch How It Works" Pill on Main Photo */}
          {videoUrl && (
            <button
              type="button"
              onClick={handleScrollToVideo}
              className="absolute bottom-3 left-3 bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-xs text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-700 shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-current translate-x-0.5" />
              </div>
              <span className="text-amber-300">Watch How It Works</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
