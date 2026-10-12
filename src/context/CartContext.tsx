"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  maxStock: number;
  color?: string;
  quality?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity' | 'maxStock'> & { quantity?: number; maxStock?: number }) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'novamobile_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    }
  }, [items, isLoaded]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addItem = (item: Omit<CartItem, 'quantity' | 'maxStock'> & { quantity?: number; maxStock?: number }) => {
    const qty = item.quantity || 1;
    const maxStock = item.maxStock !== undefined ? item.maxStock : 999;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );

      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        const newQty = Math.min(existing.quantity + qty, maxStock);
        if (newQty === existing.quantity && existing.quantity >= maxStock) {
          toast.error(`Maximum available stock (${maxStock}) reached for this item.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...existing, quantity: newQty };
        toast.success(`Updated ${item.name} quantity to ${newQty} in cart`);
        return updated;
      }

      toast.success(`Added ${item.name} to cart`);
      return [
        ...prev,
        {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: Math.min(qty, maxStock),
          maxStock,
          color: item.color,
          quality: item.quality,
        },
      ];
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.productId === productId && i.variantId === variantId);
      if (removed) {
        toast.info(`Removed ${removed.name} from cart`);
      }
      return prev.filter((i) => !(i.productId === productId && i.variantId === variantId));
    });
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantId === variantId) {
          const newQty = Math.min(quantity, i.maxStock || 999);
          return { ...i, quantity: newQty };
        }
        return i;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
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
