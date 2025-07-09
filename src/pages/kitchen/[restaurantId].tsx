import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Order, OrderStatus } from '../../services/orderService';
import orderService from '../../services/orderService';

interface KitchenOrder extends Order {
  elapsedTime: number;
  isOverdue: boolean;
  estimatedCompletionTime: Date;
}

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();
  const { restaurantId } = router.query;

  // Audio alert for new orders
  const playNewOrderAlert = () => {
    if (audioEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Calculate order timing information
  const calculateOrderTiming = (order: Order): KitchenOrder => {
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const elapsedTime = Math.floor((now.getTime() - orderTime.getTime()) / 1000 / 60); // minutes
    
    // Estimate completion time based on order complexity
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTime = 15; // base 15 minutes
    const itemTime = itemCount * 3; // 3 minutes per item
    const estimatedMinutes = baseTime + itemTime;
    
    const estimatedCompletionTime = new Date(orderTime.getTime() + estimatedMinutes * 60000);
    const isOverdue = now > estimatedCompletionTime && order.status !== 'completed';

    return {
      ...order,
      elapsedTime,
      isOverdue,
      estimatedCompletionTime
    };
  };

  // Fetch kitchen orders
  const fetchKitchenOrders = async () => {
    if (!restaurantId) return;

    try {
      setIsConnected(true);
      const response = await orderService.getRestaurantOrders(restaurantId as string);
      
      // Filter to show only active kitchen orders
      const activeOrders = response.filter((order: Order) => 
        ['received', 'confirmed', 'in_kitchen'].includes(order.status)
      );

      const kitchenOrders = activeOrders.map(calculateOrderTiming);
      
      // Check for new orders and play alert
      if (kitchenOrders.length > lastOrderCount && lastOrderCount > 0) {
        playNewOrderAlert();
        // Flash screen for visual alert
        document.body.style.backgroundColor = '#fef3c7';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 500);
      }
      
      setOrders(kitchenOrders);
      setLastOrderCount(kitchenOrders.length);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
      setError('Connection failed - retrying...');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      await fetchKitchenOrders(); // Refresh orders
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status');
    }
  };

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchKitchenOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [restaurantId, autoRefresh, lastOrderCount]);

  // Current time timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Recalculate order timing
      setOrders(prevOrders => prevOrders.map(calculateOrderTiming));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    fetchKitchenOrders();
  }, [restaurantId]);

  // Get priority color for order cards
  const getPriorityColor = (order: KitchenOrder) => {
    if (order.isOverdue) return 'bg-red-100 border-red-500';
    if (order.elapsedTime > 20) return 'bg-orange-100 border-orange-500';
    if (order.elapsedTime > 10) return 'bg-yellow-100 border-yellow-500';
    return 'bg-green-100 border-green-500';
  };

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'bg-blue-500 text-white';
      case 'confirmed': return 'bg-yellow-500 text-white';
      case 'in_kitchen': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-2xl font-semibold">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="kitchen-display-container">
      {/* Audio element for new order alerts */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/new-order.mp3" type="audio/mpeg" />
        <source src="/sounds/new-order.wav" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-lg" data-testid="connection-status">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-2xl font-mono" data-testid="current-time">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-gray-400">
                {currentTime.toLocaleDateString()}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                data-testid="audio-toggle"
              >
                Audio: {audioEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  autoRefresh ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                data-testid="auto-refresh-toggle"
              >
                🔄 {autoRefresh ? 'AUTO' : 'MANUAL'}
              </button>

              <button
                onClick={fetchKitchenOrders}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                data-testid="refresh-button"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-600 text-white rounded-lg" data-testid="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-4xl font-bold mb-2">No active orders</h2>
            <p className="text-xl text-gray-400">Kitchen is all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="orders-grid">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`${getPriorityColor(order)} border-4 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
                data-testid={`order-card-${order._id}`}
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-800" data-testid="order-id">#{order._id.slice(-6).toUpperCase()}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status as OrderStatus)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className={`text-lg font-bold mt-1 ${order.isOverdue ? 'text-red-600' : 'text-gray-700'}`} data-testid="elapsed-time">
                      {order.elapsedTime} min
                      {order.isOverdue && <span className="text-red-600 ml-2" data-testid="overdue-indicator">OVERDUE</span>}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {(order.customer || order.guest_info) && (
                  <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg" data-testid="customer-info">
                    <div className="font-semibold text-gray-800">
                      {order.guest_info?.name || 'Registered Customer'}
                    </div>
                    {order.guest_info?.phone && (
                      <div className="text-sm text-gray-600">{order.guest_info.phone}</div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 mb-4" data-testid="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="bg-white bg-opacity-70 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-lg">{item.name}</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          {item.modifications && item.modifications.length > 0 && (
                            <div className="mt-1">
                              {item.modifications.map((mod, modIndex) => (
                                <span
                                  key={modIndex}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                  data-testid="item-modification"
                                >
                                  {mod}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-bold text-gray-800" data-testid="order-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.notes && (
                  <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded" data-testid="special-instructions">
                    <div className="font-semibold text-yellow-800 text-sm">SPECIAL INSTRUCTIONS:</div>
                    <div className="text-yellow-700">{order.notes}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'received' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'confirmed')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      data-testid="confirm-button"
                    >
                      CONFIRM
                    </button>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'in_kitchen')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      data-testid="start-cooking-button"
                    >
                      START COOKING
                    </button>
                  )}
                  
                  {order.status === 'in_kitchen' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'ready_for_pickup')}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      data-testid="ready-button"
                    >
                      READY
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/dashboard/orders/${order._id}`)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    DETAILS
                  </button>
                </div>

                {/* Timer Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Started</span>
                    <span data-testid="estimated-completion">Est: {order.estimatedCompletionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        order.isOverdue ? 'bg-red-500' : order.elapsedTime > 20 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((order.elapsedTime / 30) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4" data-testid="footer-stats">
        <div className="flex justify-center space-x-8 text-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400" data-testid="new-count">NEW: {orders.filter(o => o.status === 'received').length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400" data-testid="confirmed-count">CONFIRMED: {orders.filter(o => o.status === 'confirmed').length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400" data-testid="cooking-count">COOKING: {orders.filter(o => o.status === 'in_kitchen').length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400" data-testid="overdue-count">OVERDUE: {orders.filter(o => o.isOverdue).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplay; 