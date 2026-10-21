'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/ecommerce';
import { getFeaturedSeedProducts, getBestSellerSeedProducts } from '@/data/seed-products';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

interface FeaturedSectionProps {
  featured?: Product[];
  bestsellers?: Product[];
}

export function FeaturedSection({
  featured: propFeatured,
  bestsellers: propBestsellers,
}: FeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'bestsellers'>('featured');

  const featured = propFeatured && propFeatured.length > 0 ? propFeatured : getFeaturedSeedProducts();
  const bestsellers = propBestsellers && propBestsellers.length > 0 ? propBestsellers : getBestSellerSeedProducts();

  const currentProducts = activeTab === 'featured' ? featured : bestsellers;

  return (
    <section className="my-8 sm:my-14">
      {/* Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Handpicked For You
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Trending & Top Rated
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'featured'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Featured Picks</span>
          </button>

          <button
            onClick={() => setActiveTab('bestsellers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bestsellers'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Best Sellers</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <ProductGrid products={currentProducts} />

      {/* View All Button */}
      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-slate-900/10"
        >
          <span>View All Products in Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
