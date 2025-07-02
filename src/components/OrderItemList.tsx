import React from 'react';
import { OrderItem } from '../services/orderService';

interface OrderItemListProps {
  items: OrderItem[];
}

const OrderItemList: React.FC<OrderItemListProps> = ({ items }) => {
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{item.name}</h4>
            
            {/* Price Point Information */}
            {item.modifications && item.modifications.length > 0 && (
              <div className="mt-1">
                {item.modifications.map((mod, modIndex) => (
                  <span key={modIndex} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">
                    {mod}
                  </span>
                ))}
              </div>
            )}
            
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span>Quantity: {item.quantity}</span>
              <span>Price: ${item.price.toFixed(2)} each</span>
            </div>
          </div>
          
          <div className="text-right ml-4">
            <p className="text-lg font-bold text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {item.quantity}x ${item.price.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>{items.length} item{items.length !== 1 ? 's' : ''}</p>
            <p>Total quantity: {items.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="text-2xl font-bold text-green-600">
              ${getTotalPrice().toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItemList; 