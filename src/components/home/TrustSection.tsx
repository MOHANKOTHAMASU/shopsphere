import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

const TRUST_POINTS = [
  {
    icon: Truck,
    title: 'Free Express Shipping',
    desc: 'Guaranteed 2-3 day delivery across all major metropolitan pin-codes.',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    icon: ShieldCheck,
    title: '100% Authentic Brands',
    desc: 'Direct from brand authorized distributors with official warranty.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    icon: RotateCcw,
    title: '7-Day Easy Returns',
    desc: 'No-questions-asked doorstep pickup and immediate bank refunds.',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    icon: Headphones,
    title: '24/7 Priority Support',
    desc: 'Reach our dedicated e-commerce concierge team via toll-free phone or chat.',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

export function TrustSection() {
  return (
    <section className="my-10 sm:my-14 py-10 px-6 sm:px-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
          Why Choose ShopSphere
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          An E-Commerce Standard Built on Trust & Speed
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRUST_POINTS.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors flex flex-col items-start"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${point.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{point.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{point.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
