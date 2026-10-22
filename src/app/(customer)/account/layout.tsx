'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Package,
  Settings,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Award,
  Tag,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, signOut, isLoading } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer';
  const email = user?.email || 'customer@shopsphere.in';

  const navLinks = [
    { label: 'Overview', href: '/account', icon: User, exact: true },
    { label: 'My Orders', href: '/account/orders', icon: Package },
    { label: 'Rewards & SuperCoins', href: '/rewards', icon: Award },
    { label: 'Coupons & Offers', href: '/offers', icon: Tag },
    { label: 'Profile Settings', href: '/account/profile', icon: Settings },
    { label: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Customer Support', href: '/support', icon: LifeBuoy },
    { label: 'My Wishlist', href: '/wishlist', icon: Heart },
  ];

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying Customer Account...</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Account User Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {displayName}
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">{email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="self-end sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Grid Layout: Sidebar Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Account Sidebar Navigation (3 cols on lg) */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Account Menu
            </span>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Account Slot (9 cols on lg) */}
        <div className="lg:col-span-9 min-w-0">{children}</div>
      </div>
    </div>
  );
}
