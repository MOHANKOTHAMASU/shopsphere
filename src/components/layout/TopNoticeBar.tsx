import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, PhoneCall, ShieldAlert } from 'lucide-react';

export function TopNoticeBar() {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Free Express Shipping</span> on orders over ₹999
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% Genuine Brands Guarantee
          </span>
        </div>

        <div className="flex items-center space-x-5 text-slate-400">
          <Link
            href="/admin/login"
            className="flex items-center gap-1 hover:text-amber-400 transition-colors text-[11px] font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Admin Portal</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            <span>Support: 1800-200-SHOP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
