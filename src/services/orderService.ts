import api from './api';
import { CartItem } from '../types/Cart';

// This represents a single item within a placed order
export interface OrderItem {
  _id: string; // This is the ID of the item instance within the order, not the menu item ID
  name: string;
  price: number;
  quantity: number;
  modifications?: string[];
}

// This represents the full Order object returned from the API
export interface Order {
  _id: string;
  restaurant: string;
  customer?: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  guest_info?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// This is the payload sent to the backend to create an order
export interface OrderPayload {
  restaurant_id: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  // for guest checkouts
  guest_info?: {
    name: string;
    phone: string;
    email: string;
  };
  notes?: string;
}

// Order status options for restaurant management
export type OrderStatus = 'received' | 'confirmed' | 'in_kitchen' | 'ready_for_pickup' | 'delivered' | 'cancelled';

const orderService = {
  placeOrder: async (orderData: OrderPayload): Promise<Order> => {
    // The backend expects snake_case, which is what we have in OrderPayload
    const response = await api.post('/orders/new', orderData);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  
  getOrderHistory: async (): Promise<Order[]> => {
    const response = await api.get('/orders/history');
    return response.data;
  },

  // Restaurant order management methods
  getRestaurantActiveOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/restaurant/${restaurantId}/active`);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, estimatedTime?: string, reason?: string): Promise<Order> => {
    const payload: any = { status };
    if (estimatedTime) {
      payload.estimated_time = estimatedTime;
    }
    if (reason) {
      payload.reason = reason;
    }
    const response = await api.patch(`/orders/${orderId}/status`, payload);
    return response.data;
  },

  // Bulk status update for multiple orders
  bulkUpdateOrderStatus: async (orderIds: string[], status: OrderStatus, estimatedTime?: string, reason?: string): Promise<{ updated: Order[], failed: string[] }> => {
    const payload: any = { 
      order_ids: orderIds,
      status 
    };
    if (estimatedTime) {
      payload.estimated_time = estimatedTime;
    }
    if (reason) {
      payload.reason = reason;
    }
    const response = await api.patch('/orders/bulk/status', payload);
    return response.data;
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const payload: any = { status: 'cancelled' };
    if (reason) {
      payload.reason = reason;
    }
    const response = await api.patch(`/orders/${orderId}/status`, payload);
    return response.data;
  },

  // Bulk cancel multiple orders
  bulkCancelOrders: async (orderIds: string[], reason: string): Promise<{ cancelled: Order[], failed: string[] }> => {
    const payload = {
      order_ids: orderIds,
      status: 'cancelled',
      reason
    };
    const response = await api.patch('/orders/bulk/status', payload);
    return response.data;
  },

  // Get all orders for a restaurant (including inactive ones)
  getRestaurantOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/restaurant/${restaurantId}/active`);
    return response.data;
  },

  // Get order statistics for dashboard
  getOrderStats: async (restaurantId: string): Promise<{
    total: number;
    by_status: Record<OrderStatus, number>;
    today_total: number;
    today_revenue: number;
  }> => {
    const response = await api.get(`/orders/restaurant/${restaurantId}/stats`);
    return response.data;
  },
};

export default orderService; 