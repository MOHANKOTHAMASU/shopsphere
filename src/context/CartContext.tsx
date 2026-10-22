'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Product, CartItem, CartValidationResult } from '@/types/ecommerce';
import { useAuth } from '@/context/AuthContext';
import {
  getServerCartAction,
  syncCartItemAction,
  removeCartItemAction,
  clearServerCartAction,
  mergeCartAction,
  revalidateCartAction,
} from '@/lib/cart/actions';

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    variantId?: string,
    variantTitle?: string,
    variantAttributes?: Record<string, string>
  ) => { success: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  revalidateCart: (couponCode?: string) => Promise<CartValidationResult>;
  totalItems: number;
  subtotal: number;
  totalSavings: number;
  isLoading: boolean;
  warnings: string[];
  clearWarnings: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'shopsphere_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const isLoadedRef = useRef(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const hasMergedUserRef = useRef<string | null>(null);

  // Hydration-safe initial load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => setItems(parsed));
      }
    } catch {
      // ignore JSON parse error
    }
    isLoadedRef.current = true;
  }, []);

  // Sync to localStorage whenever items change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  // Handle Authentication / Session cart loading & merging
  useEffect(() => {
    async function syncSessionCart() {
      if (!user) {
        hasMergedUserRef.current = null;
        return;
      }

      // Prevent duplicate merge runs for the same user session
      if (hasMergedUserRef.current === user.id) return;
      hasMergedUserRef.current = user.id;

      setIsLoading(true);
      try {
        // Check if there are local anonymous items to merge
        let localItems: CartItem[] = [];
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) localItems = JSON.parse(raw);
        } catch {
          // ignore
        }

        if (localItems.length > 0) {
          const payload = localItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          }));

          const mergeRes = await mergeCartAction(payload);
          if (mergeRes.success && mergeRes.items) {
            setItems(mergeRes.items);
            if (mergeRes.warnings && mergeRes.warnings.length > 0) {
              setWarnings((prev) => [...prev, ...mergeRes.warnings]);
            }
          }
        } else {
          // Fetch existing server cart
          const serverRes = await getServerCartAction();
          if (serverRes.success && serverRes.items) {
            setItems(serverRes.items);
            if (serverRes.warnings && serverRes.warnings.length > 0) {
              setWarnings((prev) => [...prev, ...serverRes.warnings]);
            }
          }
        }
      } catch {
        // fallback to existing items
      } finally {
        setIsLoading(false);
      }
    }

    syncSessionCart();
  }, [user]);

  /**
   * Add a product to cart (with optional variant selection)
   * Validates stock limits and prevents adding out-of-stock items.
   */
  const addToCart = (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    variantTitle?: string,
    variantAttributes?: Record<string, string>
  ): { success: boolean; message?: string } => {
    // 1. Determine variant pricing and stock if applicable
    let unitPrice = product.price;
    let compareAtPrice = product.compareAtPrice || product.price;
    let maxStock = product.stockQuantity;
    let title = variantTitle;
    let attrs = variantAttributes;

    if (variantId && product.variants && product.variants.length > 0) {
      const foundVariant = product.variants.find((v) => v.id === variantId);
      if (foundVariant) {
        unitPrice = foundVariant.price;
        compareAtPrice = foundVariant.compareAtPrice || foundVariant.price;
        maxStock = foundVariant.stockQuantity;
        title = title || foundVariant.title;
        attrs = attrs || foundVariant.attributes;
      }
    }

    // 2. Prevent adding out-of-stock product
    if (maxStock <= 0) {
      return { success: false, message: 'This item is currently out of stock.' };
    }

    const itemKey = `cart-${product.id}${variantId ? '-' + variantId : ''}`;
    let addedQuantity = quantity;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.productId === product.id && i.variantId === variantId
      );

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex];
        const newTotalQty = Math.min(existing.quantity + quantity, maxStock);
        addedQuantity = newTotalQty - existing.quantity;

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existing,
          quantity: newTotalQty,
          unitPrice,
          compareAtPrice,
          maxStock,
        };
        return updated;
      }

      // Add new item
      const initialQty = Math.min(quantity, maxStock);
      addedQuantity = initialQty;

      return [
        ...prevItems,
        {
          id: itemKey,
          productId: product.id,
          variantId,
          variantTitle: title,
          variantAttributes: attrs,
          product,
          quantity: initialQty,
          unitPrice,
          compareAtPrice,
          maxStock,
        },
      ];
    });

    // 3. Persist to server if user is authenticated
    if (user) {
      syncCartItemAction({
        productId: product.id,
        variantId,
        quantity: addedQuantity,
      }).catch(() => {
        // background sync
      });
    }

    return { success: true };
  };

  /**
   * Increase or decrease item quantity
   */
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          const clamped = Math.min(quantity, item.maxStock);

          if (user) {
            syncCartItemAction({
              productId: item.productId,
              variantId: item.variantId,
              quantity: clamped,
            }).catch(() => {});
          }

          return { ...item, quantity: clamped };
        }
        return item;
      });
    });
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (itemId: string) => {
    setItems((prevItems) => {
      const target = prevItems.find((i) => i.id === itemId);
      if (target && user) {
        removeCartItemAction({
          productId: target.productId,
          variantId: target.variantId,
        }).catch(() => {});
      }
      return prevItems.filter((i) => i.id !== itemId);
    });
  };

  /**
   * Clear all items in cart
   */
  const clearCart = () => {
    setItems([]);
    if (user) {
      clearServerCartAction().catch(() => {});
    }
  };

  /**
   * Server-side revalidation of stock and prices before checkout
   */
  const revalidateCart = useCallback(
    async (couponCode?: string): Promise<CartValidationResult> => {
      setIsLoading(true);
      try {
        const payload = items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        }));

        const result = await revalidateCartAction(payload, couponCode);

        if (result.hasChanges) {
          setItems(result.items);
        }

        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }

        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [items]
  );

  const clearWarnings = () => setWarnings([]);

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalSavings = items.reduce((sum, item) => {
    const compare = item.compareAtPrice || item.unitPrice;
    return sum + Math.max(0, compare - item.unitPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        revalidateCart,
        totalItems,
        subtotal,
        totalSavings,
        isLoading,
        warnings,
        clearWarnings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
