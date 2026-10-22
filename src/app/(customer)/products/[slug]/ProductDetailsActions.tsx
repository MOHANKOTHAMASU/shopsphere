'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Zap,
  Heart,
  Check,
  Minus,
  Plus,
  Layers,
  AlertCircle,
  Truck,
  MapPin,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { Product, ProductVariant } from '@/types/ecommerce';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductDetailsActionsProps {
  product: Product;
}

const PIN_STORAGE_KEY = 'shopsphere_delivery_pincode';

export function ProductDetailsActions({ product }: ProductDetailsActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Delivery PIN code checker state
  const [pinCode, setPinCode] = useState<string>('');
  const [pinResult, setPinResult] = useState<{
    status: 'success' | 'error';
    message: string;
    deliveryDate?: string;
    shippingCharge?: string;
    codAvailable?: boolean;
  } | null>(null);

  const favorited = isInWishlist(product.id);

  // Load saved PIN from localStorage
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
      if (savedPin) {
        setPinCode(savedPin);
        checkPinCode(savedPin);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Active pricing and stock
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const isOutOfStock = currentStock <= 0;
  const subtotal = currentPrice * quantity;

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
    setTimeout(() => setIsAdded(false), 2500);
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

  const checkPinCode = (codeToCheck?: string) => {
    const code = (codeToCheck !== undefined ? codeToCheck : pinCode).trim();
    if (!/^[1-9][0-9]{5}$/.test(code)) {
      setPinResult({
        status: 'error',
        message: 'Please enter a valid 6-digit Indian PIN code (e.g., 560001, 110001).',
      });
      return;
    }

    try {
      localStorage.setItem(PIN_STORAGE_KEY, code);
    } catch {
      // Ignore
    }

    // Dynamic delivery estimate based on date
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const day = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const date = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    setPinResult({
      status: 'success',
      message: `Delivery available to ${code}`,
      deliveryDate: `${day}, ${date}`,
      shippingCharge: currentPrice >= 499 ? 'FREE' : '₹49',
      codAvailable: true,
    });
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

      {/* Quantity Selector & Subtotal */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quantity:
          </span>
          <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-sm text-slate-900 select-none font-mono">
              {isOutOfStock ? 0 : quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= currentStock || isOutOfStock}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {currentStock > 0 && currentStock <= 5 && (
            <span className="text-xs font-bold text-amber-600">
              Only {currentStock} left!
            </span>
          )}
        </div>

        {/* Live Subtotal */}
        <div className="text-right">
          <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
            Item Subtotal:
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {isOutOfStock && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Currently Out of Stock</p>
            <p className="text-[11px] text-rose-600 font-normal mt-0.5">
              This product is temporarily unavailable and cannot be purchased. Please explore the similar in-stock alternatives shown below.
            </p>
          </div>
        </div>
      )}

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
          className="flex-1 w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

      {/* View Cart Notification Banner when added */}
      {isAdded && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Product added to your cart successfully.</span>
          </span>
          <Link
            href="/cart"
            className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Section 12: Delivery Date & PIN Code Checker */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <Truck className="w-4 h-4 text-indigo-600" />
          <span>Delivery & Location Checker</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkPinCode();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pinCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPinCode(val);
                if (pinResult) setPinResult(null);
              }}
              placeholder="Enter 6-digit PIN code"
              maxLength={6}
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Check
          </button>
        </form>

        {pinResult && (
          <div
            className={`p-3 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-150 ${
              pinResult.status === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {pinResult.status === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{pinResult.message}</span>
            </div>

            {pinResult.status === 'success' && (
              <div className="space-y-1 text-[11px] text-slate-700 pl-5">
                <p>
                  ⚡ Estimated delivery by <strong className="font-bold text-slate-900">{pinResult.deliveryDate}</strong>
                </p>
                <p>
                  📦 Shipping Charges:{' '}
                  <strong className="font-bold text-emerald-700 font-mono">{pinResult.shippingCharge}</strong>
                </p>
                {pinResult.codAvailable && (
                  <p className="text-slate-600">✓ Cash on Delivery (COD) available</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
