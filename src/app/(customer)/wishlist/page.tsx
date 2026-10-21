'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { RatingStars } from '@/components/common/RatingStars';

export default function WishlistPage() {
  const { items, toggleWishlist, totalWishlistItems } = useWishlist();
  const { addToCart } = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const handleMoveToCart = (product: (typeof items)[0]) => {
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-5">
        <div className="w-24 h-24 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
          <Heart className="w-12 h-12 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Save your favourite items here by clicking the heart icon on any product card or details
            page so you can easily find them later.
          </p>
        </div>
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            <strong className="font-bold text-slate-800">{totalWishlistItems}</strong> saved item
            {totalWishlistItems > 1 ? 's' : ''} in your wishlist
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => {
          const isAdded = !!addedMap[product.id];
          const isOutOfStock = product.stockQuantity <= 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-100">
                  <Link href={`/products/${product.slug}`}>
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </Link>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/90 text-rose-500 hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="px-3 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg shadow-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {product.brand}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 mt-1 mb-1.5 hover:text-indigo-600">
                  <Link href={`/products/${product.slug}`}>{product.title}</Link>
                </h3>
                <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
                <div className="mt-2">
                  <PriceDisplay
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    size="sm"
                  />
                </div>
              </div>

              <button
                onClick={() => handleMoveToCart(product)}
                disabled={isOutOfStock}
                className={`mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-indigo-600 text-white active:scale-98'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Moved to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : 'Move to Cart'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
