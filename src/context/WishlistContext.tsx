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

const LOCAL_STORAGE_KEY = 'shopsphere_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const isLoadedRef = useRef(false);
  const syncedUserRef = useRef<string | null>(null);

  // Hydration-safe initial load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore JSON errors
    }
    isLoadedRef.current = true;
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore errors
    }
  }, [items]);

  // Sync with database when user logs in
  useEffect(() => {
    async function syncWishlist() {
      if (!user) {
        syncedUserRef.current = null;
        return;
      }

      if (syncedUserRef.current === user.id) return;
      syncedUserRef.current = user.id;

      try {
        const res = await getServerWishlistAction();
        if (res.success && res.products) {
          setItems((prev) => {
            const combinedMap = new Map<string, Product>();
            // Add server items first
            res.products.forEach((p) => combinedMap.set(p.id, p));
            // Add any local items
            prev.forEach((p) => {
              if (!combinedMap.has(p.id)) {
                combinedMap.set(p.id, p);
                // Also persist to server in background
                toggleWishlistItemAction(p.id).catch(() => {});
              }
            });
            return Array.from(combinedMap.values());
          });
        }
      } catch {
        // fallback
      }
    }

    syncWishlist();
  }, [user]);

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
