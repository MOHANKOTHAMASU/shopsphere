import React from 'react';
import Link from 'next/link';
import { Flame, TrendingUp, ShieldCheck, Grid, Award, Tag } from 'lucide-react';

export function NavigationRibbon() {
  return (
    <div className="bg-slate-900 text-white text-xs font-medium border-b border-slate-800 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">

          {/* All Products */}
          <Link
            href="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition-colors font-semibold whitespace-nowrap"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>All Products</span>
          </Link>

          {/* Mega Deals */}
          <Link
            href="/products?deals=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold transition-colors border border-amber-500/20 whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Mega Deals</span>
          </Link>

          {/* Best Sellers */}
          <Link
            href="/products?sort=bestseller"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition-colors whitespace-nowrap"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Best Sellers</span>
          </Link>

          {/* Offers HOT */}
          <Link
            href="/offers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold transition-colors border border-purple-500/20 whitespace-nowrap"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Offers</span>
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Hot
            </span>
          </Link>

          {/* Rewards */}
          <Link
            href="/rewards"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-amber-300 hover:text-amber-200 transition-colors font-semibold whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Rewards</span>
          </Link>

        </div>

        {/* Right: Verified Seller Badge */}
        <div className="flex items-center shrink-0 pl-4">
          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Seller Network</span>
          </span>
        </div>
      </div>
    </div>
  );
}
