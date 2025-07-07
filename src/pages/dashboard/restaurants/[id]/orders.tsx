import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../context/AuthContext';
import orderService, { Order, OrderStatus } from '../../../../services/orderService';
import restaurantService, { Restaurant } from '../../../../services/restaurantService';
import OrderCard from '../../../../components/OrderCard';
import OrderFilters from '../../../../components/OrderFilters';
import StatusUpdateModal from '../../../../components/StatusUpdateModal';
import NotificationToast, { useNotifications } from '../../../../components/NotificationToast';

const RestaurantOrderManagement = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalOrderId, setModalOrderId] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;
      
      try {
        const data = await restaurantService.getRestaurant(id as string);
        setRestaurant(data);
      } catch (err: any) {
        console.error('Failed to fetch restaurant:', err);
        setError('Failed to load restaurant information.');
        addNotification({
          type: 'error',
          title: 'Failed to load restaurant',
          message: 'Please check if the restaurant exists and try again.'
        });
      }
    };

    fetchRestaurant();
  }, [id]);

  // Load orders for this restaurant
  const fetchOrders = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.getRestaurantActiveOrders(id as string);
      setOrders(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders.');
      addNotification({
        type: 'error',
        title: 'Failed to load orders',
        message: err.response?.data?.message || 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and setup auto-refresh
  useEffect(() => {
    fetchOrders();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchOrders();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id, autoRefresh]);

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

  // Handle order status update
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

      addNotification({
        type: 'success',
        title: 'Order updated',
        message: `Order #${orderId.slice(-8).toUpperCase()} status changed to ${newStatus.replace('_', ' ')}.`
      });
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status.');
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.message || 'Failed to update order status.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Enhanced status update with modal
  const handleEnhancedStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setModalOrderId(orderId);
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  // Modal confirmation
  const handleModalConfirm = async (estimatedTime?: string, reason?: string) => {
    if (!modalOrderId || !pendingStatus) return;

    try {
      setIsUpdating(true);
      await orderService.updateOrderStatus(modalOrderId, pendingStatus, estimatedTime, reason);
      
      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === modalOrderId ? { ...order, status: pendingStatus } : order
        )
      );

      addNotification({
        type: 'success',
        title: 'Order updated',
        message: `Order #${modalOrderId.slice(-8).toUpperCase()} status changed to ${pendingStatus.replace('_', ' ')}.`
      });

      setShowStatusModal(false);
      setModalOrderId('');
      setPendingStatus(null);
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.message || 'Failed to update order status.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status counts for filtering
  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: orders.length,
      received: 0,
      confirmed: 0,
      in_kitchen: 0,
      ready_for_pickup: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });

    return counts;
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchOrders();
  };

  if (!restaurant && !isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Not Found</h1>
              <p className="mt-2 text-gray-600">The restaurant you're looking for doesn't exist or you don't have access to it.</p>
              <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-4">
                    <li>
                      <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <span className="text-gray-500">/</span>
                    </li>
                    <li>
                      <Link href={`/dashboard/restaurants/${id}`} className="text-gray-500 hover:text-gray-700">
                        {restaurant?.name || 'Restaurant'}
                      </Link>
                    </li>
                    <li>
                      <span className="text-gray-500">/</span>
                    </li>
                    <li className="text-gray-900">Orders</li>
                  </ol>
                </nav>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">
                  {restaurant?.name} - Order Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage incoming orders and update order status
                </p>
              </div>
              
              {/* Auto-refresh controls */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
                  </label>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <span className="text-xs text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            <OrderFilters
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              orderCount={filteredOrders.length}
            />
          </div>

          {/* Orders list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || selectedStatus !== 'all' 
                    ? 'No orders match your current filters.' 
                    : 'No orders have been placed yet.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={handleEnhancedStatusUpdate}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && modalOrderId && pendingStatus && (
          <StatusUpdateModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setModalOrderId('');
              setPendingStatus(null);
            }}
            onConfirm={handleModalConfirm}
            currentStatus={orders.find(o => o._id === modalOrderId)?.status as OrderStatus}
            newStatus={pendingStatus}
            orderNumber={modalOrderId.slice(-8).toUpperCase()}
            isLoading={isUpdating}
          />
        )}

        {/* Notifications */}
        <NotificationToast
          notifications={notifications}
          onRemove={removeNotification}
        />
      </Layout>
    </ProtectedRoute>
  );
};

export default RestaurantOrderManagement; 