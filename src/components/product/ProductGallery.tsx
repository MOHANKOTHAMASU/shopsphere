'use client';

import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '');

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      {/* Thumbnail Bar */}
      {images.length > 1 && (
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
      </div>
    </div>
  );
}
