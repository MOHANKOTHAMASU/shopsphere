'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight } from 'lucide-react';
import { Product } from '@/types/ecommerce';
import { getDealSeedProducts } from '@/data/seed-products';
import { ProductCard } from '@/components/product/ProductCard';

interface DealsSectionProps {
  products?: Product[];
}

export function DealsSection({ products }: DealsSectionProps) {
  const deals = products && products.length > 0 ? products : getDealSeedProducts();

  // Simple countdown timer for deal of the day
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="my-8 sm:my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-200/80">
      {/* Deals Header with Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
              Mega Flash Deals
            </span>
            <span className="text-xs text-rose-600 font-bold hidden sm:inline">
              Up to 45% OFF
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Deals of the Day
          </h2>
        </div>

        {/* Countdown Box */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>Ends in:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm font-black">
            <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-slate-900 font-bold">:</span>
            <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-slate-900 font-bold">:</span>
            <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Deals Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {deals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-6 text-center">
        <Link
          href="/products?deals=true"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <span>Explore All 24+ Flash Offers</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
