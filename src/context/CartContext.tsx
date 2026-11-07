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

const getCartStorageKey = (userId?: string | null) =>
  userId ? `shopsphere_cart_${userId}` : 'shopsphere_cart_guest';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const isLoadedRef = useRef(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const activeUserIdRef = useRef<string | null>(null);

  // Load cart from user-scoped localStorage upon mount or user change
  useEffect(() => {
    const currentKey = getCartStorageKey(user?.id);
    activeUserIdRef.current = user?.id || null;

    try {
      const saved = localStorage.getItem(currentKey);
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

  // Sync to user-scoped localStorage whenever items change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const currentKey = getCartStorageKey(user?.id);
    try {
      localStorage.setItem(currentKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, user?.id]);

  // Handle Authentication / Session cart loading
  useEffect(() => {
    let isMounted = true;

    async function syncSessionCart() {
      if (!user) {
        setItems([]);
        return;
      }

      setIsLoading(true);
      try {
        const serverRes = await getServerCartAction();
        if (isMounted && serverRes.success && serverRes.items) {
          setItems(serverRes.items);
          if (serverRes.warnings && serverRes.warnings.length > 0) {
            setWarnings((prev) => [...prev, ...serverRes.warnings]);
          }
        }
      } catch {
        // fallback to existing items
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    syncSessionCart();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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
