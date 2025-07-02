import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';
import orderService, { OrderPayload } from '../services/orderService';
import authService from '../services/authService';

const ShoppingCart = () => {
  const { cartItems, removeItem, updateItemQuantity, cartTotal, itemCount, isCartOpen, toggleCart, restaurantId, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartClasses = `fixed top-0 right-0 h-full w-80 bg-white shadow-lg p-4 transform transition-transform duration-300 ease-in-out ${
    isCartOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  const handlePlaceOrder = async () => {
    if (!restaurantId || cartItems.length === 0) {
      setError("Cannot place an empty order or cart is invalid.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const orderItems = cartItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const payload: OrderPayload = {
      restaurant_id: restaurantId,
      items: orderItems,
    };

    // For now, we assume logged-in users. Guest checkout can be added later.
    // const user = authService.getCurrentUser();
    // if (!user) {
    //   // Handle guest checkout: collect user info and add to payload.guest_info
    //   setError("Please log in to place an order.");
    //   setIsLoading(false);
    //   return;
    // }

    try {
      const newOrder = await orderService.placeOrder(payload);
      clearCart();
      router.push(`/orders/${newOrder._id}`);
    } catch (err: any) {
      console.error("Failed to place order:", err);
      setError(err.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cartClasses}>
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-2xl font-bold">Cart ({itemCount})</h2>
        <button onClick={toggleCart} className="text-gray-500 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item._id} className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(item._id, parseInt(e.target.value, 10))}
                    className="w-16 text-center border rounded"
                  />
                  <button 
                    onClick={() => removeItem(item._id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading || cartItems.length === 0}
              className="w-full bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart; 