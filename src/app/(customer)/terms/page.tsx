import React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | ShopSphere Marketplace',
  description: 'Terms and conditions governing the use of the ShopSphere marketplace platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last revised: October 20, 2026 &bull; Effective immediately for all ShopSphere users
        </p>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. Acceptance of Terms
          </h2>
          <p>
            Welcome to ShopSphere. By accessing or using our website, mobile application, or customer
            services, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and all
            applicable laws and regulations. If you do not agree with any part of these Terms, you
            must refrain from using our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            2. Account Registration and Security
          </h2>
          <p>
            When registering for a ShopSphere customer account, you agree to provide true, accurate,
            and complete information. You are solely responsible for maintaining the confidentiality
            of your login credentials and for all activities that occur under your account.
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>You must be at least 18 years old to place orders independently.</li>
            <li>You agree to notify ShopSphere immediately of any unauthorized access.</li>
            <li>We reserve the right to suspend accounts engaged in abusive, fraudulent, or scraping activities.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Pricing, Payments & Order Idempotency
          </h2>
          <p>
            All listed prices are denominated in Indian Rupees (INR) and are inclusive of Goods and
            Services Tax (GST). ShopSphere utilizes server-side price validation to ensure complete
            accuracy before orders are processed. Payments are processed via PCI-DSS compliant
            gateways including Razorpay and Cash on Delivery (COD).
          </p>
          <p>
            In the event of an obvious typographical pricing error, we reserve the right to cancel
            the unfulfilled order and issue a full refund to the original payment method.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. Customer Reviews and Community Guidelines
          </h2>
          <p>
            To preserve authenticity, reviews may only be submitted by verified purchasers who have
            an active, completed order for the specified product. Submissions must not contain
            defamatory, abusive, or spam material. ShopSphere strictly enforces review integrity and
            prohibits customers from tampering with or editing other users&rsquo; feedback.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            5. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable Indian law, ShopSphere and its affiliates
            shall not be liable for any indirect, incidental, punitive, or consequential damages
            arising out of or related to your use of our platform or purchased merchandise.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            6. Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            Republic of India. Any disputes arising hereunder shall be subject to the exclusive
            jurisdiction of the competent courts in Bengaluru, Karnataka.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-slate-400">Questions about our Terms?</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Contact Legal & Compliance Team</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
