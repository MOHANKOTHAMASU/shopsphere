'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  Shield,
  LogOut,
  MapPin,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';
import { MobileDrawer } from './MobileDrawer';
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { totalItems, subtotal } = useCart();
  const { totalWishlistItems } = useWishlist();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const firstName = displayName.split(' ')[0];

  const handleSignOut = async () => {
    setIsAccountOpen(false);
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Shop<span className="text-indigo-600">Sphere</span>
                </span>
                <span className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase -mt-1 hidden sm:block">
                  Next-Gen Marketplace
                </span>
              </div>
            </Link>

            {/* Omnipresent Search Bar with Live Autocomplete Suggestions */}
            <div className="hidden md:flex flex-1 max-w-2xl items-center relative">
              <SearchAutocomplete
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showCategoryDropdown={true}
              />
            </div>

            {/* Right Action Icons (Account, Wishlist, Cart) */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  onBlur={() => setTimeout(() => setIsAccountOpen(false), 250)}
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  aria-label="Account menu"
                  aria-expanded={isAccountOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {user ? (
                      <span className="text-indigo-600">
                        {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[110px]">
                      {user ? `Hello, ${firstName}` : 'Hello, Sign In'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center">
                      {user ? 'My Account' : 'Account & Lists'}
                      <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
                    </span>
                  </div>
                </button>

                {/* Account Popover Menu */}
                {isAccountOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {user ? (
                      /* Authenticated User Menu */
                      <>
                        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {displayName || 'ShopSphere Customer'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            Verified Customer
                          </span>
                        </div>

                        <div className="py-2 text-xs text-slate-700 font-medium">
                          <Link
                            href="/account"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            Account Overview
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            My Orders
                          </Link>
                          <Link
                            href="/account/profile"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            Profile Settings
                          </Link>
                          <Link
                            href="/account/addresses"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Delivery Addresses
                          </Link>
                          <Link
                            href="/wishlist"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-slate-400" />
                            My Wishlist
                          </Link>
                        </div>

                        <div className="pt-2 border-t border-slate-100 px-4">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-between text-xs text-rose-600 font-bold hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Unauthenticated Guest Menu */
                      <>
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs text-slate-500">Welcome to ShopSphere</p>
                          <div className="mt-2 flex gap-2">
                            <Link
                              href="/auth/login"
                              className="flex-1 text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Sign In
                            </Link>
                            <Link
                              href="/auth/register"
                              className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Register
                            </Link>
                          </div>
                        </div>

                        <div className="py-2 text-xs text-slate-700 font-medium">
                          <Link
                            href="/auth/login?redirect=/account/orders"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            My Orders
                          </Link>
                          <Link
                            href="/wishlist"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-slate-400" />
                            My Wishlist
                          </Link>
                          <Link
                            href="/products"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Layers className="w-4 h-4 text-slate-400" />
                            Browse Catalog
                          </Link>
                        </div>

                        <div className="pt-2 border-t border-slate-100 px-4">
                          <Link
                            href="/admin/login"
                            className="flex items-center justify-between text-[11px] text-amber-700 font-semibold bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors border border-amber-200/60"
                          >
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-600" />
                              Admin Console
                            </span>
                            <span>Manage &rarr;</span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                className="relative p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                aria-label={`Wishlist with ${totalWishlistItems} items`}
              >
                <Heart className="w-5 h-5" />
                {totalWishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Link */}
              <Link
                href="/cart"
                className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white transition-all shadow-sm group"
                aria-label={`Shopping cart with ${totalItems} items`}
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                    Cart
                  </span>
                  <span className="text-xs font-bold text-white">
                    {subtotal > 0 ? formatCurrency(subtotal) : '₹0'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar Row with Live Suggestions */}
          <div className="md:hidden pb-3">
            <SearchAutocomplete
              showCategoryDropdown={false}
              placeholder="Search products, brands, categories..."
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
