'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOutAction();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-slate-200 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400">Environment:</span>
        <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>ShopSphere Admin Console</span>
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
            A
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-bold text-white">Administrator</p>
            <p className="text-[10px] text-slate-400">admin@shopsphere.dev</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Sign out of admin"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
