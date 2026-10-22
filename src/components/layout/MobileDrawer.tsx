'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  User,
  ShoppingBag,
  Heart,
  Shield,
  ChevronRight,
  Headphones,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Footprints,
  LogOut,
  Package,
  Settings,
  MapPin,
  BookOpen,
  Watch,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';

const ICON_MAP: Record<string, React.ReactNode> = {
  Headphones: <Headphones className="w-4 h-4 text-indigo-500" />,
  Shirt: <Shirt className="w-4 h-4 text-emerald-500" />,
  Home: <Home className="w-4 h-4 text-amber-500" />,
  Sparkles: <Sparkles className="w-4 h-4 text-pink-500" />,
  Dumbbell: <Dumbbell className="w-4 h-4 text-cyan-500" />,
  Footprints: <Footprints className="w-4 h-4 text-orange-500" />,
  BookOpen: <BookOpen className="w-4 h-4 text-blue-500" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
  Watch: <Watch className="w-4 h-4 text-purple-500" />,
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user, profile, signOut } = useAuth();

  if (!isOpen) return null;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {user ? (
                <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400">
                {user ? 'Signed in as' : 'Welcome to'}
              </p>
              <p className="text-sm font-bold text-white truncate max-w-[170px]">
                {user ? displayName || user.email : 'ShopSphere Account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Action Area */}
        {user ? (
          <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs">
            <Link
              href="/account"
              onClick={onClose}
              className="font-bold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>My Account & Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex gap-2">
            <Link
              href="/auth/login"
              onClick={onClose}
              className="flex-1 py-2 text-center text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              onClick={onClose}
              className="flex-1 py-2 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile Drawer Search Box */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          <SearchAutocomplete
            showCategoryDropdown={false}
            placeholder="Search products..."
            onCloseMobile={onClose}
          />
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Shop by Category
          </div>
          <nav className="mt-1">
            {DEVELOPMENT_SEED_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?cat=${cat.slug}`}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cat.iconName && ICON_MAP[cat.iconName]}
                  <span className="font-medium">{cat.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Customer Area
            </div>
            <nav className="mt-1">
              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                All Products
              </Link>
              <Link
                href="/rewards"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Rewards & SuperCoins
              </Link>
              <Link
                href="/offers"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Tag className="w-4 h-4 text-indigo-500" />
                Offers & Coupons
              </Link>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Package className="w-4 h-4 text-slate-400" />
                My Orders
              </Link>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                My Wishlist
              </Link>
              <Link
                href="/support"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Headphones className="w-4 h-4 text-blue-500" />
                Customer Support — 24/7
              </Link>
              <Link
                href="/account/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Profile Settings
              </Link>
              <Link
                href="/account/addresses"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <MapPin className="w-4 h-4 text-slate-400" />
                Delivery Addresses
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                Shopping Cart
              </Link>
            </nav>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <Link
            href="/admin/login"
            onClick={onClose}
            className="flex items-center justify-between w-full p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Admin Portal Login</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
