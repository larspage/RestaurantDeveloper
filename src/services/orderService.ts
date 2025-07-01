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
};

export default orderService; 