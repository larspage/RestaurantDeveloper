import React from 'react';
import { useCart } from '../context/CartContext';

const CartButton: React.FC = () => {
  const { itemCount, cartTotal, toggleCart } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <button
      onClick={toggleCart}
      className="fixed bottom-6 right-6 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 z-30"
    >
      <div className="flex items-center space-x-3 px-6 py-3">
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">View Cart</div>
          <div className="text-lg font-bold">${cartTotal.toFixed(2)}</div>
        </div>
      </div>
    </button>
  );
};

export default CartButton; 