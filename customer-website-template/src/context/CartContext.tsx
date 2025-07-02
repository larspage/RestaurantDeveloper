import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, GuestCustomerInfo } from '../types/Cart';
import { MenuItem, PricePoint } from '../types/MenuItem';

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  itemCount: number;
  restaurantId: string | null;
  isCartOpen: boolean;
  guestInfo: GuestCustomerInfo | null;
  addItem: (item: MenuItem, selectedPricePoint?: PricePoint) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setRestaurantId: (id: string) => void;
  setGuestInfo: (info: GuestCustomerInfo) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [guestInfo, setGuestInfoState] = useState<GuestCustomerInfo | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('customerCart');
    const savedRestaurantId = localStorage.getItem('customerRestaurantId');
    const savedGuestInfo = localStorage.getItem('customerGuestInfo');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    
    if (savedRestaurantId) {
      setRestaurantIdState(savedRestaurantId);
    }
    
    if (savedGuestInfo) {
      try {
        setGuestInfoState(JSON.parse(savedGuestInfo));
      } catch (error) {
        console.error('Error loading guest info from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customerCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save restaurant ID to localStorage
  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem('customerRestaurantId', restaurantId);
    }
  }, [restaurantId]);

  // Save guest info to localStorage
  useEffect(() => {
    if (guestInfo) {
      localStorage.setItem('customerGuestInfo', JSON.stringify(guestInfo));
    }
  }, [guestInfo]);

  const addItem = (item: MenuItem, selectedPricePoint?: PricePoint) => {
    setCartItems(prevItems => {
      const cartItemId = selectedPricePoint 
        ? `${item._id}-${selectedPricePoint.id}` 
        : item._id;

      const existingItemIndex = prevItems.findIndex(cartItem => {
        const existingCartItemId = cartItem.selectedPricePoint 
          ? `${cartItem._id}-${cartItem.selectedPricePoint.id}` 
          : cartItem._id;
        return existingCartItemId === cartItemId;
      });

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        const cartItem: CartItem = {
          ...item,
          quantity: 1,
          selectedPricePoint
        };
        return [...prevItems, cartItem];
      }
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => {
      const cartItemId = item.selectedPricePoint 
        ? `${item._id}-${item.selectedPricePoint.id}` 
        : item._id;
      return cartItemId !== itemId;
    }));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems(prevItems => 
      prevItems.map(item => {
        const cartItemId = item.selectedPricePoint 
          ? `${item._id}-${item.selectedPricePoint.id}` 
          : item._id;
        return cartItemId === itemId ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setGuestInfoState(null);
    localStorage.removeItem('customerCart');
    localStorage.removeItem('customerGuestInfo');
  };

  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  const setRestaurantId = (id: string) => {
    if (restaurantId && restaurantId !== id) {
      clearCart();
    }
    setRestaurantIdState(id);
  };

  const setGuestInfo = (info: GuestCustomerInfo) => {
    setGuestInfoState(info);
  };

  // Calculate totals
  const cartTotal = cartItems.reduce((total, item) => {
    const effectivePrice = item.selectedPricePoint ? item.selectedPricePoint.price : item.price;
    return total + (effectivePrice * item.quantity);
  }, 0);

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextType = {
    cartItems,
    cartTotal,
    itemCount,
    restaurantId,
    isCartOpen,
    guestInfo,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    toggleCart,
    setRestaurantId,
    setGuestInfo
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 