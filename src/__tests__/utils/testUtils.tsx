import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

// Mock user data for testing
export const mockUser = {
  _id: 'test-user-123',
  email: 'test@restaurant.com',
  name: 'Test User',
  role: 'user' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

// Mock restaurant data
export const mockRestaurant = {
  _id: 'test-restaurant-123',
  name: 'Test Restaurant',
  description: 'A test restaurant',
  cuisine: ['Italian'],
  owner: 'test-user-123',
  status: 'active' as const,
  settings: {
    contact_preferences: {
      email_notifications: true,
      sms_notifications: false
    },
    operating_hours: {
      monday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      tuesday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      wednesday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      thursday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      friday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      saturday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      sunday: { is_open: true, open_time: '09:00', close_time: '22:00' }
    }
  }
};

// Mock menu data
export const mockMenu = {
  _id: 'test-menu-123',
  restaurant: 'test-restaurant-123',
  sections: [
    {
      _id: 'section-1',
      name: 'Appetizers',
      description: 'Start your meal right',
      displayOrder: 0,
      isActive: true,
      items: [
        {
          _id: 'item-1',
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with parmesan',
          price: 12.99,
          available: true,
          customizations: [],
          price_points: [
            { id: 'regular', name: 'Regular', price: 12.99 },
            { id: 'large', name: 'Large', price: 16.99 }
          ]
        }
      ]
    },
    {
      _id: 'section-2',
      name: 'Mains',
      description: 'Main courses',
      displayOrder: 1,
      isActive: true,
      items: [
        {
          _id: 'item-2',
          name: 'Margherita Pizza',
          description: 'Classic tomato and mozzarella',
          price: 18.99,
          available: true,
          customizations: [],
          price_points: [
            { id: 'small', name: 'Small', price: 15.99 },
            { id: 'medium', name: 'Medium', price: 18.99 },
            { id: 'large', name: 'Large', price: 22.99 }
          ]
        }
      ]
    }
  ],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

// Mock cart data
export const mockCartItem = {
  _id: 'item-1',
  name: 'Caesar Salad',
  description: 'Fresh romaine lettuce with parmesan',
  price: 12.99,
  available: true,
  customizations: [],
  price_points: [
    { id: 'regular', name: 'Regular', price: 12.99 },
    { id: 'large', name: 'Large', price: 16.99 }
  ],
  quantity: 1,
  selectedPricePoint: 'regular',
  modifications: []
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Simple options for testing
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Helper to mock API responses
export const mockFetch = (data: any, ok = true, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data))
  });
};

// Helper to mock API errors
export const mockFetchError = (message = 'Network error') => {
  return jest.fn().mockRejectedValue(new Error(message));
};

// Helper to wait for loading states to complete
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).toBe(null);
  }, { timeout: 3000 });
};

// Helper to fill form fields
export const fillForm = async (fields: Record<string, string>) => {
  const user = userEvent.setup();
  
  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
};

// Helper to submit forms
export const submitForm = async (buttonText = /submit|save|create/i) => {
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: buttonText });
  await user.click(submitButton);
};

// Helper to check error messages
export const expectErrorMessage = (message: string | RegExp) => {
  expect(screen.getByText(message)).toBeDefined();
};

// Helper to check success messages
export const expectSuccessMessage = (message: string | RegExp) => {
  expect(screen.getByText(message)).toBeDefined();
};

// Helper for file upload testing
export const uploadFile = async (inputTestId: string, file: File) => {
  const user = userEvent.setup();
  const input = screen.getByTestId(inputTestId) as HTMLInputElement;
  await user.upload(input, file);
};

// Helper to create test files
export const createTestFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  return new File(['test content'], name, { type, lastModified: Date.now() });
};

// Helper to mock image loading
export const mockImageLoad = () => {
  Object.defineProperty(HTMLImageElement.prototype, 'onload', {
    get() {
      return this._onload;
    },
    set(fn) {
      this._onload = fn;
      // Simulate image load
      setTimeout(() => fn && fn(), 0);
    },
  });
};

// Helper to test modal interactions
export const openModal = async (triggerText: string | RegExp) => {
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', { name: triggerText });
  await user.click(trigger);
};

export const closeModal = async () => {
  const user = userEvent.setup();
  const closeButton = screen.getByRole('button', { name: /close|cancel/i });
  await user.click(closeButton);
};

// Helper to test drag and drop
export const mockDragAndDrop = () => {
  const createBubbledEvent = (type: string, props = {}) => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, props);
    return event;
  };

  return {
    dragStart: (element: Element) => {
      element.dispatchEvent(createBubbledEvent('dragstart'));
    },
    dragEnter: (element: Element) => {
      element.dispatchEvent(createBubbledEvent('dragenter'));
    },
    dragOver: (element: Element) => {
      element.dispatchEvent(createBubbledEvent('dragover'));
    },
    drop: (element: Element) => {
      element.dispatchEvent(createBubbledEvent('drop'));
    }
  };
};

// Export everything for easy importing
export * from '@testing-library/react';
export { userEvent }; 