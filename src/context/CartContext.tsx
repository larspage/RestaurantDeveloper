// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem } from '../types/Cart';
import { MenuItem, PricePoint } from '../types/MenuItem';

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: MenuItem, restaurantId: string, selectedPricePoint?: PricePoint) => void;
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

  const addItem = (item: MenuItem, newRestaurantId: string, selectedPricePoint?: PricePoint) => {
    // If cart is for a different restaurant, clear it first.
    // A more user-friendly approach would be to ask for confirmation.
    if (restaurantId && restaurantId !== newRestaurantId) {
      setCartItems([]);
      setRestaurantId(newRestaurantId);
    } else if (!restaurantId) {
      setRestaurantId(newRestaurantId);
    }
    
    // Create a unique identifier for cart items that includes price point
    const cartItemId = selectedPricePoint 
      ? `${item._id}-${selectedPricePoint.id}` 
      : item._id;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => {
        // Match by item ID and selected price point
        const existingCartItemId = i.selectedPricePoint 
          ? `${i._id}-${i.selectedPricePoint.id}` 
          : i._id;
        return existingCartItemId === cartItemId;
      });
      
      if (existingItem) {
        // Increase quantity if item with same price point already exists
        return prevItems.map(i => {
          const existingCartItemId = i.selectedPricePoint 
            ? `${i._id}-${i.selectedPricePoint.id}` 
            : i._id;
          return existingCartItemId === cartItemId 
            ? { ...i, quantity: i.quantity + 1 } 
            : i;
        });
      }
      
      // Add new item with quantity 1 and selected price point
      const cartItem: CartItem = { 
        ...item, 
        quantity: 1,
        selectedPricePoint
      };
      
      return [...prevItems, cartItem];
    });
    setIsCartOpen(true); // Open cart when item is added
  };

  const removeItem = (cartItemId: string) => {
    setCartItems(prevItems => prevItems.filter(i => {
      // Generate the same cart item ID logic for comparison
      const currentCartItemId = i.selectedPricePoint 
        ? `${i._id}-${i.selectedPricePoint.id}` 
        : i._id;
      return currentCartItemId !== cartItemId;
    }));
  };

  const updateItemQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      removeItem(cartItemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => {
          // Generate the same cart item ID logic for comparison
          const currentCartItemId = i.selectedPricePoint 
            ? `${i._id}-${i.selectedPricePoint.id}` 
            : i._id;
          return currentCartItemId === cartItemId ? { ...i, quantity: quantity } : i;
        })
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

  const cartTotal = cartItems.reduce((total, item) => {
    // Use selected price point price if available, otherwise use base price
    const effectivePrice = item.selectedPricePoint ? item.selectedPricePoint.price : item.price;
    return total + effectivePrice * item.quantity;
  }, 0);
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
