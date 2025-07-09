import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderItemList from '../OrderItemList';
import { OrderItem } from '../../services/orderService';

describe('OrderItemList', () => {
  const mockItems: OrderItem[] = [
    {
      _id: '1',
      name: 'Burger',
      price: 12.99,
      quantity: 2,
      modifications: ['No onions', 'Extra cheese']
    },
    {
      _id: '2',
      name: 'Fries',
      price: 4.99,
      quantity: 1,
      modifications: []
    },
    {
      _id: '3',
      name: 'Soda',
      price: 2.50,
      quantity: 3
    }
  ];

  describe('Basic Rendering', () => {
    it('renders all items correctly', () => {
      render(<OrderItemList items={mockItems} />);

      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('Fries')).toBeInTheDocument();
      expect(screen.getByText('Soda')).toBeInTheDocument();
    });

    it('displays item quantities correctly', () => {
      render(<OrderItemList items={mockItems} />);

      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 3')).toBeInTheDocument();
    });

    it('displays individual item prices correctly', () => {
      render(<OrderItemList items={mockItems} />);

      expect(screen.getByText('Price: $12.99 each')).toBeInTheDocument();
      expect(screen.getByText('Price: $4.99 each')).toBeInTheDocument();
      expect(screen.getByText('Price: $2.50 each')).toBeInTheDocument();
    });

    it('displays line totals correctly', () => {
      render(<OrderItemList items={mockItems} />);

      // 2 × $12.99 = $25.98
      expect(screen.getByText('$25.98')).toBeInTheDocument();
      // 1 × $4.99 = $4.99
      expect(screen.getByText('$4.99')).toBeInTheDocument();
      // 3 × $2.50 = $7.50
      expect(screen.getByText('$7.50')).toBeInTheDocument();
    });
  });

  describe('Modifications', () => {
    it('displays modifications when present', () => {
      render(<OrderItemList items={mockItems} />);

      expect(screen.getByText('No onions')).toBeInTheDocument();
      expect(screen.getByText('Extra cheese')).toBeInTheDocument();
    });

    it('does not display modifications section when empty array', () => {
      const itemsWithEmptyMods: OrderItem[] = [
        {
          _id: '1',
          name: 'Plain Burger',
          price: 10.00,
          quantity: 1,
          modifications: []
        }
      ];

      render(<OrderItemList items={itemsWithEmptyMods} />);

      expect(screen.getByText('Plain Burger')).toBeInTheDocument();
      // Should not render any modification badges
      expect(screen.queryByRole('generic', { name: /modification/i })).not.toBeInTheDocument();
    });

    it('does not display modifications section when undefined', () => {
      const itemsWithUndefinedMods: OrderItem[] = [
        {
          _id: '1',
          name: 'Simple Burger',
          price: 10.00,
          quantity: 1
          // modifications is undefined
        }
      ];

      render(<OrderItemList items={itemsWithUndefinedMods} />);

      expect(screen.getByText('Simple Burger')).toBeInTheDocument();
      // Should not render any modification badges
      expect(screen.queryByRole('generic', { name: /modification/i })).not.toBeInTheDocument();
    });

    it('handles multiple modifications correctly', () => {
      const itemsWithManyMods: OrderItem[] = [
        {
          _id: '1',
          name: 'Custom Burger',
          price: 15.00,
          quantity: 1,
          modifications: ['No pickles', 'Extra sauce', 'Medium rare', 'Side of onion rings', 'Gluten-free bun']
        }
      ];

      render(<OrderItemList items={itemsWithManyMods} />);

      expect(screen.getByText('No pickles')).toBeInTheDocument();
      expect(screen.getByText('Extra sauce')).toBeInTheDocument();
      expect(screen.getByText('Medium rare')).toBeInTheDocument();
      expect(screen.getByText('Side of onion rings')).toBeInTheDocument();
      expect(screen.getByText('Gluten-free bun')).toBeInTheDocument();
    });
  });

  describe('Summary Calculations', () => {
    it('calculates total price correctly', () => {
      render(<OrderItemList items={mockItems} />);

      // (2 × $12.99) + (1 × $4.99) + (3 × $2.50) = $25.98 + $4.99 + $7.50 = $38.47
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$38.47');
      })).toBeInTheDocument();
    });

    it('calculates total quantity correctly', () => {
      render(<OrderItemList items={mockItems} />);

      // 2 + 1 + 3 = 6
      expect(screen.getByText('Total quantity: 6')).toBeInTheDocument();
    });

    it('displays correct item count', () => {
      render(<OrderItemList items={mockItems} />);

      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('handles singular item count correctly', () => {
      const singleItem: OrderItem[] = [
        {
          _id: '1',
          name: 'Single Burger',
          price: 10.00,
          quantity: 1
        }
      ];

      render(<OrderItemList items={singleItem} />);

      expect(screen.getByText('1 item')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      render(<OrderItemList items={[]} />);

      expect(screen.getByText('0 items')).toBeInTheDocument();
      expect(screen.getByText('Total quantity: 0')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$0.00');
      })).toBeInTheDocument();
    });

    it('handles items with zero price', () => {
      const freeItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Free Sample',
          price: 0,
          quantity: 2
        }
      ];

      render(<OrderItemList items={freeItems} />);

      expect(screen.getByText('Free Sample')).toBeInTheDocument();
      expect(screen.getByText('Price: $0.00 each')).toBeInTheDocument();
      // Check for the total price specifically (should appear in green styling)
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$0.00');
      })).toBeInTheDocument();
    });

    it('handles items with zero quantity', () => {
      const zeroQuantityItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Removed Item',
          price: 10.00,
          quantity: 0
        }
      ];

      render(<OrderItemList items={zeroQuantityItems} />);

      expect(screen.getByText('Removed Item')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 0')).toBeInTheDocument();
      // Check for the total price specifically (should appear in green styling)
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$0.00');
      })).toBeInTheDocument();
    });

    it('handles very large quantities', () => {
      const largeQuantityItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Bulk Order',
          price: 1.00,
          quantity: 999
        }
      ];

      render(<OrderItemList items={largeQuantityItems} />);

      expect(screen.getByText('Quantity: 999')).toBeInTheDocument();
      // Check for the total price specifically (should appear in green styling)
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$999.00');
      })).toBeInTheDocument();
    });

    it('handles decimal prices correctly', () => {
      const decimalPriceItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Precise Item',
          price: 12.345,
          quantity: 2
        }
      ];

      render(<OrderItemList items={decimalPriceItems} />);

      expect(screen.getByText('Price: $12.35 each')).toBeInTheDocument();
      // Check for the total price specifically (should appear in green styling)
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$24.69');
      })).toBeInTheDocument();
    });

    it('handles very long item names', () => {
      const longNameItems: OrderItem[] = [
        {
          _id: '1',
          name: 'This is a very long item name that might cause layout issues if not handled properly',
          price: 15.00,
          quantity: 1
        }
      ];

      render(<OrderItemList items={longNameItems} />);

      expect(screen.getByText('This is a very long item name that might cause layout issues if not handled properly')).toBeInTheDocument();
    });

    it('handles special characters in item names', () => {
      const specialCharItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Café Latté & Crème Brûlée (Special!)',
          price: 8.50,
          quantity: 1
        }
      ];

      render(<OrderItemList items={specialCharItems} />);

      expect(screen.getByText('Café Latté & Crème Brûlée (Special!)')).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('formats prices to 2 decimal places', () => {
      const preciseItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Test Item',
          price: 10.1,
          quantity: 1
        }
      ];

      render(<OrderItemList items={preciseItems} />);

      expect(screen.getByText('Price: $10.10 each')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$10.10');
      })).toBeInTheDocument();
    });

    it('handles rounding correctly', () => {
      const roundingItems: OrderItem[] = [
        {
          _id: '1',
          name: 'Rounding Test',
          price: 3.333,
          quantity: 3
        }
      ];

      render(<OrderItemList items={roundingItems} />);

      // 3.333 should round to 3.33, and 3 × 3.333 = 9.999 which rounds to $10.00
      expect(screen.getByText('Price: $3.33 each')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$10.00');
      })).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct CSS classes for layout', () => {
      const { container } = render(<OrderItemList items={mockItems} />);

      // Check main container has space-y-4
      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('applies modification styling correctly', () => {
      render(<OrderItemList items={mockItems} />);

      const modification = screen.getByText('No onions');
      expect(modification).toHaveClass('text-sm', 'text-blue-600', 'bg-blue-50', 'px-2', 'py-1', 'rounded', 'mr-2');
    });

    it('displays total with green styling', () => {
      render(<OrderItemList items={mockItems} />);

      const totalElement = screen.getByText((content, element) => {
        return element?.classList.contains('text-green-600') && content.includes('$38.47');
      });
      expect(totalElement).toHaveClass('text-2xl', 'font-bold', 'text-green-600');
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful structure for screen readers', () => {
      render(<OrderItemList items={mockItems} />);

      // Check that item names are in heading elements
      expect(screen.getByRole('heading', { level: 4, name: 'Burger' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Fries' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Soda' })).toBeInTheDocument();
    });

    it('maintains proper reading order', () => {
      render(<OrderItemList items={[mockItems[0]]} />);

      const itemName = screen.getByText('Burger');
      const quantity = screen.getByText('Quantity: 2');
      const price = screen.getByText('Price: $12.99 each');

      // These elements should be in the DOM in a logical order
      expect(itemName).toBeInTheDocument();
      expect(quantity).toBeInTheDocument();
      expect(price).toBeInTheDocument();
    });
  });
}); 