'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Heart, Check, Minus, Plus, Layers } from 'lucide-react';
import { Product, ProductVariant } from '@/types/ecommerce';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductDetailsActionsProps {
  product: Product;
}

export function ProductDetailsActions({ product }: ProductDetailsActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const favorited = isInWishlist(product.id);

  // Active pricing and stock (derived from selected variant or main product)
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const isOutOfStock = currentStock <= 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStock) return currentStock;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(
      product,
      quantity,
      selectedVariant?.id,
      selectedVariant?.title,
      selectedVariant?.attributes
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(
      product,
      quantity,
      selectedVariant?.id,
      selectedVariant?.title,
      selectedVariant?.attributes
    );
    router.push('/cart');
  };

  return (
    <div className="space-y-5 pt-2">
      {/* Product Variants Selector if available */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Available Options & Editions:</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">SKU: {currentSku}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const hasStock = v.stockQuantity > 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    if (quantity > v.stockQuantity) {
                      setQuantity(Math.max(1, v.stockQuantity));
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{v.title}</span>
                  <span
                    className={`text-[11px] font-mono ${
                      isSelected ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    ₹{v.price.toLocaleString('en-IN')}
                  </span>
                  {!hasStock && (
                    <span className="text-[10px] text-rose-300 font-normal">(Out of stock)</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedVariant && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-600">
                Selected:{' '}
                <strong className="text-slate-900 font-bold">{selectedVariant.title}</strong>{' '}
                <span className="text-indigo-600 font-mono font-bold">(₹{currentPrice.toLocaleString('en-IN')})</span>
              </span>
              <span
                className={`font-semibold ${
                  currentStock > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {currentStock > 0 ? `${currentStock} units available` : 'Sold out in this variant'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Quantity:
        </span>
        <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-bold text-sm text-slate-900 select-none">
            {isOutOfStock ? 0 : quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= currentStock || isOutOfStock}
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {currentStock > 0 && currentStock <= 5 && (
          <span className="text-xs font-bold text-amber-600">
            Only {currentStock} left! Order soon.
          </span>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-indigo-600 text-white active:scale-[0.98]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        {/* Buy Now (Amber accent) */}
        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1 w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
          <span>Buy Now</span>
        </button>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(product)}
          className={`p-3.5 rounded-xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
            favorited
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-rose-500'
          }`}
          aria-label={favorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-5 h-5 ${favorited ? 'fill-rose-500' : ''}`} />
        </button>
      </div>
    </div>
  );
}
