// -----------------------------------------------------------------------------
// src/components/product/ProductCompareModal.tsx
// ShopSphere Side-by-Side Product Comparison Modal
// -----------------------------------------------------------------------------

'use client';

import React from 'react';
import Link from 'next/link';
import { ProductAlternativeComparison } from '@/types/pricing';
import { useCart } from '@/context/CartContext';
import { X, Check, ShoppingBag, ShieldCheck, Star, Scale, ExternalLink } from 'lucide-react';
import { Product } from '@/types/ecommerce';

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: ProductAlternativeComparison;
  selectedAlternativeIds?: string[];
}

export function ProductCompareModal({
  isOpen,
  onClose,
  comparison,
  selectedAlternativeIds,
}: ProductCompareModalProps) {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = React.useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const current = comparison.currentProduct;
  // If specific alternatives selected, filter; otherwise compare up to 2 alternatives
  const comparedAlternatives = selectedAlternativeIds && selectedAlternativeIds.length > 0
    ? comparison.alternatives.filter((alt) => selectedAlternativeIds.includes(alt.id))
    : comparison.alternatives.slice(0, 2);

  // Union of all spec keys across all compared items
  const allSpecKeys = Array.from(
    new Set([
      ...Object.keys(current.keySpecs || {}),
      ...comparedAlternatives.flatMap((alt) => Object.keys(alt.keySpecs || {})),
    ])
  );

  const handleAddToCart = (item: {
    id: string;
    title: string;
    price: number;
    thumbnail: string;
  }) => {
    // Construct minimal product for cart
    const prod: Product = {
      id: item.id,
      title: item.title,
      slug: item.id,
      brand: 'ShopSphere',
      description: item.title,
      shortDescription: item.title,
      price: item.price,
      compareAtPrice: item.price,
      discountPercent: 0,
      thumbnail: item.thumbnail,
      images: [item.thumbnail],
      stockQuantity: 10,
      isAvailable: true,
      category: 'General',
      categorySlug: 'general',
      sku: `COMP-${item.id}`,
      rating: 4.5,
      reviewCount: 10,
      tags: [],
      features: [],
      specifications: [],
    };
    addToCart(prod, 1);
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Side-by-Side Product Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Transparent specifications, Indian competitor pricing, and verified warranties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close comparison modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Table Body */}
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 w-1/4 text-slate-400 font-semibold uppercase text-[11px] tracking-wider align-bottom">
                  Product Details
                </th>
                {/* Current Product Header */}
                <th className="p-3 w-1/4 bg-indigo-50/50 rounded-t-2xl border-x border-t border-indigo-100">
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                      Current Viewing
                    </span>
                    <div className="aspect-square w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 mx-auto">
                      <img
                        src={current.thumbnail}
                        alt={current.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2">
                      {current.title}
                    </div>
                    <div className="text-base font-extrabold text-indigo-700">
                      ₹{current.price.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(current)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {addedIds[current.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </th>

                {/* Alternative Columns */}
                {comparedAlternatives.map((alt) => (
                  <th key={alt.id} className="p-3 w-1/4 border-b border-slate-200 align-top">
                    <div className="space-y-2">
                      {alt.isBestBudgetOption ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                          ★ Best Budget Option
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Alternative
                        </span>
                      )}
                      <div className="aspect-square w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 mx-auto">
                        <img
                          src={alt.thumbnail}
                          alt={alt.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-2">
                        {alt.title}
                      </div>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{alt.price.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600">
                        {alt.priceDifference > 0
                          ? `Save ₹${alt.priceDifference.toLocaleString('en-IN')} (${alt.priceDifferencePercent}%)`
                          : alt.priceDifference < 0
                          ? `+₹${Math.abs(alt.priceDifference).toLocaleString('en-IN')} higher`
                          : 'Same price'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(alt)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {addedIds[alt.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* Brand Row */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Brand</td>
                <td className="p-3 font-semibold text-slate-800 bg-indigo-50/20 border-x border-indigo-100/40">
                  {current.brand}
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3 font-semibold text-slate-800">
                    {alt.brand}
                  </td>
                ))}
              </tr>

              {/* Price Tier */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Price Tier</td>
                <td className="p-3 font-semibold text-slate-800 bg-indigo-50/20 border-x border-indigo-100/40 capitalize">
                  {current.priceTier}
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3 font-semibold text-slate-800 capitalize">
                    {alt.priceTier}
                  </td>
                ))}
              </tr>

              {/* Customer Rating */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Rating</td>
                <td className="p-3 bg-indigo-50/20 border-x border-indigo-100/40">
                  <div className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{current.rating} / 5.0</span>
                  </div>
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{alt.rating} / 5.0</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* In-Stock Status */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Stock Status</td>
                <td className="p-3 bg-indigo-50/20 border-x border-indigo-100/40">
                  <span className="font-semibold text-emerald-600">
                    In Stock ({current.stockQuantity} units)
                  </span>
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3">
                    <span className="font-semibold text-emerald-600">
                      In Stock ({alt.stockQuantity} units)
                    </span>
                  </td>
                ))}
              </tr>

              {/* Verified Warranty */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Verified Warranty</td>
                <td className="p-3 bg-indigo-50/20 border-x border-indigo-100/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>1 Year Official Warranty</span>
                  </div>
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{alt.warranty}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Competitor Benchmark Benchmark */}
              <tr>
                <td className="p-3 text-slate-500 font-medium">Market Benchmark</td>
                <td className="p-3 bg-indigo-50/20 border-x border-indigo-100/40 text-xs text-slate-600">
                  Verified Retail Price
                </td>
                {comparedAlternatives.map((alt) => (
                  <td key={alt.id} className="p-3 text-xs text-slate-600">
                    {alt.competitorBenchmark ? (
                      <span className="font-medium">
                        {alt.competitorBenchmark.competitor}: ₹{alt.competitorBenchmark.price.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No external feed</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Dynamic Specifications */}
              {allSpecKeys.map((key) => (
                <tr key={key}>
                  <td className="p-3 text-slate-500 font-medium">{key}</td>
                  <td className="p-3 bg-indigo-50/20 border-x border-indigo-100/40 font-semibold text-slate-800">
                    {current.keySpecs[key] || '—'}
                  </td>
                  {comparedAlternatives.map((alt) => (
                    <td key={alt.id} className="p-3 font-semibold text-slate-800">
                      {alt.keySpecs[key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            All prices in Indian Rupees (₹) inclusive of GST. No hidden handling charges.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
