'use client';

// -----------------------------------------------------------------------------
// src/components/layout/BottomNavigation.tsx
// Mobile Sticky Bottom Navigation (Amazon / Flipkart Style)
// -----------------------------------------------------------------------------

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  Tag,
  Heart,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

const emptySubscribe = () => () => {};

export function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalWishlistItems } = useWishlist();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      exact: true,
    },
    {
      label: 'Categories',
      href: '/products',
      icon: Layers,
    },
    {
      label: 'Offers',
      href: '/offers',
      icon: Tag,
      badge: 'Hot',
    },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      count: mounted ? totalWishlistItems : 0,
    },
    {
      label: user ? 'Account' : 'Sign In',
      href: user ? '/account' : '/auth/login',
      icon: User,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
                isActive
                  ? 'text-indigo-600 scale-105'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white font-black text-[8px] px-1 rounded-full uppercase">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[56px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
