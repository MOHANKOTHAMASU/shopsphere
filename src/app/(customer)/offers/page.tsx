'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/offers/page.tsx
// ShopSphere Offers, Verified Coupons & Bank Discounts Hub
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Copy,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Clock,
  ArrowRight,
  Percent,
} from 'lucide-react';

interface OfferCoupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  minOrder: string;
  validTill: string;
  category: string;
  badge?: string;
}

const AVAILABLE_COUPONS: OfferCoupon[] = [
  {
    code: 'SHOPSPHERE10',
    title: '10% Sitewide Discount',
    description: 'Save 10% on your entire cart up to ₹500 across all electronics, fashion, and home categories.',
    discountType: 'percentage',
    discountValue: '10% OFF',
    minOrder: 'Min Cart: ₹999',
    validTill: 'Valid till 31 Oct 2026',
    category: 'All Categories',
    badge: 'Trending',
  },
  {
    code: 'WELCOME500',
    title: 'Flat ₹500 Welcome Discount',
    description: 'Get an instant flat ₹500 reduction on your first premium electronics or lifestyle purchase.',
    discountType: 'flat',
    discountValue: '₹500 OFF',
    minOrder: 'Min Cart: ₹2,999',
    validTill: 'Valid till 30 Nov 2026',
    category: 'New Customers',
    badge: 'Popular',
  },
  {
    code: 'FESTIVE20',
    title: '20% Festive Season Special',
    description: 'Massive festive savings up to ₹1,000 on order values above ₹1,999.',
    discountType: 'percentage',
    discountValue: '20% OFF',
    minOrder: 'Min Cart: ₹1,999',
    validTill: 'Valid till 15 Nov 2026',
    category: 'Festive Deals',
    badge: 'Limited Time',
  },
  {
    code: 'AUDIO5',
    title: 'Extra 5% Audio & Tech Savings',
    description: 'Additional 5% discount on Sony, Bose, Apple, and Sennheiser audio merchandise.',
    discountType: 'percentage',
    discountValue: '5% OFF',
    minOrder: 'Min Cart: ₹4,999',
    validTill: 'Valid till 31 Dec 2026',
    category: 'Electronics',
  },
  {
    code: 'FREESHIP',
    title: 'Free Express Doorstep Delivery',
    description: 'Zero shipping fee on any order today, delivered within 48 hours across India.',
    discountType: 'flat',
    discountValue: 'FREE DELIVERY',
    minOrder: 'No Minimum Cart',
    validTill: 'Valid Today',
    category: 'All Orders',
    badge: 'Everyday Saver',
  },
];

const BANK_OFFERS = [
  {
    bank: 'HDFC Bank',
    offer: '10% Instant Discount up to ₹1,500 on HDFC Credit Cards on orders above ₹5,000.',
    icon: '💳',
  },
  {
    bank: 'ICICI Bank',
    offer: 'Flat ₹750 instant discount on ICICI Netbanking & Credit Card EMI transactions.',
    icon: '🏦',
  },
  {
    bank: 'UPI Cashback',
    offer: 'Flat ₹100 cashback via Google Pay / PhonePe / Paytm on transactions above ₹1,500.',
    icon: '⚡',
  },
  {
    bank: 'No Cost EMI',
    offer: 'Up to 6 months No Cost EMI available on major credit cards with zero processing fee.',
    icon: '📅',
  },
];

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="py-6 space-y-10 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Verified Offers & Promotional Discounts</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Exclusive Deals, Bank Offers & Coupons
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Apply verified coupon codes directly during checkout to maximize your savings. All offers
            are automatically validated against genuine catalog pricing.
          </p>
        </div>
      </div>

      {/* Verified Coupon Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <span>Available Store Coupons</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click &ldquo;Copy Code&rdquo; and paste it into the coupon input box in your Cart or Checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AVAILABLE_COUPONS.map((coupon) => {
            const isCopied = copiedCode === coupon.code;

            return (
              <div
                key={coupon.code}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {coupon.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {coupon.badge}
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                      <Percent className="w-4 h-4" />
                    </span>
                    <span className="text-lg font-black text-slate-900">{coupon.discountValue}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{coupon.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{coupon.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{coupon.minOrder}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {coupon.validTill}
                    </span>
                  </div>

                  {/* Copy Coupon Box */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-mono font-black text-sm text-indigo-900 tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank & Payment Partner Offers */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Bank & Payment Partner Offers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic instant discounts applied when paying with partner cards & UPI apps via Razorpay.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {BANK_OFFERS.map((offer, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3"
            >
              <span className="text-2xl shrink-0">{offer.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-900">{offer.bank}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{offer.offer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center py-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <span>Shop the 416-Item Catalog Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
