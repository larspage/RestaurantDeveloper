import React from 'react';
import { Order, OrderStatus } from '../services/orderService';

interface OrderTimelineProps {
  order: Order;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const getStatusSteps = () => {
    const allSteps = [
      { status: 'received', label: 'Order Received', icon: '📝' },
      { status: 'confirmed', label: 'Order Confirmed', icon: '✅' },
      { status: 'in_kitchen', label: 'Preparing', icon: '👨‍🍳' },
      { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: '🛍️' },
      { status: 'delivered', label: 'Completed', icon: '🎉' }
    ];

    const currentStatusIndex = allSteps.findIndex(step => step.status === order.status);
    
    return allSteps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentStatusIndex,
      isCurrent: index === currentStatusIndex,
      timestamp: index === 0 ? order.createdAt : null // For now, only show creation time
    }));
  };

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
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const steps = getStatusSteps();

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.status}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span
                  className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                    step.isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-sm ${
                      step.isCompleted
                        ? step.isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.isCompleted ? (
                      step.isCurrent ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div>
                    <p className={`text-sm font-medium ${
                      step.isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <p className="text-sm text-gray-500">
                        {formatDate(step.timestamp)} at {formatTime(step.timestamp)}
                      </p>
                    )}
                    {step.isCurrent && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <p className="text-xs text-blue-600 mt-1">Current status</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Cancelled Status */}
      {order.status === 'cancelled' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">❌</span>
            <div>
              <p className="text-sm font-medium text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-600">This order has been cancelled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline; 