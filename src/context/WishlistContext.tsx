'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product } from '@/types/ecommerce';
import { useAuth } from '@/context/AuthContext';
import {
  getServerWishlistAction,
  toggleWishlistItemAction,
} from '@/lib/cart/actions';

interface WishlistContextType {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  totalWishlistItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const getWishlistStorageKey = (userId?: string | null) =>
  userId ? `shopsphere_wishlist_${userId}` : 'shopsphere_wishlist_guest';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const isLoadedRef = useRef(false);

  // Load wishlist from account-scoped localStorage upon mount or user change
  useEffect(() => {
    const key = getWishlistStorageKey(user?.id);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    isLoadedRef.current = true;
  }, [user?.id]);

  // Sync to account-scoped localStorage whenever items change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const key = getWishlistStorageKey(user?.id);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // ignore errors
    }
  }, [items, user?.id]);

  // Sync with database when user logs in
  useEffect(() => {
    let isMounted = true;

    async function syncWishlist() {
      if (!user) {
        setItems([]);
        return;
      }

      try {
        const res = await getServerWishlistAction();
        if (isMounted && res.success && res.products) {
          setItems(res.products);
        }
      } catch {
        // fallback
      }
    }

    syncWishlist();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const toggleWishlist = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        if (user) {
          toggleWishlistItemAction(product.id).catch(() => {});
        }
        return prev.filter((item) => item.id !== product.id);
      } else {
        if (user) {
          toggleWishlistItemAction(product.id).catch(() => {});
        }
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        toggleWishlist,
        isInWishlist,
        totalWishlistItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
