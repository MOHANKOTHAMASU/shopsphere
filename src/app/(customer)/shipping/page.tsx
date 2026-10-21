import React from 'react';
import Link from 'next/link';
import { Truck, Clock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Policy | ShopSphere',
  description: 'Shipping timelines, free delivery thresholds, courier partners, and order tracking information.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Truck className="w-3.5 h-3.5" />
          <span>Express Logistics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last revised: October 20, 2026 &bull; Nationwide pan-India express delivery
        </p>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. Shipping Coverage & Rates
          </h2>
          <p>
            ShopSphere delivers to over 19,000+ pin codes across India in partnership with premium
            couriers including Blue Dart, Delhivery, and Shadowfax.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-xs font-bold text-indigo-900 block mb-1">Standard Orders</span>
              <p className="text-slate-600">
                Orders below ₹999 incur a nominal flat shipping fee of <strong>₹49</strong>.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900 block mb-1">Orders Over ₹999</span>
              <p className="text-slate-600">
                Enjoy <strong>100% Free Express Delivery</strong> automatically applied at checkout!
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>2. Estimated Delivery Timelines</span>
          </h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong>Tier 1 Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata):</strong> 2 to 3 business days.</li>
            <li><strong>Tier 2 & 3 Cities:</strong> 3 to 5 business days.</li>
            <li><strong>Remote Regions (North-East, J&K, Island territories):</strong> 5 to 7 business days.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Order Tracking & SMS Notifications
          </h2>
          <p>
            Once your order is packed and dispatched from our fulfillment center, you will receive an
            SMS and email containing your Air Waybill (AWB) number and direct tracking link. You can
            also visit our live tracker at any time:
          </p>
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Truck className="w-4 h-4" />
            <span>Open Order Tracker (/track)</span>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. Damaged or Tampered Packages
          </h2>
          <p>
            If the package arrives with a broken outer seal or signs of physical damage, please refuse
            to accept delivery and contact our customer support immediately. We will arrange a free
            priority replacement or issue a full refund upon verification.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-slate-400">Need immediate shipping support?</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Contact Logistics Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
