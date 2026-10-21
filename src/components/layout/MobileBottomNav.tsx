'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  // Hide mobile bottom nav on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home, active: pathname === '/' },
    { label: 'Shop', href: '/products', icon: Layers, active: pathname.startsWith('/products') },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      active: pathname === '/wishlist',
      badge: totalWishlistItems,
    },
    {
      label: 'Cart',
      href: '/cart',
      icon: ShoppingBag,
      active: pathname === '/cart',
      badge: totalItems,
    },
    {
      label: 'Account',
      href: user ? '/account' : '/auth/login',
      icon: User,
      active: pathname.startsWith('/account') || pathname.startsWith('/auth'),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-center relative transition-colors',
                item.active ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
