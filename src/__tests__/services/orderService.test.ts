/// <reference types="jest" />
import '@testing-library/jest-dom';
import orderService, { Order, OrderPayload, OrderStatus, OrderItem } from '../../services/orderService';

// Mock the api module
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
}));

// Import the mocked api
import api from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

describe('orderService', () => {
  const mockOrderId = 'test-order-id';
  const mockRestaurantId = 'test-restaurant-id';
  const mockCustomerId = 'test-customer-id';
  
  const mockOrderItem: OrderItem = {
    _id: 'item-id-1',
    name: 'Test Pizza',
    price: 16.99,
    quantity: 2,
    modifications: ['Extra cheese', 'Thin crust']
  };

  const mockOrder: Order = {
    _id: mockOrderId,
    restaurant: mockRestaurantId,
    customer: mockCustomerId,
    items: [mockOrderItem],
    total_price: 33.98,
    status: 'received',
    guest_info: {
      name: 'John Doe',
      phone: '555-1234',
      email: 'john@example.com'
    },
    notes: 'Please deliver to side door',
    createdAt: '2023-01-01T12:00:00.000Z',
    updatedAt: '2023-01-01T12:00:00.000Z'
  };

  const mockOrderPayload: OrderPayload = {
    restaurant_id: mockRestaurantId,
    items: [
      {
        name: 'Test Pizza',
        price: 16.99,
        quantity: 2
      }
    ],
    guest_info: {
      name: 'John Doe',
      phone: '555-1234',
      email: 'john@example.com'
    },
    notes: 'Please deliver to side door'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('should place a new order successfully', async () => {
      mockApi.post.mockResolvedValue({ data: mockOrder });

      const result = await orderService.placeOrder(mockOrderPayload);

      expect(mockApi.post).toHaveBeenCalledWith('/orders/new', mockOrderPayload);
      expect(result).toEqual(mockOrder);
    });

    it('should handle API errors when placing order', async () => {
      const mockError = new Error('Failed to place order');
      mockApi.post.mockRejectedValue(mockError);

      await expect(orderService.placeOrder(mockOrderPayload)).rejects.toThrow('Failed to place order');
      expect(mockApi.post).toHaveBeenCalledWith('/orders/new', mockOrderPayload);
    });

    it('should handle order placement with minimal data', async () => {
      const minimalPayload: OrderPayload = {
        restaurant_id: mockRestaurantId,
        items: [
          {
            name: 'Simple Item',
            price: 10.00,
            quantity: 1
          }
        ]
      };

      const minimalOrder = { ...mockOrder, guest_info: undefined, notes: undefined };
      mockApi.post.mockResolvedValue({ data: minimalOrder });

      const result = await orderService.placeOrder(minimalPayload);

      expect(mockApi.post).toHaveBeenCalledWith('/orders/new', minimalPayload);
      expect(result).toEqual(minimalOrder);
    });

    it('should handle validation errors during order placement', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid order data' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(orderService.placeOrder(mockOrderPayload)).rejects.toEqual(mockError);
    });
  });

  describe('getOrder', () => {
    it('should fetch a single order successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockOrder });

      const result = await orderService.getOrder(mockOrderId);

      expect(mockApi.get).toHaveBeenCalledWith(`/orders/${mockOrderId}`);
      expect(result).toEqual(mockOrder);
    });

    it('should handle API errors when fetching order', async () => {
      const mockError = new Error('Order not found');
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrder(mockOrderId)).rejects.toThrow('Order not found');
      expect(mockApi.get).toHaveBeenCalledWith(`/orders/${mockOrderId}`);
    });

    it('should handle 404 errors for non-existent orders', async () => {
      const mockError = { response: { status: 404 } };
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrder('non-existent-id')).rejects.toEqual(mockError);
    });
  });

  describe('getOrderHistory', () => {
    it('should fetch order history successfully', async () => {
      const mockOrders = [mockOrder];
      mockApi.get.mockResolvedValue({ data: mockOrders });

      const result = await orderService.getOrderHistory();

      expect(mockApi.get).toHaveBeenCalledWith('/orders/history');
      expect(result).toEqual(mockOrders);
    });

    it('should handle empty order history', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await orderService.getOrderHistory();

      expect(result).toEqual([]);
    });

    it('should handle API errors when fetching order history', async () => {
      const mockError = new Error('Failed to fetch order history');
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrderHistory()).rejects.toThrow('Failed to fetch order history');
    });
  });

  describe('getRestaurantActiveOrders', () => {
    it('should fetch restaurant active orders successfully', async () => {
      const mockOrders = [mockOrder];
      mockApi.get.mockResolvedValue({ data: mockOrders });

      const result = await orderService.getRestaurantActiveOrders(mockRestaurantId);

      expect(mockApi.get).toHaveBeenCalledWith(`/orders/restaurant/${mockRestaurantId}/active`);
      expect(result).toEqual(mockOrders);
    });

    it('should handle empty active orders', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await orderService.getRestaurantActiveOrders(mockRestaurantId);

      expect(result).toEqual([]);
    });

    it('should handle API errors when fetching restaurant orders', async () => {
      const mockError = new Error('Failed to fetch restaurant orders');
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getRestaurantActiveOrders(mockRestaurantId)).rejects.toThrow('Failed to fetch restaurant orders');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'confirmed' };
      mockApi.patch.mockResolvedValue({ data: updatedOrder });

      const result = await orderService.updateOrderStatus(mockOrderId, 'confirmed');

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { status: 'confirmed' });
      expect(result).toEqual(updatedOrder);
    });

    it('should update order status with estimated time', async () => {
      const updatedOrder = { ...mockOrder, status: 'confirmed' };
      mockApi.patch.mockResolvedValue({ data: updatedOrder });

      const result = await orderService.updateOrderStatus(mockOrderId, 'confirmed', '15 minutes');

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { 
        status: 'confirmed',
        estimated_time: '15 minutes'
      });
      expect(result).toEqual(updatedOrder);
    });

    it('should update order status with reason', async () => {
      const updatedOrder = { ...mockOrder, status: 'cancelled' };
      mockApi.patch.mockResolvedValue({ data: updatedOrder });

      const result = await orderService.updateOrderStatus(mockOrderId, 'cancelled', undefined, 'Customer request');

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { 
        status: 'cancelled',
        reason: 'Customer request'
      });
      expect(result).toEqual(updatedOrder);
    });

    it('should update order status with both estimated time and reason', async () => {
      const updatedOrder = { ...mockOrder, status: 'in_kitchen' };
      mockApi.patch.mockResolvedValue({ data: updatedOrder });

      const result = await orderService.updateOrderStatus(mockOrderId, 'in_kitchen', '20 minutes', 'Preparing now');

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { 
        status: 'in_kitchen',
        estimated_time: '20 minutes',
        reason: 'Preparing now'
      });
      expect(result).toEqual(updatedOrder);
    });

    it('should handle API errors when updating order status', async () => {
      const mockError = new Error('Failed to update order status');
      mockApi.patch.mockRejectedValue(mockError);

      await expect(orderService.updateOrderStatus(mockOrderId, 'confirmed')).rejects.toThrow('Failed to update order status');
    });

    it('should handle invalid status updates', async () => {
      const mockError = { response: { status: 400, data: { message: 'Invalid status' } } };
      mockApi.patch.mockRejectedValue(mockError);

      await expect(orderService.updateOrderStatus(mockOrderId, 'invalid' as OrderStatus)).rejects.toEqual(mockError);
    });
  });

  describe('bulkUpdateOrderStatus', () => {
    const mockOrderIds = ['order-1', 'order-2', 'order-3'];

    it('should bulk update order status successfully', async () => {
      const mockResponse = {
        updated: [mockOrder],
        failed: []
      };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkUpdateOrderStatus(mockOrderIds, 'confirmed');

      expect(mockApi.patch).toHaveBeenCalledWith('/orders/bulk/status', {
        order_ids: mockOrderIds,
        status: 'confirmed'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should bulk update with estimated time and reason', async () => {
      const mockResponse = {
        updated: [mockOrder],
        failed: []
      };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkUpdateOrderStatus(mockOrderIds, 'ready_for_pickup', '5 minutes', 'All orders ready');

      expect(mockApi.patch).toHaveBeenCalledWith('/orders/bulk/status', {
        order_ids: mockOrderIds,
        status: 'ready_for_pickup',
        estimated_time: '5 minutes',
        reason: 'All orders ready'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial failures in bulk update', async () => {
      const mockResponse = {
        updated: [mockOrder],
        failed: ['order-2']
      };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkUpdateOrderStatus(mockOrderIds, 'confirmed');

      expect(result.updated).toHaveLength(1);
      expect(result.failed).toContain('order-2');
    });

    it('should handle API errors in bulk update', async () => {
      const mockError = new Error('Bulk update failed');
      mockApi.patch.mockRejectedValue(mockError);

      await expect(orderService.bulkUpdateOrderStatus(mockOrderIds, 'confirmed')).rejects.toThrow('Bulk update failed');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      mockApi.patch.mockResolvedValue({ data: cancelledOrder });

      const result = await orderService.cancelOrder(mockOrderId);

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { status: 'cancelled' });
      expect(result).toEqual(cancelledOrder);
    });

    it('should cancel order with reason', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      mockApi.patch.mockResolvedValue({ data: cancelledOrder });

      const result = await orderService.cancelOrder(mockOrderId, 'Customer request');

      expect(mockApi.patch).toHaveBeenCalledWith(`/orders/${mockOrderId}/status`, { 
        status: 'cancelled',
        reason: 'Customer request'
      });
      expect(result).toEqual(cancelledOrder);
    });

    it('should handle API errors when cancelling order', async () => {
      const mockError = new Error('Failed to cancel order');
      mockApi.patch.mockRejectedValue(mockError);

      await expect(orderService.cancelOrder(mockOrderId)).rejects.toThrow('Failed to cancel order');
    });
  });

  describe('bulkCancelOrders', () => {
    const mockOrderIds = ['order-1', 'order-2', 'order-3'];

    it('should bulk cancel orders successfully', async () => {
      const mockResponse = {
        cancelled: [mockOrder],
        failed: []
      };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkCancelOrders(mockOrderIds, 'Kitchen closed');

      expect(mockApi.patch).toHaveBeenCalledWith('/orders/bulk/status', {
        order_ids: mockOrderIds,
        status: 'cancelled',
        reason: 'Kitchen closed'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial failures in bulk cancel', async () => {
      const mockResponse = {
        cancelled: [mockOrder],
        failed: ['order-2']
      };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkCancelOrders(mockOrderIds, 'Emergency closure');

      expect(result.cancelled).toHaveLength(1);
      expect(result.failed).toContain('order-2');
    });

    it('should handle API errors in bulk cancel', async () => {
      const mockError = new Error('Bulk cancel failed');
      mockApi.patch.mockRejectedValue(mockError);

      await expect(orderService.bulkCancelOrders(mockOrderIds, 'System error')).rejects.toThrow('Bulk cancel failed');
    });
  });

  describe('getOrderStats', () => {
    it('should fetch order statistics successfully', async () => {
      const mockStats = {
        total: 150,
        by_status: {
          received: 5,
          confirmed: 8,
          in_kitchen: 12,
          ready_for_pickup: 3,
          delivered: 120,
          cancelled: 2
        },
        today_total: 25,
        today_revenue: 450.75
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await orderService.getOrderStats(mockRestaurantId);

      expect(mockApi.get).toHaveBeenCalledWith(`/orders/restaurant/${mockRestaurantId}/stats`);
      expect(result).toEqual(mockStats);
    });

    it('should handle empty statistics', async () => {
      const mockStats = {
        total: 0,
        by_status: {
          received: 0,
          confirmed: 0,
          in_kitchen: 0,
          ready_for_pickup: 0,
          delivered: 0,
          cancelled: 0
        },
        today_total: 0,
        today_revenue: 0
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await orderService.getOrderStats(mockRestaurantId);

      expect(result.total).toBe(0);
      expect(result.today_revenue).toBe(0);
    });

    it('should handle API errors when fetching statistics', async () => {
      const mockError = new Error('Failed to fetch statistics');
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrderStats(mockRestaurantId)).rejects.toThrow('Failed to fetch statistics');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockError = { code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' };
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrder(mockOrderId)).rejects.toEqual(mockError);
    });

    it('should handle server errors (500)', async () => {
      const mockError = { response: { status: 500, data: { message: 'Internal server error' } } };
      mockApi.get.mockRejectedValue(mockError);

      await expect(orderService.getOrderHistory()).rejects.toEqual(mockError);
    });

    it('should handle malformed API responses', async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const result = await orderService.getOrder(mockOrderId);

      expect(result).toBeNull();
    });

    it('should handle empty order IDs in bulk operations', async () => {
      const mockResponse = { updated: [], failed: [] };
      mockApi.patch.mockResolvedValue({ data: mockResponse });

      const result = await orderService.bulkUpdateOrderStatus([], 'confirmed');

      expect(result.updated).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle very large order lists', async () => {
      const largeOrderList = Array(1000).fill(mockOrder);
      mockApi.get.mockResolvedValue({ data: largeOrderList });

      const result = await orderService.getOrderHistory();

      expect(result).toHaveLength(1000);
    });
  });
}); 