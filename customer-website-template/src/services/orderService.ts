import api from './api';
import { Order, OrderPayload } from '@/types/Order';

export class OrderService {
  async placeOrder(orderData: OrderPayload): Promise<Order> {
    try {
      const order = await api.post<Order>('/orders/new', orderData);
      return order;
    } catch (error) {
      console.error('Error placing order:', error);
      throw new Error('Failed to place order');
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const order = await api.get<Order>(`/orders/${orderId}`);
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to load order details');
    }
  }
}

const orderService = new OrderService();
export default orderService; 