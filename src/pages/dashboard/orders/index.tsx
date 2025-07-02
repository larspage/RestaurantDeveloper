import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import orderService, { Order, OrderStatus } from '../../../services/orderService';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import OrderCard from '../../../components/OrderCard';
import OrderFilters from '../../../components/OrderFilters';

const OrderDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Load user's restaurants on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await restaurantService.getUserRestaurants();
        setRestaurants(data);
        
        // Auto-select first restaurant if available
        if (data.length > 0) {
          setSelectedRestaurant(data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
        setError('Failed to load your restaurants.');
      }
    };

    fetchRestaurants();
  }, []);

  // Load orders when restaurant is selected
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedRestaurant) {
        setOrders([]);
        setFilteredOrders([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await orderService.getRestaurantActiveOrders(selectedRestaurant);
        setOrders(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders. Please try again.');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedRestaurant]);

  // Filter orders based on status and search query
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const orderId = order._id.slice(-8).toLowerCase();
        const customerName = order.guest_info?.name?.toLowerCase() || '';
        const customerPhone = order.guest_info?.phone?.toLowerCase() || '';
        
        return orderId.includes(query) || 
               customerName.includes(query) || 
               customerPhone.includes(query);
      });
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchQuery]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setIsUpdating(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      received: 0,
      confirmed: 0,
      in_kitchen: 0,
      ready_for_pickup: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const getSelectedRestaurantName = () => {
    const restaurant = restaurants.find(r => r._id === selectedRestaurant);
    return restaurant?.name || 'Select Restaurant';
  };

  // Show restaurant selection if no restaurant selected
  if (!selectedRestaurant && restaurants.length > 0) {
    return (
      <Layout title="Order Management">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select a Restaurant</h2>
              <p className="text-gray-600 mb-6">Choose which restaurant's orders you'd like to manage:</p>
              <div className="space-y-3">
                {restaurants.map((restaurant) => (
                  <button
                    key={restaurant._id}
                    onClick={() => setSelectedRestaurant(restaurant._id)}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600">{restaurant.location}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show empty state if no restaurants
  if (restaurants.length === 0 && !isLoading) {
    return (
      <Layout title="Order Management">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">No Restaurants Found</h2>
              <p className="text-gray-600 mb-6">
                You need to create a restaurant before you can manage orders.
              </p>
              <button
                onClick={() => router.push('/dashboard/restaurants/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Create Your First Restaurant
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Order Management">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Managing orders for {getSelectedRestaurantName()}</p>
          </div>
          
          {/* Restaurant Selector */}
          {restaurants.length > 1 && (
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <OrderFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          orderCount={filteredOrders.length}
        />

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedStatus !== 'all' ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters or search criteria.'
                : 'Orders will appear here when customers place them through your restaurant website.'
              }
            </p>
            {(searchQuery || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* Orders Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && orders.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{getStatusCounts().received}</p>
                <p className="text-sm text-gray-600">New Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{getStatusCounts().in_kitchen}</p>
                <p className="text-sm text-gray-600">Preparing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getStatusCounts().ready_for_pickup}</p>
                <p className="text-sm text-gray-600">Ready</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{getStatusCounts().delivered}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderDashboard; 