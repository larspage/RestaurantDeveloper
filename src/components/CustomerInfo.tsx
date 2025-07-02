import React from 'react';
import { Order } from '../services/orderService';

interface CustomerInfoProps {
  order: Order;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({ order }) => {
  const getCustomerName = () => {
    if (order.guest_info?.name) {
      return order.guest_info.name;
    }
    return 'Customer';
  };

  const getCustomerPhone = () => {
    if (order.guest_info?.phone) {
      return order.guest_info.phone;
    }
    return null;
  };

  const getCustomerEmail = () => {
    if (order.guest_info?.email) {
      return order.guest_info.email;
    }
    return null;
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{getCustomerName()}</p>
          <p className="text-sm text-gray-500">Customer</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        {/* Phone Number */}
        {getCustomerPhone() && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {formatPhoneNumber(getCustomerPhone()!)}
              </p>
              <div className="flex space-x-2 mt-1">
                <a
                  href={`tel:${getCustomerPhone()}`}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  Call
                </a>
                <a
                  href={`sms:${getCustomerPhone()}`}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Text
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        {getCustomerEmail() && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{getCustomerEmail()}</p>
              <a
                href={`mailto:${getCustomerEmail()}`}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Send Email
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Order Type */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Order Type:</span>
          <span className="text-sm font-medium text-gray-900">
            {order.customer ? 'Registered Customer' : 'Guest Order'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {getCustomerPhone() && (
            <a
              href={`tel:${getCustomerPhone()}`}
              className="flex items-center justify-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          
          {getCustomerEmail() && (
            <a
              href={`mailto:${getCustomerEmail()}?subject=Regarding Order #${order._id.slice(-8).toUpperCase()}`}
              className="flex items-center justify-center px-3 py-2 border border-purple-300 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo; 