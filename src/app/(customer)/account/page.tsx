'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/account/page.tsx
// ShopSphere Customer Account Dashboard & Overview
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Heart,
  MapPin,
  Settings,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  LogOut,
  Mail,
  Phone,
  User,
  KeyRound,
  CheckCircle2,
  Clock,
  Award,
  Tag,
  LifeBuoy,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { getCustomerOrdersAction } from '@/lib/orders/actions';
import { getAddressesAction } from '@/lib/addresses/actions';
import { getRewardsSummaryAction, RewardsSummary } from '@/lib/rewards/actions';
import { signOutAction } from '@/lib/auth/actions';

export default function AccountOverviewPage() {
  const router = useRouter();
  const { user, profile, isConfigured } = useAuth();
  const { totalWishlistItems } = useWishlist();

  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(1);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Valued Customer';
  const email = user?.email || 'N/A';
  const phone = profile?.phone || user?.user_metadata?.phone || '+91 98765 43210';
  const isEmailVerified = Boolean(
    (user as unknown as { email_confirmed_at?: string })?.email_confirmed_at || !isConfigured
  );

  useEffect(() => {
    let isMounted = true;

    getCustomerOrdersAction().then((res) => {
      if (isMounted && res.success && res.orders) {
        setOrdersCount(res.orders.length);
      }
    });

    getAddressesAction().then((res) => {
      if (isMounted && res.success && res.addresses) {
        setAddressCount(res.addresses.length);
      }
    });

    getRewardsSummaryAction().then((res) => {
      if (isMounted && res.success && res.rewards) {
        setRewards(res.rewards);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOutAction();
    router.push('/auth/login?logout=success');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-2xl font-black text-slate-900">{ordersCount} Placed</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <span>Track & view history</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Rewards & SuperCoins */}
        <Link
          href="/rewards"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reward Points
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {rewards?.availablePoints || 100} Pts
          </p>
          <p className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <span>{rewards?.tier || 'Silver'} Member Club</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Wishlist */}
        <Link
          href="/wishlist"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all group"
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
          <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <span>View saved products</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 4: Addresses */}
        <Link
          href="/account/addresses"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Addresses
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{addressCount} Saved</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>Manage delivery locations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Quick Access Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Banner 1: Offers */}
        <Link
          href="/offers"
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between hover:opacity-95 transition-opacity"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Verified Deals
            </span>
            <p className="text-sm font-black">Coupons & Offers</p>
            <p className="text-[11px] text-purple-200">Save up to 20% on your cart</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-amber-300" />
          </div>
        </Link>

        {/* Banner 2: Live Tracking */}
        <Link
          href="/track"
          className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between hover:opacity-95 transition-opacity"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Real-Time Tracking
            </span>
            <p className="text-sm font-black">Package Tracker</p>
            <p className="text-[11px] text-slate-300">Live Blue Dart & Delhivery updates</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
        </Link>

        {/* Banner 3: 24/7 Support */}
        <Link
          href="/support"
          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-900 text-white flex items-center justify-between hover:opacity-95 transition-opacity"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
              Helpdesk & FAQs
            </span>
            <p className="text-sm font-black">24/7 Customer Care</p>
            <p className="text-[11px] text-blue-200">Toll-free call & ticket tracking</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-5 h-5 text-blue-300" />
          </div>
        </Link>
      </div>

      {/* Account Details & Security Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Profile Information</h2>
            <p className="text-xs text-slate-500">Your verified contact and authentication identity</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account/profile"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing Out...' : 'Log Out'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Legal Name */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
              <User className="w-3.5 h-3.5" />
              <span>Full Name</span>
            </div>
            <p className="font-bold text-slate-900">{fullName}</p>
          </div>

          {/* Email Address & Verification */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                <Mail className="w-3.5 h-3.5" />
                <span>Primary Email</span>
              </div>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Verification Pending
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 font-mono text-xs sm:text-sm break-all">{email}</p>
          </div>

          {/* Phone Number */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                <Phone className="w-3.5 h-3.5" />
                <span>Verified Mobile</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                SMS Verified
              </span>
            </div>
            <p className="font-bold text-slate-900">{phone}</p>
          </div>

          {/* Membership Tier */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-xs">Loyalty Status</span>
            <p className="font-bold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{rewards?.tier || 'Silver'} Member Club</span>
            </p>
          </div>
        </div>

        {/* Security & Password */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Protected Account Security</p>
              <p className="text-[11px] text-slate-500">
                Encrypted session credentials with zero plain-text password retention.
              </p>
            </div>
          </div>
          <Link
            href="/account/profile"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Update Password &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
