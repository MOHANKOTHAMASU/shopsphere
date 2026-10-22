'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Check, Zap, Truck, Eye } from 'lucide-react';
import { Product } from '@/types/ecommerce';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { RatingStars } from '@/components/common/RatingStars';
import { Badge } from '@/components/common/Badge';
import { getPriceTier } from '@/data/category-thresholds';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isAdded, setIsAdded] = useState(false);
  const favorited = isInWishlist(product.id);
  const priceTier = getPriceTier(product.price, product.categorySlug);

  // Dynamic delivery date calculation (2-3 days from now)
  const deliveryDateText = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const date = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    return `${day}, ${date}`;
  })();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1);
    router.push('/cart');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading={priority ? 'eager' : 'lazy'}
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isDealOfTheDay && (
            <Badge variant="warning" size="sm" className="shadow-xs font-bold bg-amber-400 text-slate-950 border-none">
              🔥 Deal of the Day
            </Badge>
          )}
          {product.isBestSeller && !product.isDealOfTheDay && (
            <Badge variant="info" size="sm" className="shadow-xs font-bold bg-blue-600 text-white border-none">
              ★ Best Seller
            </Badge>
          )}
          {priceTier === 'budget' && !product.isDealOfTheDay && !product.isBestSeller && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
              Affordable
            </span>
          )}
          {priceTier === 'premium' && !product.isDealOfTheDay && !product.isBestSeller && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 border border-amber-400/40 shadow-xs">
              ★ Premium
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          aria-label={favorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-sm transition-transform active:scale-90 z-10 hover:bg-white cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Stock Overlay Indicator */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-sm">
              Out of Stock
            </span>
          </div>
        ) : product.stockQuantity <= 5 ? (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
            Only {product.stockQuantity} left!
          </div>
        ) : null}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[11px]">
              {product.brand}
            </span>
            <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
              {product.category}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-1.5">
            <Link href={`/products/${product.slug}`} title={product.title}>
              {product.title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-1 mb-2">
            {product.shortDescription || product.description}
          </p>

          {/* Rating */}
          <div className="mb-2">
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="sm"
            />
          </div>

          {/* Estimated Delivery Notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2">
            <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              Free delivery by <strong className="font-bold text-slate-800">{deliveryDateText}</strong>
            </span>
          </div>
        </div>

        <div>
          {/* Pricing */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <PriceDisplay
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="sm"
            />
            <span
              className={`text-[10px] font-bold ${
                isOutOfStock ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {isOutOfStock ? 'Sold Out' : 'In Stock'}
            </span>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-indigo-600 text-white active:scale-[0.98]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="py-2 px-3 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                title="Buy Now (Instant Checkout)"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Buy Now</span>
              </button>
            )}

            <Link
              href={`/products/${product.slug}`}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              title="View Product Details"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
