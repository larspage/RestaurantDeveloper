import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderStatusBadge from '../OrderStatusBadge';
import { OrderStatus } from '../../services/orderService';

describe('OrderStatusBadge', () => {
  describe('Status Display', () => {
    it('renders "New Order" for received status', () => {
      render(<OrderStatusBadge status="received" />);
      
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    it('renders "Confirmed" for confirmed status', () => {
      render(<OrderStatusBadge status="confirmed" />);
      
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('renders "Preparing" for in_kitchen status', () => {
      render(<OrderStatusBadge status="in_kitchen" />);
      
      expect(screen.getByText('Preparing')).toBeInTheDocument();
    });

    it('renders "Ready" for ready_for_pickup status', () => {
      render(<OrderStatusBadge status="ready_for_pickup" />);
      
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders "Completed" for delivered status', () => {
      render(<OrderStatusBadge status="delivered" />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('renders "Cancelled" for cancelled status', () => {
      render(<OrderStatusBadge status="cancelled" />);
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Styling Classes', () => {
    it('applies blue styling for received status', () => {
      render(<OrderStatusBadge status="received" />);
      
      const badge = screen.getByText('New Order');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('applies yellow styling for confirmed status', () => {
      render(<OrderStatusBadge status="confirmed" />);
      
      const badge = screen.getByText('Confirmed');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('applies orange styling for in_kitchen status', () => {
      render(<OrderStatusBadge status="in_kitchen" />);
      
      const badge = screen.getByText('Preparing');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
    });

    it('applies green styling for ready_for_pickup status', () => {
      render(<OrderStatusBadge status="ready_for_pickup" />);
      
      const badge = screen.getByText('Ready');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('applies gray styling for delivered status', () => {
      render(<OrderStatusBadge status="delivered" />);
      
      const badge = screen.getByText('Completed');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
    });

    it('applies red styling for cancelled status', () => {
      render(<OrderStatusBadge status="cancelled" />);
      
      const badge = screen.getByText('Cancelled');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('applies default base classes', () => {
      render(<OrderStatusBadge status="received" />);
      
      const badge = screen.getByText('New Order');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'px-2.5',
        'py-0.5',
        'rounded-full',
        'text-xs',
        'font-medium',
        'border'
      );
    });
  });

  describe('Custom className', () => {
    it('applies custom className when provided', () => {
      render(<OrderStatusBadge status="received" className="custom-class" />);
      
      const badge = screen.getByText('New Order');
      expect(badge).toHaveClass('custom-class');
    });

    it('combines custom className with default classes', () => {
      render(<OrderStatusBadge status="confirmed" className="ml-2 extra-spacing" />);
      
      const badge = screen.getByText('Confirmed');
      expect(badge).toHaveClass('ml-2', 'extra-spacing', 'bg-yellow-100', 'text-yellow-800');
    });

    it('works without custom className', () => {
      render(<OrderStatusBadge status="delivered" />);
      
      const badge = screen.getByText('Completed');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).not.toHaveClass('undefined');
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown status with default styling', () => {
      // TypeScript would normally prevent this, but testing runtime behavior
      render(<OrderStatusBadge status={'unknown_status' as OrderStatus} />);
      
      const badge = screen.getByText('unknown_status');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
    });

    it('renders as span element', () => {
      render(<OrderStatusBadge status="received" />);
      
      const badge = screen.getByText('New Order');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful text content for screen readers', () => {
      render(<OrderStatusBadge status="in_kitchen" />);
      
      expect(screen.getByText('Preparing')).toBeInTheDocument();
    });

    it('maintains semantic meaning across all statuses', () => {
      const statuses: OrderStatus[] = [
        'received', 
        'confirmed', 
        'in_kitchen', 
        'ready_for_pickup', 
        'delivered', 
        'cancelled'
      ];
      
      const expectedLabels = [
        'New Order',
        'Confirmed', 
        'Preparing',
        'Ready',
        'Completed',
        'Cancelled'
      ];

      statuses.forEach((status, index) => {
        const { unmount } = render(<OrderStatusBadge status={status} />);
        expect(screen.getByText(expectedLabels[index])).toBeInTheDocument();
        unmount();
      });
    });
  });
}); 