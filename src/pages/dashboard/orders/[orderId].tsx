import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import orderService, { Order, OrderStatus } from '../../../services/orderService';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import OrderStatusBadge from '../../../components/OrderStatusBadge';
import OrderTimeline from '../../../components/OrderTimeline';
import OrderItemList from '../../../components/OrderItemList';
import CustomerInfo from '../../../components/CustomerInfo';
import PrintOrderButton from '../../../components/PrintOrderButton';
import StatusUpdateModal from '../../../components/StatusUpdateModal';
import OrderCancellation from '../../../components/OrderCancellation';
import NotificationToast, { useNotifications } from '../../../components/NotificationToast';

const OrderDetailView = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states for enhanced status management
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();
  const { orderId } = router.query;
  const { notifications, addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const fetchOrderAndRestaurant = async () => {
      if (!orderId || typeof orderId !== 'string') return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch order details
        const orderData = await orderService.getOrder(orderId);
        setOrder(orderData);

        // Fetch restaurant details
        const restaurantData = await restaurantService.getRestaurant(orderData.restaurant);
        setRestaurant(restaurantData);
      } catch (err: any) {
        console.error('Failed to fetch order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderAndRestaurant();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);
    
    if (newStatus === 'cancelled') {
      setShowCancellationModal(true);
    } else {
      setShowStatusModal(true);
    }
  };

  // Enhanced status update with modal confirmation
  const handleModalConfirm = async (estimatedTime?: string, reason?: string) => {
    if (!order || !pendingStatus) return;

    try {
      setIsUpdating(true);
      const updatedOrder = await orderService.updateOrderStatus(order._id, pendingStatus, estimatedTime, reason);
      setOrder(updatedOrder);
      
      addNotification({
        type: 'success',
        title: 'Order updated',
        message: `Order status changed to ${pendingStatus.replace('_', ' ')}.`
      });

      setShowStatusModal(false);
      setPendingStatus(null);
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

  const handleCancelOrder = async (reason: string) => {
    if (!order) return;

    try {
      setIsUpdating(true);
      const updatedOrder = await orderService.cancelOrder(order._id, reason);
      setOrder(updatedOrder);
      
      addNotification({
        type: 'success',
        title: 'Order cancelled',
        message: 'Order has been successfully cancelled.'
      });

      setShowCancellationModal(false);
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order.');
      addNotification({
        type: 'error',
        title: 'Cancellation failed',
        message: err.response?.data?.message || 'Failed to cancel order.'
      });
    } finally {
      setIsUpdating(false);
    }
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

  const canUpdateStatus = (status: OrderStatus) => {
    return getNextStatus(status) !== null;
  };

  const canCancelOrder = (status: OrderStatus) => {
    return ['received', 'confirmed'].includes(status);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getElapsedTime = () => {
    if (!order) return '';
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
  };

  if (isLoading) {
    return (
      <Layout title="Order Details">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order || !restaurant) {
    return (
      <Layout title="Order Details">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error || 'Order not found'}
          </div>
          <Link href="/dashboard/orders">
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer">← Back to Orders</span>
          </Link>
        </div>
      </Layout>
    );
  }

  const orderDateTime = formatDateTime(order.createdAt);

  return (
    <Layout title={`Order #${order._id.slice(-8).toUpperCase()}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <Link href="/dashboard/orders">
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer mb-2 inline-block">
                ← Back to Orders
              </span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600 mt-1">
              {restaurant.name} • {orderDateTime.date} at {orderDateTime.time} • {getElapsedTime()}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <OrderStatusBadge status={order.status as OrderStatus} className="text-sm" />
            <PrintOrderButton order={order} restaurant={restaurant} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <OrderItemList items={order.items} />
              
              {/* Order Total */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${order.total_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <OrderTimeline order={order} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <CustomerInfo order={order} />
            </div>

            {/* Order Actions */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Next Status Button */}
                {canUpdateStatus(order.status as OrderStatus) && (
                  <button
                    onClick={() => handleStatusUpdate(getNextStatus(order.status as OrderStatus)!)}
                    disabled={isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isUpdating ? 'Updating...' : getNextStatusLabel(order.status as OrderStatus)}
                  </button>
                )}

                {/* Cancel Order Button */}
                {canCancelOrder(order.status as OrderStatus) && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isUpdating}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isUpdating ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}

                {/* Print Order Button */}
                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Print Order
                </button>

                {/* Contact Customer Button */}
                {order.guest_info?.phone && (
                  <a
                    href={`tel:${order.guest_info.phone}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors text-center block"
                  >
                    Call Customer
                  </a>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-green-600">${order.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showStatusModal && order && pendingStatus && (
          <StatusUpdateModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setPendingStatus(null);
            }}
            onConfirm={handleModalConfirm}
            currentStatus={order.status as OrderStatus}
            newStatus={pendingStatus}
            orderNumber={order._id.slice(-8).toUpperCase()}
            isLoading={isUpdating}
          />
        )}

        {showCancellationModal && order && (
          <OrderCancellation
            order={order}
            isOpen={showCancellationModal}
            onClose={() => setShowCancellationModal(false)}
            onConfirm={handleCancelOrder}
            isLoading={isUpdating}
          />
        )}

        {/* Notifications */}
        <NotificationToast
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    </Layout>
  );
};

export default OrderDetailView; 