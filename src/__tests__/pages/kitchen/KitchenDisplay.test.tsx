import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import KitchenDisplay from '../../../pages/kitchen/[restaurantId]';
import { useRouter } from 'next/router';
import orderService from '../../../services/orderService';
import restaurantService from '../../../services/restaurantService';

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the services
jest.mock('../../../services/orderService');
jest.mock('../../../services/restaurantService');

// Mock the Layout component
jest.mock('../../../components/Layout', () => {
  return function MockLayout({ children, title }: { children: React.ReactNode; title: string }) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

// Mock HTML5 audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  paused: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

describe('KitchenDisplay', () => {
  const mockRouter = {
    query: { restaurantId: 'test-restaurant-id' },
    push: jest.fn(),
  };

  const mockRestaurant = {
    _id: 'test-restaurant-id',
    name: 'Test Restaurant',
    owner: 'test-owner-id',
  };

  const mockOrders = [
    {
      _id: 'order-1',
      restaurant: 'test-restaurant-id',
      customer: 'customer-1',
      items: [
        {
          _id: 'item-1',
          name: 'Margherita Pizza',
          price: 16.99,
          quantity: 1,
          modifications: ['Extra cheese'],
        },
      ],
      total_price: 16.99,
      status: 'received',
      guest_info: {
        name: 'John Doe',
        phone: '555-1234',
        email: 'john@example.com',
      },
      notes: 'Please make it extra crispy',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      _id: 'order-2',
      restaurant: 'test-restaurant-id',
      customer: 'customer-2',
      items: [
        {
          _id: 'item-2',
          name: 'Caesar Salad',
          price: 12.99,
          quantity: 2,
          modifications: ['No croutons'],
        },
      ],
      total_price: 25.98,
      status: 'confirmed',
      guest_info: {
        name: 'Jane Smith',
        phone: '555-5678',
        email: 'jane@example.com',
      },
      notes: '',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      _id: 'order-3',
      restaurant: 'test-restaurant-id',
      customer: 'customer-3',
      items: [
        {
          _id: 'item-3',
          name: 'Chicken Wings',
          price: 14.99,
          quantity: 1,
        },
      ],
      total_price: 14.99,
      status: 'in_kitchen',
      guest_info: {
        name: 'Bob Wilson',
        phone: '555-9999',
        email: 'bob@example.com',
      },
      notes: 'Spicy sauce on the side',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago (overdue)
      updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (restaurantService.getRestaurant as jest.Mock).mockResolvedValue(mockRestaurant);
    (orderService.getRestaurantOrders as jest.Mock).mockResolvedValue(mockOrders);
    (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders the kitchen display page with restaurant name', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Test Restaurant - Kitchen Display')).toBeInTheDocument();
      });
    });

    it('displays the current time', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)).toBeInTheDocument();
      });
    });

    it('shows connection status indicator', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<KitchenDisplay />);
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    it('displays kitchen orders correctly', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
        expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
        expect(screen.getByText('Chicken Wings')).toBeInTheDocument();
      });
    });

    it('shows customer information for guest orders', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('555-1234')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('555-5678')).toBeInTheDocument();
      });
    });

    it('displays special instructions when present', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Please make it extra crispy')).toBeInTheDocument();
        expect(screen.getByText('Spicy sauce on the side')).toBeInTheDocument();
      });
    });

    it('shows item modifications', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Extra cheese')).toBeInTheDocument();
        expect(screen.getByText('No croutons')).toBeInTheDocument();
      });
    });

    it('filters orders to show only kitchen-relevant statuses', async () => {
      const allOrders = [
        ...mockOrders,
        {
          _id: 'order-4',
          restaurant: 'test-restaurant-id',
          customer: 'customer-4',
          items: [{ _id: 'item-4', name: 'Delivered Item', price: 10.99, quantity: 1 }],
          total_price: 10.99,
          status: 'delivered', // Should be filtered out
          guest_info: { name: 'Test User', phone: '555-0000', email: 'test@example.com' },
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValue(allOrders);

      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
        expect(screen.queryByText('Delivered Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Timing and Priority System', () => {
    it('calculates and displays elapsed time correctly', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('5 min')).toBeInTheDocument(); // Order 1: 5 minutes ago
        expect(screen.getByText('15 min')).toBeInTheDocument(); // Order 2: 15 minutes ago
        expect(screen.getByText('25 min')).toBeInTheDocument(); // Order 3: 25 minutes ago
      });
    });

    it('applies correct priority colors based on timing', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const orderCards = screen.getAllByTestId(/order-card/);
        expect(orderCards).toHaveLength(3);

        // Order 1 (5 min) should be green (new)
        expect(orderCards[0]).toHaveClass('bg-green-50', 'border-green-200');
        
        // Order 2 (15 min) should be yellow (10+ min)
        expect(orderCards[1]).toHaveClass('bg-yellow-50', 'border-yellow-200');
        
        // Order 3 (25 min) should be red (overdue)
        expect(orderCards[2]).toHaveClass('bg-red-50', 'border-red-200');
      });
    });

    it('shows estimated completion time', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        // Base time (15 min) + items (3 min each)
        expect(screen.getByText(/Est: \d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
      });
    });

    it('identifies overdue orders correctly', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
      });
    });
  });

  describe('Status Updates', () => {
    it('allows confirming received orders', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /CONFIRM/i });
        fireEvent.click(confirmButton);
      });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'confirmed');
    });

    it('allows starting cooking for confirmed orders', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const startCookingButton = screen.getByRole('button', { name: /START COOKING/i });
        fireEvent.click(startCookingButton);
      });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-2', 'in_kitchen');
    });

    it('allows marking orders as ready', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const readyButton = screen.getByRole('button', { name: /READY/i });
        fireEvent.click(readyButton);
      });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-3', 'ready');
    });

    it('refreshes orders after status update', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /CONFIRM/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(orderService.getRestaurantOrders).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });
  });

  describe('Real-time Updates', () => {
    it('auto-refreshes orders every 10 seconds', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(orderService.getRestaurantOrders).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      await waitFor(() => {
        expect(orderService.getRestaurantOrders).toHaveBeenCalledTimes(2);
      });
    });

    it('updates timer display every minute', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      await waitFor(() => {
        expect(screen.getByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)).toBeInTheDocument();
      });
    });

    it('allows manual refresh', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /Refresh/i });
        fireEvent.click(refreshButton);
      });

      expect(orderService.getRestaurantOrders).toHaveBeenCalledTimes(2);
    });

    it('can toggle auto-refresh', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const autoRefreshToggle = screen.getByRole('button', { name: /Auto-refresh: ON/i });
        fireEvent.click(autoRefreshToggle);
      });

      expect(screen.getByText('Auto-refresh: OFF')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      // Should not refresh when auto-refresh is off
      expect(orderService.getRestaurantOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audio Alerts', () => {
    it('plays audio alert for new orders', async () => {
      // Start with no orders
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce([]);

      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('No active orders')).toBeInTheDocument();
      });

      // Mock new orders arriving
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce([mockOrders[0]]);

      act(() => {
        jest.advanceTimersByTime(10000); // Trigger refresh
      });

      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });
    });

    it('can toggle audio alerts', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const audioToggle = screen.getByRole('button', { name: /Audio: ON/i });
        fireEvent.click(audioToggle);
      });

      expect(screen.getByText('Audio: OFF')).toBeInTheDocument();
    });

    it('does not play audio when disabled', async () => {
      render(<KitchenDisplay />);

      // Disable audio
      await waitFor(() => {
        const audioToggle = screen.getByRole('button', { name: /Audio: ON/i });
        fireEvent.click(audioToggle);
      });

      // Mock new orders arriving
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce([
        ...mockOrders,
        {
          _id: 'new-order',
          restaurant: 'test-restaurant-id',
          customer: 'new-customer',
          items: [{ _id: 'new-item', name: 'New Item', price: 10.99, quantity: 1 }],
          total_price: 10.99,
          status: 'received',
          guest_info: { name: 'New User', phone: '555-0000', email: 'new@example.com' },
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      act(() => {
        jest.advanceTimersByTime(10000); // Trigger refresh
      });

      await waitFor(() => {
        expect(mockAudio.play).not.toHaveBeenCalled();
      });
    });
  });

  describe('Footer Statistics', () => {
    it('displays correct order counts by status', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('NEW: 1')).toBeInTheDocument(); // 1 received order
        expect(screen.getByText('CONFIRMED: 1')).toBeInTheDocument(); // 1 confirmed order
        expect(screen.getByText('COOKING: 1')).toBeInTheDocument(); // 1 in_kitchen order
        expect(screen.getByText('OVERDUE: 1')).toBeInTheDocument(); // 1 overdue order
      });
    });

    it('updates statistics when orders change', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('NEW: 1')).toBeInTheDocument();
      });

      // Confirm an order
      const confirmButton = screen.getByRole('button', { name: /CONFIRM/i });
      fireEvent.click(confirmButton);

      // Mock updated orders after confirmation
      const updatedOrders = mockOrders.map(order =>
        order._id === 'order-1' ? { ...order, status: 'confirmed' } : order
      );
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce(updatedOrders);

      await waitFor(() => {
        expect(screen.getByText('NEW: 0')).toBeInTheDocument();
        expect(screen.getByText('CONFIRMED: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      (orderService.getRestaurantOrders as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Connection failed - retrying...')).toBeInTheDocument();
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    it('handles status update errors', async () => {
      (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      render(<KitchenDisplay />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /CONFIRM/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update order status')).toBeInTheDocument();
      });
    });

    it('shows connection status based on API health', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Simulate API failure
      (orderService.getRestaurantOrders as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      act(() => {
        jest.advanceTimersByTime(10000); // Trigger refresh
      });

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Alerts', () => {
    it('flashes screen for new orders', async () => {
      // Start with no orders
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce([]);

      render(<KitchenDisplay />);

      await waitFor(() => {
        expect(screen.getByText('No active orders')).toBeInTheDocument();
      });

      // Mock new orders arriving
      (orderService.getRestaurantOrders as jest.Mock).mockResolvedValueOnce([mockOrders[0]]);

      act(() => {
        jest.advanceTimersByTime(10000); // Trigger refresh
      });

      await waitFor(() => {
        const container = screen.getByTestId('kitchen-display-container');
        expect(container).toHaveClass('bg-yellow-100'); // Flash effect
      });

      // Flash should disappear after 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const container = screen.getByTestId('kitchen-display-container');
        expect(container).not.toHaveClass('bg-yellow-100');
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', async () => {
      render(<KitchenDisplay />);

      await waitFor(() => {
        const container = screen.getByTestId('kitchen-display-container');
        expect(container).toHaveClass('min-h-screen');
      });

      const orderGrid = screen.getByTestId('orders-grid');
      expect(orderGrid).toHaveClass('grid', 'gap-6');
    });
  });
}); 