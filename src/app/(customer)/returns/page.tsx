import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, PackageX } from 'lucide-react';

export const metadata = {
  title: 'Returns & Exchange Policy | ShopSphere',
  description: '7-day easy returns, replacement guidelines, doorstep pickup, and eligibility criteria.',
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>7-Day Return Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Returns & Exchange Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last revised: October 20, 2026 &bull; Hassle-free doorstep pickup across India
        </p>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. 7-Day Easy Replacement & Return Window
          </h2>
          <p>
            We want you to be completely delighted with your purchase. You can request a replacement
            or return within <strong>7 calendar days</strong> from the date of confirmed delivery if:
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>The product is defective, malfunctioning, or dead-on-arrival.</li>
            <li>The product has arrived physically damaged or with missing accessories.</li>
            <li>The delivered item differs in model, color, or specifications from what was ordered.</li>
            <li>Fashion apparel or footwear does not fit as expected (size exchange).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            2. Return Eligibility & Conditions
          </h2>
          <p>To qualify for a full replacement or refund, items must satisfy the following conditions:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>The item must be unused, unwashed, and in the original manufacturer packaging.</li>
            <li>Original tags, user manuals, warranty cards, and serial number barcodes must remain intact.</li>
            <li>Free gifts or promotional add-ons bundled with the product must also be returned.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Doorstep Pickup Process
          </h2>
          <p>
            Once you submit a return request from your{' '}
            <Link href="/account/orders" className="text-indigo-600 font-bold hover:underline">
              Orders History page
            </Link>
            , our courier partner will arrive at your address within 24 to 48 hours for a quick
            doorstep verification and pickup. You do not need to print any return labels.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <PackageX className="w-4 h-4 text-rose-600" />
            <span>4. Non-Returnable Categories</span>
          </h2>
          <p>
            For hygiene and safety reasons, certain product categories are non-returnable once opened:
            innerwear, intimate apparel, consumables, and personal care appliances (unless defective upon delivery).
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-slate-400">Need help initiating a return?</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Open Return Assistance Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
