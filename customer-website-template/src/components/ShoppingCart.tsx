import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import CustomerInfoForm from './CustomerInfoForm';
import { GuestCustomerInfo } from '@/types/Cart';
import { OrderPayload } from '@/types/Order';
import orderService from '@/services/orderService';

const ShoppingCart: React.FC = () => {
  const { 
    cartItems, 
    cartTotal, 
    itemCount, 
    isCartOpen, 
    toggleCart, 
    removeItem, 
    updateItemQuantity,
    guestInfo,
    setGuestInfo,
    clearCart,
    restaurantId
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartClasses = `fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
    isCartOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setShowCheckout(true);
    setError(null);
  };

  const handleBackToCart = () => {
    setShowCheckout(false);
  };

  const handlePlaceOrder = async (customerInfo: GuestCustomerInfo) => {
    if (!restaurantId || cartItems.length === 0) {
      setError("Cannot place an empty order or restaurant not configured.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      setGuestInfo(customerInfo);
      
      const orderItems = cartItems.map(item => {
        const effectivePrice = item.selectedPricePoint ? item.selectedPricePoint.price : item.price;
        
        return {
          name: item.name,
          price: effectivePrice,
          quantity: item.quantity,
          pricePointName: item.selectedPricePoint?.name,
        };
      });

      const payload: OrderPayload = {
        restaurant_id: restaurantId,
        items: orderItems,
        guest_info: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        special_instructions: customerInfo.specialInstructions
      };

      const newOrder = await orderService.placeOrder(payload);
      clearCart();
      setShowCheckout(false);
      toggleCart();
      
      // Navigate to order confirmation page
      window.location.href = `/orders/${newOrder._id}`;
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCartOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={toggleCart}
      />
      
      {/* Cart Panel */}
      <div className={cartClasses}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">
              {showCheckout ? 'Checkout' : `Cart (${itemCount})`}
            </h2>
            <button 
              onClick={toggleCart} 
              className="text-gray-500 hover:text-gray-800 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {showCheckout ? (
              <CustomerInfoForm
                onSubmit={handlePlaceOrder}
                onCancel={handleBackToCart}
                initialInfo={guestInfo || undefined}
                isLoading={isLoading}
              />
            ) : (
              <>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-2">Add some delicious items to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(item => {
                      const cartItemId = item.selectedPricePoint 
                        ? `${item._id}-${item.selectedPricePoint.id}` 
                        : item._id;
                      
                      const effectivePrice = item.selectedPricePoint ? item.selectedPricePoint.price : item.price;
                      
                      return (
                        <div key={cartItemId} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              {item.selectedPricePoint && (
                                <p className="text-sm text-blue-600 font-medium">
                                  {item.selectedPricePoint.name}
                                </p>
                              )}
                              <p className="text-lg font-bold text-green-600">
                                ${effectivePrice.toFixed(2)} each
                              </p>
                            </div>
                            <button 
                              onClick={() => removeItem(cartItemId)} 
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateItemQuantity(cartItemId, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="font-semibold text-lg">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(cartItemId, item.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${(effectivePrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!showCheckout && cartItems.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-green-600">${cartTotal.toFixed(2)}</span>
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
              )}
              
              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShoppingCart; 