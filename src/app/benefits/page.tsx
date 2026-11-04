import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  Search,
  Truck,
  RotateCcw,
  Tag,
  Heart,
  LifeBuoy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const metadata = {
  title: 'Customer Benefits — ShopSphere',
  description:
    'Discover the genuine advantages of shopping on ShopSphere: mobile OTP login, transparent pricing, 7-day returns, and real-time order tracking.',
};

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  whatWeProvide: string;
  whatWeDoNotClaim: string;
  actionUrl: string;
  actionText: string;
}

const GENUINE_BENEFITS: BenefitItem[] = [
  {
    id: 'otp-login',
    title: 'Passwordless Mobile OTP Login',
    description: 'Sign in effortlessly using only your 10-digit mobile number and SMS OTP code.',
    icon: Smartphone,
    whatWeProvide: 'Instant 6-digit OTP delivery to any Indian mobile number (Jio, Airtel, Vi, BSNL). Zero passwords to memorize.',
    whatWeDoNotClaim: 'We do not claim instantaneous SMS in areas with poor cellular signal or network downtime.',
    actionUrl: '/auth/login',
    actionText: 'Experience Mobile Login',
  },
  {
    id: 'easy-discovery',
    title: 'Easy Product Discovery & Filters',
    description: 'Find products quickly across 10 official categories with multi-attribute filtering.',
    icon: Search,
    whatWeProvide: 'Live search autocomplete, category filters, brand selectors, and price range presets (under ₹500, under ₹1,000, etc.).',
    whatWeDoNotClaim: 'We do not claim infinite inventory like mega-marketplaces; our catalog is curated with 445 verified items.',
    actionUrl: '/products',
    actionText: 'Browse Catalog',
  },
  {
    id: 'clear-pricing',
    title: 'Clear, Transparent Pricing & Discounts',
    description: 'What you see is what you pay. Zero surprise surcharges at final payment.',
    icon: Tag,
    whatWeProvide: 'Transparent MRP, selling prices, verified coupon codes (SHOPSPHERE10), and clear itemized savings.',
    whatWeDoNotClaim: 'We do not guarantee "lowest prices in the country" against every competitor promotion.',
    actionUrl: '/offers',
    actionText: 'View Active Offers',
  },
  {
    id: 'free-shipping',
    title: 'Fair Shipping & Free Delivery Threshold',
    description: 'Clear shipping terms calculated dynamically based on your order subtotal.',
    icon: Truck,
    whatWeProvide: 'Orders of ₹1,999 and above receive 100% Free Shipping. A modest flat fee of ₹149 applies on smaller orders.',
    whatWeDoNotClaim: 'We do not claim unconditional free delivery on every ₹50 item without order thresholds.',
    actionUrl: '/shipping',
    actionText: 'Read Shipping Policy',
  },
  {
    id: 'secure-checkout',
    title: 'Cryptographically Verified Checkout',
    description: 'Pay safely with test mode sandbox protection or Cash on Delivery.',
    icon: ShieldCheck,
    whatWeProvide: 'Razorpay UPI (Google Pay, PhonePe), Credit/Debit Cards, Net Banking, and Cash on Delivery with server-side HMAC verification.',
    whatWeDoNotClaim: 'We do not store credit card numbers or banking passwords on our servers.',
    actionUrl: '/checkout',
    actionText: 'Secure Checkout Info',
  },
  {
    id: 'returns-cancellation',
    title: 'Transparent 7-Day Returns & 1-Click Cancellation',
    description: 'Easy order cancellation before shipping and hassle-free returns after delivery.',
    icon: RotateCcw,
    whatWeProvide: '1-Click self-service cancellation for pending orders with instant stock restore; 7-day return request for delivered orders.',
    whatWeDoNotClaim: 'We do not promise instant 5-minute cash refunds; pickups and returns require 48 business hours to process.',
    actionUrl: '/returns',
    actionText: 'View Return Policy',
  },
  {
    id: 'live-tracking',
    title: 'Public Order Timeline Tracking',
    description: 'Track your package progress from placement to doorstep delivery.',
    icon: Truck,
    whatWeProvide: 'Real-time order timeline on /track using your unique Order ID (ORD-...) without requiring login.',
    whatWeDoNotClaim: 'We do not guarantee same-day delivery to remote non-serviceable pin codes.',
    actionUrl: '/track',
    actionText: 'Track a Package',
  },
  {
    id: 'customer-support',
    title: 'Dedicated Customer Support',
    description: 'Real help whenever you have a question about products, delivery, or returns.',
    icon: LifeBuoy,
    whatWeProvide: 'Online support ticketing, quick email assistance, and order-specific inquiry links.',
    whatWeDoNotClaim: 'We do not promise robotic 24/7 instantaneous human responses at 3:00 AM.',
    actionUrl: '/support',
    actionText: 'Contact Support',
  },
];

export default function BenefitsPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Honest & Transparent E-Commerce</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Customer Benefits on ShopSphere
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We believe in complete transparency. Here is an honest breakdown of the genuine benefits we provide, and what we deliberately do not claim.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GENUINE_BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  {/* What We Provide */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>What We Genuinely Provide</span>
                    </div>
                    <p className="text-xs text-emerald-950 leading-relaxed">
                      {item.whatWeProvide}
                    </p>
                  </div>

                  {/* What We Do Not Claim */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>What We Do Not Misleadingly Claim</span>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      {item.whatWeDoNotClaim}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={item.actionUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Callout */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Our Core Promise to Every Customer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear commitments you can hold us accountable for:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-xl">🔒</span>
              <h4 className="text-xs font-bold text-slate-900">Zero Hidden Charges</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cart subtotals, GST, and shipping fees are calculated transparently before you enter payment details.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-xl">📱</span>
              <h4 className="text-xs font-bold text-slate-900">One-Tap Mobile Login</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Never lose access because of a forgotten password. Your phone number is your universal key.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-xl">📦</span>
              <h4 className="text-xs font-bold text-slate-900">Transparent Return Terms</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                If an item is damaged or defective, submit a return request from your order dashboard within 7 days.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-200 transition-all"
          >
            <span>Start Shopping with Confidence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

