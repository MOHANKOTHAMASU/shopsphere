import React from 'react';
import Link from 'next/link';
import { Flame, TrendingUp, ShieldCheck, Grid } from 'lucide-react';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';

export function NavigationRibbon() {
  return (
    <div className="bg-slate-900 text-white text-xs font-medium border-b border-slate-800 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-1">
          {/* All Categories shortcut */}
          <Link
            href="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition-colors font-semibold"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>All Products</span>
          </Link>

          {/* Flash Deals Tab */}
          <Link
            href="/products?deals=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold transition-colors border border-amber-500/20"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Mega Deals</span>
          </Link>

          {/* Bestsellers Tab */}
          <Link
            href="/products?sort=bestseller"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Best Sellers</span>
          </Link>

          {/* Category Links */}
          {DEVELOPMENT_SEED_CATEGORIES.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/products?cat=${category.slug}`}
              className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Seller Network</span>
          </span>
        </div>
      </div>
    </div>
  );
}
