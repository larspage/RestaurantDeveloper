import React from 'react';
import { OrderStatus } from '../services/orderService';

interface OrderFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  orderCount: number;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  selectedCount?: number;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  orderCount,
  showSelectAll = false,
  onSelectAll,
  selectedCount = 0
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Orders', count: 0 },
    { value: 'received', label: 'New Orders', count: 0 },
    { value: 'confirmed', label: 'Confirmed', count: 0 },
    { value: 'in_kitchen', label: 'Preparing', count: 0 },
    { value: 'ready_for_pickup', label: 'Ready', count: 0 },
    { value: 'delivered', label: 'Completed', count: 0 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search and Count */}
        <div className="flex items-center gap-4">
          {/* Select All Button */}
          {showSelectAll && onSelectAll && (
            <button
              onClick={onSelectAll}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
            >
              Select All ({orderCount})
            </button>
          )}

          {/* Order Count */}
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {showSelectAll && selectedCount > 0 
              ? `${selectedCount} of ${orderCount} selected` 
              : `${orderCount} order${orderCount !== 1 ? 's' : ''}`
            }
          </span>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh orders"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-full"></div>
          <span>New orders need confirmation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded-full"></div>
          <span>Orders being prepared</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-full"></div>
          <span>Ready for pickup</span>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters; 