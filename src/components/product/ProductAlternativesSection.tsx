// -----------------------------------------------------------------------------
// src/components/product/ProductAlternativesSection.tsx
// ShopSphere Verified Indian Competitor Benchmarks & Affordable Alternatives
// -----------------------------------------------------------------------------

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductAlternativeComparison, CompetitorComparison } from '@/types/pricing';
import { ProductCompareModal } from './ProductCompareModal';
import { useCart } from '@/context/CartContext';
import {
  Scale,
  Sparkles,
  ShoppingBag,
  Check,
  ShieldCheck,
  ExternalLink,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Product } from '@/types/ecommerce';

interface ProductAlternativesSectionProps {
  comparison: ProductAlternativeComparison;
  competitors: CompetitorComparison[];
}

export function ProductAlternativesSection({
  comparison,
  competitors,
}: ProductAlternativesSectionProps) {
  const { addToCart } = useCart();
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const { currentProduct, alternatives } = comparison;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickAdd = (alt: (typeof alternatives)[0]) => {
    const prod: Product = {
      id: alt.id,
      title: alt.title,
      slug: alt.slug,
      brand: alt.brand || 'ShopSphere',
      description: alt.title,
      shortDescription: alt.title,
      price: alt.price,
      compareAtPrice: alt.price,
      discountPercent: 0,
      thumbnail: alt.thumbnail,
      images: [alt.thumbnail],
      stockQuantity: alt.stockQuantity,
      isAvailable: alt.stockQuantity > 0,
      category: 'General',
      categorySlug: 'general',
      sku: `ALT-${alt.id}`,
      rating: alt.rating,
      reviewCount: 15,
      tags: [],
      features: [],
      specifications: [],
    };
    addToCart(prod, 1);
    setAddedIds((prev) => ({ ...prev, [alt.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [alt.id]: false }));
    }, 1800);
  };

  // Find lowest competitor
  const inStockCompetitors = competitors.filter(
    (c) => c.inStock && c.verificationStatus !== 'unavailable' && c.sellingPrice > 0
  );
  const lowestCompetitor = inStockCompetitors.length > 0
    ? [...inStockCompetitors].sort((a, b) => a.sellingPrice - b.sellingPrice)[0]
    : undefined;

  const priceSavings = lowestCompetitor
    ? lowestCompetitor.sellingPrice - currentProduct.price
    : 0;

  return (
    <div className="space-y-8 my-10">
      {/* 1. Indian Competitor Price Benchmark Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Price Transparency Research
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Verified Benchmarks</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Indian Market Price Benchmark
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              We benchmark prices against authorized Indian retail channels for identical models.
            </p>
          </div>

          {priceSavings > 0 ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  ShopSphere Advantage
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-700">
                  Save ₹{priceSavings.toLocaleString('en-IN')} vs {lowestCompetitor?.competitorName}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Priced at verified official MRP with 100% manufacturer warranty</span>
            </div>
          )}
        </div>

        {/* Competitor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {competitors.map((comp) => {
            const isAvailable = comp.verificationStatus !== 'unavailable';

            return (
              <div
                key={comp.competitorName}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">
                      {comp.competitorName}
                    </span>
                    {comp.verificationStatus === 'verified' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Verified
                      </span>
                    ) : comp.verificationStatus === 'manual_benchmark' ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        Catalog Match
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                        Feed Pending
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-mono mb-3">
                    {comp.modelOrSkuMatch}
                  </div>

                  {isAvailable ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-slate-900">
                        ₹{comp.sellingPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Delivery: {comp.deliveryCharges === 0 ? 'Free' : `+₹${comp.deliveryCharges}`}</span>
                        <span>•</span>
                        <span>{comp.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-slate-400 italic">
                      Feed awaiting authorized API credentials
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Checked: {comp.lastChecked}</span>
                  {comp.productUrl && isAvailable && (
                    <a
                      href={comp.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Similar Products & Compare Alternatives Section */}
      {alternatives.length > 0 && (
        <div className="bg-slate-50/70 rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Smart Recommendations
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Compare Alternatives & Similar Products
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore affordable options and side-by-side spec differences in this category.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Side-by-Side {selectedIds.length > 0 && `(${selectedIds.length + 1})`}</span>
            </button>
          </div>

          {/* Alternatives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                  alt.isBestBudgetOption
                    ? 'border-amber-400 ring-2 ring-amber-200/60 shadow-md'
                    : 'border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Badge & Checkbox Header */}
                  <div className="flex items-center justify-between mb-3">
                    {alt.isBestBudgetOption ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Best Budget Option</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md capitalize">
                        {alt.priceTier} Tier
                      </span>
                    )}

                    <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(alt.id)}
                        onChange={() => handleToggleSelect(alt.id)}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span>Compare</span>
                    </label>
                  </div>

                  {/* Image & Title */}
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-4 border border-slate-100">
                    <Link href={`/products/${alt.slug}`}>
                      <img
                        src={alt.thumbnail}
                        alt={alt.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>

                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    {alt.brand}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 hover:text-indigo-600">
                    <Link href={`/products/${alt.slug}`}>{alt.title}</Link>
                  </h3>

                  {/* Recommendation Rationale */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-3">
                    <p className="leading-snug">{alt.recommendationReason}</p>
                  </div>

                  {/* Price & Delta */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mb-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        ₹{alt.price.toLocaleString('en-IN')}
                      </div>
                      {alt.priceDifference > 0 && (
                        <div className="text-[11px] font-bold text-emerald-600">
                          Save ₹{alt.priceDifference.toLocaleString('en-IN')} ({alt.priceDifferencePercent}% less)
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">
                      {alt.rating}★ ({alt.stockQuantity} in stock)
                    </div>
                  </div>

                  {/* Key Specs Pills */}
                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{alt.warranty}</span>
                    </div>
                    {alt.competitorBenchmark && (
                      <div className="text-[11px] text-slate-500">
                        Market: {alt.competitorBenchmark.competitor} ₹{alt.competitorBenchmark.price.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(alt)}
                    disabled={alt.stockQuantity <= 0}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      addedIds[alt.id]
                        ? 'bg-emerald-600 text-white'
                        : alt.stockQuantity <= 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : alt.isBestBudgetOption
                        ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {addedIds[alt.id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/products/${alt.slug}`}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <span>View Product Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <ProductCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparison={comparison}
        selectedAlternativeIds={selectedIds}
      />
    </div>
  );
}
