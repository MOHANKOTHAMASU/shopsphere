'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check, Truck, Minus, Plus } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { RatingStars } from '@/components/common/RatingStars';
import { formatCurrency } from '@/lib/utils';

export default function WishlistPage() {
  const { items, toggleWishlist, totalWishlistItems } = useWishlist();
  const { addToCart } = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Dynamic delivery date calculation
  const deliveryDateText = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return `${d.toLocaleDateString('en-IN', { weekday: 'short' })}, ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
  })();

  const getQuantity = (id: string) => quantities[id] || 1;

  const handleQuantityChange = (id: string, delta: number, maxStock: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = current + delta;
      if (next < 1) return prev;
      if (next > maxStock) return prev;
      return { ...prev, [id]: next };
    });
  };

  const handleMoveToCart = (product: (typeof items)[0]) => {
    if (product.stockQuantity <= 0) return;
    const qty = getQuantity(product.id);
    addToCart(product, qty);
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
        <Link
          href="/products"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => {
          const isAdded = !!addedMap[product.id];
          const isOutOfStock = product.stockQuantity <= 0;
          const qty = getQuantity(product.id);
          const savings = product.compareAtPrice && product.compareAtPrice > product.price
            ? product.compareAtPrice - product.price
            : 0;

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
                  {savings > 0 && !isOutOfStock && (
                    <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      Save {formatCurrency(savings)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {product.brand}
                  </span>
                  <span className="text-slate-400 truncate max-w-[110px]">{product.category}</span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 mt-1 mb-1.5 hover:text-indigo-600">
                  <Link href={`/products/${product.slug}`}>{product.title}</Link>
                </h3>
                <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
                
                <div className="mt-2 flex items-center justify-between">
                  <PriceDisplay
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    size="sm"
                  />
                  <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {isOutOfStock ? 'Sold Out' : 'In Stock'}
                  </span>
                </div>

                {/* Delivery Notice */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Free delivery by <strong className="font-bold text-slate-700">{deliveryDateText}</strong></span>
                </div>

                {/* Quantity selector before moving to Cart */}
                {!isOutOfStock && (
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">Qty to Cart:</span>
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1, product.stockQuantity)}
                        disabled={qty <= 1}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold font-mono text-slate-800 select-none">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1, product.stockQuantity)}
                        disabled={qty >= product.stockQuantity}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleMoveToCart(product)}
                disabled={isOutOfStock}
                className={`mt-4 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-indigo-600 text-white active:scale-98'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added {qty} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : `Move ${qty > 1 ? `(${qty}) ` : ''}to Cart`}</span>
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
