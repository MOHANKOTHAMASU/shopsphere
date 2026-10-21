import React from 'react';
import Link from 'next/link';
import { CreditCard, RefreshCw, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy | ShopSphere',
  description: 'Instant refund timelines, Razorpay reversals, cancellation procedures, and COD payouts.',
};

export default function RefundsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Fair & Transparent Refunds</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last revised: October 20, 2026 &bull; Swift reversals via Razorpay and direct bank transfer
        </p>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. Order Cancellation Policy
          </h2>
          <p>
            You can cancel any order free of charge at any time before it transitions to the &ldquo;Shipped&rdquo;
            stage directly from your Order Details page.
          </p>
          <p>
            When an order is cancelled:
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Inventory is automatically restored to the active catalog in real time.</li>
            <li>If prepaid, the full transaction amount including delivery fees is refunded immediately.</li>
            <li>If Cash on Delivery (COD), no charges apply.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <span>2. Refund Turnaround Timelines</span>
          </h2>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2 bg-slate-50 font-bold text-slate-800">
              <span>Payment Mode</span>
              <span>Processing Method</span>
              <span>Estimated Reflection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="font-semibold text-slate-800">UPI (GPay, PhonePe, Paytm)</span>
              <span>Razorpay Instant Reversal</span>
              <span className="font-mono text-emerald-600 font-bold">15 mins &ndash; 24 hours</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="font-semibold text-slate-800">Credit / Debit Card</span>
              <span>Direct Bank Reversal</span>
              <span className="font-mono text-slate-700">3 to 5 business days</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="font-semibold text-slate-800">Netbanking</span>
              <span>Bank Account Credit</span>
              <span className="font-mono text-slate-700">2 to 4 business days</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="font-semibold text-slate-800">Cash on Delivery (COD)</span>
              <span>IMPS / NEFT / UPI Payout</span>
              <span className="font-mono text-slate-700">Within 48 hours of item pickup</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Partial Cancellations & Discount Adjustments
          </h2>
          <p>
            If a coupon code required a minimum order threshold (such as SHOPSPHERE10 with ₹500
            minimum), cancelling part of the order may adjust the final refund according to the revised
            subtotal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. Escalations & Bank Reference Numbers (RRN)
          </h2>
          <p>
            If your refund does not reflect within the stated timeframe, our support team can provide
            the Razorpay ARN / RRN bank reference code so your bank can immediately trace and release
            the funds.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-slate-400">Questions about a pending refund?</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Track Refund with Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
