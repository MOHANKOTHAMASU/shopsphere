'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    tag: 'THE GREAT TECH SALE • UP TO 45% OFF',
    title: 'Precision Audio & Flagship Silicon',
    description:
      'Immerse in pure acoustic fidelity with Sony WH-1000XM5 and Apple S9 intelligence. Engineered for professionals.',
    ctaText: 'Shop Electronics',
    ctaLink: '/products?cat=electronics',
    badge: 'Limited Stock Deal',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    theme: 'from-slate-950 via-indigo-950 to-slate-900',
    accentColor: 'text-amber-400',
    highlightBadge: 'Extra 10% instant off on UPI checkout',
  },
  {
    id: 2,
    tag: 'NEW SEASON DROP • PERFORMANCE ATHLETICS',
    title: 'Break Speed Records with Zoom Air',
    description:
      'Nike Pegasus 40 engineered for explosive energy return and featherlight comfort over long marathon distances.',
    ctaText: 'Explore Footwear',
    ctaLink: '/products?cat=footwear',
    badge: 'Trending Worldwide',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    theme: 'from-zinc-950 via-slate-900 to-rose-950',
    accentColor: 'text-rose-400',
    highlightBadge: 'Fast 2-Day Air Shipping across India',
  },
  {
    id: 3,
    tag: 'MINIMALIST LIVING & WARM AMBIANCE',
    title: 'Artisan Decor Crafted for Modern Spaces',
    description:
      'Scandinavian handcrafted ceramics, warm organic linen lighting, and cashmere luxury essentials.',
    ctaText: 'Discover Home & Living',
    ctaLink: '/products?cat=home-living',
    badge: 'Artisan Collection',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
    theme: 'from-stone-950 via-slate-900 to-amber-950',
    accentColor: 'text-amber-300',
    highlightBadge: 'Eco-conscious sustainable packaging',
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden rounded-3xl my-4 sm:my-6 border border-slate-800 shadow-2xl">
      {/* Background with Dark Gradient and Imagery */}
      <div className={`relative min-h-[460px] sm:min-h-[500px] lg:min-h-[520px] bg-gradient-to-r ${slide.theme} flex items-center transition-all duration-700`}>
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Hero Background Image with Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 overflow-hidden">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center opacity-40 lg:opacity-75 mix-blend-luminosity lg:mix-blend-normal transition-all duration-700 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 lg:via-transparent to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 z-10 w-full">
          <div className="max-w-xl space-y-4 sm:space-y-5">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{slide.tag}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              {slide.description}
            </p>

            {/* Trust highlight */}
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{slide.highlightBadge}</span>
            </div>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-sm shadow-xl shadow-black/30 transition-transform active:scale-95"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?deals=true"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-colors"
              >
                <span>View Today&apos;s Deals</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="absolute bottom-4 right-6 sm:bottom-6 sm:right-10 flex items-center space-x-2 z-20">
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-1.5 px-2">
            {SLIDES.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
