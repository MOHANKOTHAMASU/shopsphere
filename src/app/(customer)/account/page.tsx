'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  Heart,
  MapPin,
  Settings,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

export default function AccountOverviewPage() {
  const { user, profile } = useAuth();
  const { totalWishlistItems } = useWishlist();

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Customer';
  const email = user?.email || 'N/A';
  const phone = profile?.phone || 'Not added yet';

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Orders */}
        <Link
          href="/account/orders"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">0 Active</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <span>View order history</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Wishlist */}
        <Link
          href="/wishlist"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saved Wishlist
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalWishlistItems} Items</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <span>View your wishlist</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Addresses */}
        <Link
          href="/account/addresses"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Addresses
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">1 Address</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <span>Manage shipping locations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Account Details & Security Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Profile Information</h2>
            <p className="text-xs text-slate-500">Your personal details and contact data</p>
          </div>
          <Link
            href="/account/profile"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-xs">Full Legal Name</span>
            <p className="font-bold text-slate-900">{fullName}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-xs">Primary Email</span>
            <p className="font-bold text-slate-900 font-mono">{email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-xs">Phone Number</span>
            <p className="font-bold text-slate-900">{phone}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-xs">Account Tier</span>
            <p className="font-bold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ShopSphere Prime Member</span>
            </p>
          </div>
        </div>

        {/* Security & Password */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Protected with Supabase Auth</p>
              <p className="text-[11px] text-slate-500">
                Your session is secured with encrypted HTTP-only session tokens.
              </p>
            </div>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Change Password &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
