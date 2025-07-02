import React, { useState } from 'react';
import { OrderStatus } from '../services/orderService';
import OrderStatusBadge from './OrderStatusBadge';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (estimatedTime?: string, reason?: string) => void;
  currentStatus: OrderStatus;
  newStatus: OrderStatus;
  orderNumber: string;
  isLoading?: boolean;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  orderNumber,
  isLoading = false
}) => {
  const [estimatedTime, setEstimatedTime] = useState('');
  const [reason, setReason] = useState('');
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setEstimatedTime('');
      setReason('');
      
      // Show time input for certain status changes
      setShowTimeInput(newStatus === 'confirmed' || newStatus === 'in_kitchen');
      
      // Show reason input for cancellation
      setShowReasonInput(newStatus === 'cancelled');
    }
  }, [isOpen, newStatus]);

  const getStatusChangeDescription = () => {
    switch (newStatus) {
      case 'confirmed':
        return 'Confirm this order and notify the kitchen to start preparation.';
      case 'in_kitchen':
        return 'Mark this order as being prepared in the kitchen.';
      case 'ready_for_pickup':
        return 'Mark this order as ready for customer pickup.';
      case 'delivered':
        return 'Mark this order as completed and delivered to the customer.';
      case 'cancelled':
        return 'Cancel this order. Please provide a reason for cancellation.';
      default:
        return `Update order status to ${newStatus.replace('_', ' ')}.`;
    }
  };

  const getTimeEstimateLabel = () => {
    switch (newStatus) {
      case 'confirmed':
        return 'Estimated preparation time (optional)';
      case 'in_kitchen':
        return 'Estimated ready time (optional)';
      default:
        return 'Estimated time (optional)';
    }
  };

  const getTimeEstimatePlaceholder = () => {
    switch (newStatus) {
      case 'confirmed':
        return 'e.g., 15 minutes, 30 min, 1 hour';
      case 'in_kitchen':
        return 'e.g., 10 minutes, 20 min';
      default:
        return 'e.g., 15 minutes';
    }
  };

  const handleConfirm = () => {
    const trimmedTime = estimatedTime.trim();
    const trimmedReason = reason.trim();
    
    onConfirm(
      showTimeInput && trimmedTime ? trimmedTime : undefined,
      showReasonInput && trimmedReason ? trimmedReason : undefined
    );
  };

  const isConfirmDisabled = () => {
    if (isLoading) return true;
    if (showReasonInput && !reason.trim()) return true;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Status Update
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Order #{orderNumber}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Status Change Visualization */}
          <div className="flex items-center space-x-3 mb-4">
            <OrderStatusBadge status={currentStatus} />
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <OrderStatusBadge status={newStatus} />
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-4">
            {getStatusChangeDescription()}
          </p>

          {/* Time Estimate Input */}
          {showTimeInput && (
            <div className="mb-4">
              <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-2">
                {getTimeEstimateLabel()}
              </label>
              <input
                type="text"
                id="estimatedTime"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder={getTimeEstimatePlaceholder()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will help customers know when to expect their order.
              </p>
            </div>
          )}

          {/* Reason Input for Cancellation */}
          {showReasonInput && (
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be logged and may be shared with the customer.
              </p>
            </div>
          )}

          {/* Warning for Cancellation */}
          {newStatus === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <p className="text-red-800 font-medium">Warning: This action cannot be undone</p>
                  <p className="text-red-700">Cancelling this order will notify the customer and update your records.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              newStatus === 'cancelled'
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            }`}
          >
            {isLoading ? 'Updating...' : 'Confirm Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal; 