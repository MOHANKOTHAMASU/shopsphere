import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowRight, Eye, Database } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | ShopSphere Marketplace',
  description: 'Our commitment to safeguarding your privacy, personal information, and payment security.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Protection & Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last revised: October 20, 2026 &bull; Compliant with Digital Personal Data Protection (DPDP) Act
        </p>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>1. Our Privacy Pledge</span>
          </h2>
          <p>
            At ShopSphere, we recognize that your privacy is a cornerstone of trust. We never sell,
            rent, or trade your personal information to third-party data brokers. This policy outlines
            what data we collect, how it is safeguarded, and how you retain control over your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>2. Information We Collect</span>
          </h2>
          <p>We only collect information necessary to fulfill your orders and improve your shopping experience:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li><strong>Account Data:</strong> Name, verified email address, and encrypted passwords managed via Supabase Auth.</li>
            <li><strong>Shipping & Delivery:</strong> Delivery address, pin code, state, and mobile phone number for courier updates.</li>
            <li><strong>Order History:</strong> Products purchased, order numbers, transaction records, and invoice histories.</li>
            <li><strong>Payment Information:</strong> Card numbers, UPI IDs, and CVVs are processed directly through Razorpay and never stored on our application servers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>3. How We Use Your Information</span>
          </h2>
          <p>Your information is used strictly for legitimate business purposes:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Dispatching shipments and facilitating live order tracking with our courier partners (Blue Dart, Delhivery).</li>
            <li>Preventing fraudulent transactions and unauthorized account access.</li>
            <li>Communicating critical order status changes, OTP verifications, and delivery confirmations.</li>
            <li>Enforcing verified purchase eligibility on customer ratings and reviews.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. Security and Data Retention
          </h2>
          <p>
            We deploy 256-bit SSL encryption across all web sessions, strict database Row Level Security
            (RLS) policies on Supabase, and role-based access control (RBAC) ensuring unauthorized
            employees cannot view customer PII.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            5. Your Customer Rights
          </h2>
          <p>
            You have the right to access, edit, or request erasure of your personal data at any time
            through your Account Profile settings or by reaching out to our Data Protection Officer at{' '}
            <strong className="text-slate-900 font-mono">privacy@shopsphere.in</strong>.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-slate-400">Have questions about our data safeguards?</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            <span>Contact Privacy Officer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
