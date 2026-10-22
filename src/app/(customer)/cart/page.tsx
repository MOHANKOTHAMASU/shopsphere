'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Layers,
  Heart,
  Bookmark,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    revalidateCart,
    totalItems,
    subtotal,
    totalSavings,
    warnings,
    clearWarnings,
    isLoading,
  } = useCart();
  const { toggleWishlist } = useWishlist();

  const handleMoveToWishlist = (product: typeof items[0]['product'], itemId: string) => {
    toggleWishlist(product);
    removeFromCart(itemId);
  };

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'SHOPSPHERE10') {
      const discount = Math.round(subtotal * 0.1);
      setCouponDiscount(discount);
      setCouponMessage({
        type: 'success',
        text: `Coupon applied! You saved ${formatCurrency(discount)} (10% OFF)`,
      });
    } else {
      setCouponDiscount(0);
      setCouponMessage({
        type: 'error',
        text: 'Invalid promo code. Try "SHOPSPHERE10" for 10% off.',
      });
    }
  };

  const handleProceedToCheckout = async () => {
    setIsCheckingOut(true);
    setValidationAlert(null);
    try {
      // Revalidate stock and price on server before allowing checkout
      const validation = await revalidateCart(couponDiscount > 0 ? 'SHOPSPHERE10' : undefined);

      if (!validation.isValid || validation.hasChanges) {
        setValidationAlert(
          'Your cart was updated with latest database prices and stock availability. Please review before proceeding.'
        );
        setIsCheckingOut(false);
        return;
      }

      router.push('/checkout');
    } catch {
      setValidationAlert('Failed to verify cart with server. Please try again.');
      setIsCheckingOut(false);
    }
  };

  // 10. Useful Empty State with Continue Shopping link
  if (items.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
          <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Shopping Cart is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Looks like you haven&apos;t added any items to your cart yet. Explore our curated collections
            and grab the best offers.
          </p>
        </div>

        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-6 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Popular Collections:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: 'Electronics', slug: 'electronics' },
              { name: 'Footwear', slug: 'footwear' },
              { name: 'Fashion', slug: 'fashion' },
              { name: 'Home & Living', slug: 'home-living' },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/products?cat=${c.slug}`}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-xs"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      {/* Title & Clear Cart */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You have <strong className="font-bold text-slate-800">{totalItems}</strong> item
            {totalItems > 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Warnings & Validation Alerts */}
      {(warnings.length > 0 || validationAlert) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Inventory / Cart Notice</span>
            </span>
            {warnings.length > 0 && (
              <button
                onClick={clearWarnings}
                className="text-[11px] text-amber-700 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
          {validationAlert && <p className="font-semibold text-amber-800">{validationAlert}</p>}
          {warnings.map((w, idx) => (
            <p key={idx} className="text-amber-800">
              • {w}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Cart Items List (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const product = item.product;
            const itemTotal = item.unitPrice * item.quantity;
            const isNearMaxStock = item.quantity >= item.maxStock;

            return (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Thumbnail, Variant & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <Link
                    href={`/products/${product.slug}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0"
                  >
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </Link>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {product.brand}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-600 line-clamp-2 transition-colors">
                      <Link href={`/products/${product.slug}`}>{product.title}</Link>
                    </h3>

                    {/* Variant Badge if selected */}
                    {item.variantTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-semibold text-slate-800">
                          Option: {item.variantTitle}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {formatCurrency(item.unitPrice)}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
                        <span className="text-[11px] text-slate-400 line-through font-mono">
                          {formatCurrency(item.compareAtPrice)}
                        </span>
                      )}
                    </div>

                    {/* Delivery Estimate per Item */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Estimated delivery in 2–3 days</span>
                    </div>

                    {/* Stock note */}
                    {item.maxStock <= 5 && item.maxStock > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 block">
                        Only {item.maxStock} left in stock!
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls, Item Subtotal & Actions */}
                <div className="flex flex-col sm:items-end justify-between w-full sm:w-auto gap-3 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-xs text-slate-900 select-none font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isNearMaxStock}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        {formatCurrency(itemTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Move to Wishlist & Remove Buttons */}
                  <div className="flex items-center justify-end gap-3 text-xs w-full">
                    <button
                      onClick={() => handleMoveToWishlist(product, item.id)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Move item to Wishlist"
                    >
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>Move to Wishlist</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Card (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-slate-500 font-normal">
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </span>
            </h2>

            {/* Price Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product MRP Savings</span>
                  <span className="font-mono">-{formatCurrency(totalSavings)}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount (10% OFF)</span>
                  <span className="font-mono">-{formatCurrency(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivery Charges</span>
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>

              {shippingFee > 0 && (
                <p className="text-[11px] text-indigo-600 font-medium">
                  Add {formatCurrency(999 - subtotal)} more for Free Delivery!
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-black text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="pt-2">
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Have a Promo Code?</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SHOPSPHERE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs uppercase bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 h-10 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <div
                  className={`mt-2 text-xs flex items-center gap-1.5 font-medium ${
                    couponMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {couponMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{couponMessage.text}</span>
                </div>
              )}
            </form>

            {/* Checkout CTA */}
            <div className="pt-2">
              <button
                onClick={handleProceedToCheckout}
                disabled={isCheckingOut || isLoading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying with Server...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Continue Shopping CTA */}
            <div>
              <Link
                href="/products"
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Safe & Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <span>7-Day Easy Replacement Policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
