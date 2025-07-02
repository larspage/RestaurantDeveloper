import React, { useState } from 'react';
import Link from 'next/link';
import { Order, OrderStatus } from '../services/orderService';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  isUpdating?: boolean;
  isSelected?: boolean;
  onSelect?: (orderId: string, selected: boolean) => void;
  showSelection?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  isUpdating = false,
  isSelected = false,
  onSelect,
  showSelection = false
}) => {
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getCustomerName = () => {
    if (order.guest_info?.name) {
      return order.guest_info.name;
    }
    return 'Customer';
  };

  const getCustomerContact = () => {
    if (order.guest_info?.phone) {
      return order.guest_info.phone;
    }
    return '';
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'received':
        return 'confirmed';
      case 'confirmed':
        return 'in_kitchen';
      case 'in_kitchen':
        return 'ready_for_pickup';
      case 'ready_for_pickup':
        return 'delivered';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: OrderStatus): string => {
    const nextStatus = getNextStatus(currentStatus);
    switch (nextStatus) {
      case 'confirmed':
        return 'Confirm Order';
      case 'in_kitchen':
        return 'Start Preparing';
      case 'ready_for_pickup':
        return 'Mark Ready';
      case 'delivered':
        return 'Complete Order';
      default:
        return '';
    }
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(order.status as OrderStatus);
    if (!nextStatus) return;

    setIsStatusUpdating(true);
    try {
      await onStatusUpdate(order._id, nextStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const canUpdateStatus = () => {
    return getNextStatus(order.status as OrderStatus) !== null;
  };

  const getElapsedTime = () => {
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(order._id, e.target.checked);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3">
          {showSelection && onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)} • {getElapsedTime()}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      {/* Customer Info */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900">{getCustomerName()}</p>
        {getCustomerContact() && (
          <p className="text-sm text-gray-600">{getCustomerContact()}</p>
        )}
      </div>

      {/* Order Summary */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </span>
          <span className="text-lg font-bold text-gray-900">
            ${order.total_price.toFixed(2)}
          </span>
        </div>
        
        {/* Show first few items */}
        <div className="text-sm text-gray-600">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-xs text-gray-500 mt-1">
              +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      {order.notes && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions:</p>
          <p className="text-sm text-yellow-700">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/dashboard/orders/${order._id}`}>
          <span className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer">
            View Details
          </span>
        </Link>
        
        {canUpdateStatus() && (
          <button
            onClick={handleStatusUpdate}
            disabled={isStatusUpdating || isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            {isStatusUpdating ? 'Updating...' : getNextStatusLabel(order.status as OrderStatus)}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 