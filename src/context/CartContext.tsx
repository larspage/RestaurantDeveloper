// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem } from '../types/Cart';
import { MenuItem } from '../types/MenuItem';

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: MenuItem, restaurantId: string) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  restaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    // You could potentially load cart from localStorage here
  }, []);

  const addItem = (item: MenuItem, newRestaurantId: string) => {
    // If cart is for a different restaurant, clear it first.
    // A more user-friendly approach would be to ask for confirmation.
    if (restaurantId && restaurantId !== newRestaurantId) {
      setCartItems([]);
      setRestaurantId(newRestaurantId);
    } else if (!restaurantId) {
      setRestaurantId(newRestaurantId);
    }
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i._id === item._id);
      if (existingItem) {
        // Increase quantity if item already exists
        return prevItems.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Add new item with quantity 1
      return [...prevItems, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true); // Open cart when item is added
  };

  const removeItem = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(i => i._id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      removeItem(itemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i =>
          i._id === itemId ? { ...i, quantity: quantity } : i
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
  };

  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  }

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const value = {
    cartItems,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    cartTotal,
    itemCount,
    isCartOpen,
    toggleCart,
    restaurantId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
