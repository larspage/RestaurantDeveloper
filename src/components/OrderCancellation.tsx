import React, { useState } from 'react';
import { Order } from '../services/orderService';

interface OrderCancellationProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

const OrderCancellation: React.FC<OrderCancellationProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');

  const presetReasons = [
    'Customer requested cancellation',
    'Item(s) unavailable',
    'Kitchen issue - unable to prepare',
    'Delivery/pickup issue',
    'Payment issue',
    'Restaurant closing early',
    'Technical issue',
    'Other'
  ];

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedPresetReason('');
    }
  }, [isOpen]);

  const handlePresetReasonSelect = (presetReason: string) => {
    setSelectedPresetReason(presetReason);
    if (presetReason === 'Other') {
      setReason('');
    } else {
      setReason(presetReason);
    }
  };

  const handleConfirm = async () => {
    const finalReason = reason.trim();
    if (!finalReason) return;

    try {
      await onConfirm(finalReason);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const isConfirmDisabled = () => {
    return isLoading || !reason.trim();
  };

  const getCustomerName = () => {
    return order.guest_info?.name || 'Customer';
  };

  const getOrderTotal = () => {
    return order.total_price.toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cancel Order
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Order #{order._id.slice(-8).toUpperCase()} • {getCustomerName()} • ${getOrderTotal()}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="text-red-800 font-medium">Cancelling this order</p>
                <p className="text-red-700 mt-1">
                  This action cannot be undone. The customer may be notified of the cancellation and the reason provided.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                  <span className="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>${getOrderTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a reason for cancellation:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presetReasons.map((presetReason) => (
                <button
                  key={presetReason}
                  onClick={() => handlePresetReasonSelect(presetReason)}
                  className={`text-left px-3 py-2 rounded-md border transition-colors ${
                    selectedPresetReason === presetReason
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {presetReason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          <div className="mb-4">
            <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPresetReason === 'Other' ? 'Please specify:' : 'Additional details (optional):'}
            </label>
            <textarea
              id="customReason"
              value={selectedPresetReason === 'Other' ? reason : (selectedPresetReason ? '' : reason)}
              onChange={(e) => {
                if (selectedPresetReason === 'Other' || !selectedPresetReason) {
                  setReason(e.target.value);
                }
              }}
              placeholder={selectedPresetReason === 'Other' 
                ? 'Please provide a specific reason...' 
                : 'Add any additional details about the cancellation...'
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={Boolean(selectedPresetReason && selectedPresetReason !== 'Other')}
            />
          </div>

          {/* Customer Communication Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Customer Communication</p>
                <p className="text-blue-700">
                  Consider calling the customer to explain the cancellation and apologize for any inconvenience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-md transition-colors"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCancellation; 