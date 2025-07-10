/// <reference types="jest" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedPrintOrderButton from '../../components/AdvancedPrintOrderButton';

// Mock the printer service
jest.mock('../../services/printerService', () => ({
  printerService: {
    getRestaurantPrinters: jest.fn(),
    printOrder: jest.fn(),
    getStatusBadgeColor: jest.fn((status) => {
      const colors = {
        online: 'bg-green-100 text-green-800',
        offline: 'bg-gray-100 text-gray-800',
        error: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    }),
    formatConnectionInfo: jest.fn((printer) => {
      if (printer.connection_type === 'network') {
        return `${printer.ip_address}:${printer.port}`;
      } else if (printer.connection_type === 'usb') {
        return printer.usb_device || 'USB Device';
      }
      return 'Bluetooth Connection';
    })
  }
}));

const mockOrder = {
  _id: 'order123',
  restaurant: 'restaurant123',
  items: [
    { name: 'Pizza Margherita', price: 15.99, quantity: 1 },
    { name: 'Caesar Salad', price: 8.99, quantity: 2 }
  ],
  total_price: 33.97,
  status: 'confirmed',
  guest_info: {
    name: 'John Doe',
    phone: '123-456-7890',
    email: 'john@example.com'
  },
  created_at: '2024-01-01T12:00:00Z'
};

const mockPrinters = [
  {
    id: 'printer001',
    name: 'Kitchen Printer 1',
    type: 'kitchen',
    connection_type: 'network',
    ip_address: '192.168.1.100',
    port: 9100,
    auto_print_orders: true,
    enabled: true,
    status: 'online',
    last_checked: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'printer002',
    name: 'Receipt Printer 1',
    type: 'receipt',
    connection_type: 'usb',
    usb_device: '/dev/usb/lp0',
    auto_print_orders: false,
    enabled: true,
    status: 'offline',
    last_checked: '2024-01-01T11:30:00Z',
    created_at: '2024-01-01T10:15:00Z'
  },
  {
    id: 'printer003',
    name: 'Label Printer 1',
    type: 'label',
    connection_type: 'bluetooth',
    auto_print_orders: false,
    enabled: false,
    status: 'error',
    last_checked: '2024-01-01T11:00:00Z',
    created_at: '2024-01-01T10:30:00Z'
  }
];

describe('AdvancedPrintOrderButton Component', () => {
  const mockProps = {
    order: mockOrder,
    restaurantId: 'restaurant123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { printerService } = require('../../services/printerService');
    printerService.getRestaurantPrinters.mockResolvedValue(mockPrinters);
  });

  describe('Initial Render', () => {
    it('should render the print button', () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      expect(screen.getByTestId('advanced-print-button')).toBeInTheDocument();
      expect(screen.getByText('Print Order')).toBeInTheDocument();
    });

    it('should have print icon', () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      expect(screen.getByTestId('print-icon')).toBeInTheDocument();
    });

    it('should be accessible', () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      const button = screen.getByTestId('advanced-print-button');
      expect(button).toHaveAttribute('aria-label', 'Print order options');
    });
  });

  describe('Print Options Menu', () => {
    it('should open print options menu on click', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('printer-selection-menu')).toBeInTheDocument();
      });
    });

    it('should display available printers', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Kitchen Printer 1')).toBeInTheDocument();
        expect(screen.getByText('Receipt Printer 1')).toBeInTheDocument();
        expect(screen.getByText('Label Printer 1')).toBeInTheDocument();
      });
    });

    it('should show printer status badges', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        const statusBadges = screen.getAllByTestId('printer-status-badge');
        expect(statusBadges).toHaveLength(3);
        expect(statusBadges[0]).toHaveTextContent('online');
        expect(statusBadges[1]).toHaveTextContent('offline');
        expect(statusBadges[2]).toHaveTextContent('error');
      });
    });

    it('should show connection information', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByText('192.168.1.100:9100')).toBeInTheDocument();
        expect(screen.getByText('/dev/usb/lp0')).toBeInTheDocument();
        expect(screen.getByText('Bluetooth Connection')).toBeInTheDocument();
      });
    });

    it('should group printers by type', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Kitchen Printers')).toBeInTheDocument();
        expect(screen.getByText('Receipt Printers')).toBeInTheDocument();
        expect(screen.getByText('Label Printers')).toBeInTheDocument();
      });
    });

    it('should close menu when clicking outside', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('printer-selection-menu')).toBeInTheDocument();
      });
      
      // Click outside the menu
      fireEvent.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByTestId('printer-selection-menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Printer Selection', () => {
    it('should print to kitchen printer', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockResolvedValue({
        id: 'job123',
        order_id: 'order123',
        printer_id: 'printer001',
        print_type: 'kitchen',
        status: 'queued'
      });
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('kitchen-print-button'));
      
      await waitFor(() => {
        expect(printerService.printOrder).toHaveBeenCalledWith('order123', {
          printer_id: 'printer001',
          print_type: 'kitchen'
        });
      });
    });

    it('should print to receipt printer', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockResolvedValue({
        id: 'job124',
        order_id: 'order123',
        printer_id: 'printer002',
        print_type: 'receipt',
        status: 'queued'
      });
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('receipt-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('receipt-print-button'));
      
      await waitFor(() => {
        expect(printerService.printOrder).toHaveBeenCalledWith('order123', {
          printer_id: 'printer002',
          print_type: 'receipt'
        });
      });
    });

    it('should show success notification after printing', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockResolvedValue({
        id: 'job123',
        order_id: 'order123',
        printer_id: 'printer001',
        print_type: 'kitchen',
        status: 'queued'
      });
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('kitchen-print-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('success-notification')).toBeInTheDocument();
        expect(screen.getByText('Print job sent to Kitchen Printer 1')).toBeInTheDocument();
      });
    });

    it('should disable offline printers', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        const offlinePrinterButton = screen.getByTestId('receipt-print-button');
        expect(offlinePrinterButton).toBeDisabled();
      });
    });

    it('should disable error printers', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        const errorPrinterButton = screen.getByTestId('label-print-button');
        expect(errorPrinterButton).toBeDisabled();
      });
    });

    it('should disable disabled printers', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        const disabledPrinterButton = screen.getByTestId('label-print-button');
        expect(disabledPrinterButton).toBeDisabled();
      });
    });
  });

  describe('Browser Print Fallback', () => {
    it('should show browser print option', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('browser-print-button')).toBeInTheDocument();
        expect(screen.getByText('Browser Print')).toBeInTheDocument();
      });
    });

    it('should trigger browser print dialog', async () => {
      // Mock window.print
      window.print = jest.fn();
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('browser-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('browser-print-button'));
      
      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle printer loading errors', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockRejectedValue(new Error('Failed to load printers'));
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to load printers')).toBeInTheDocument();
      });
    });

    it('should handle print job errors', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockRejectedValue(new Error('Print job failed'));
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('kitchen-print-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-notification')).toBeInTheDocument();
        expect(screen.getByText('Print job failed')).toBeInTheDocument();
      });
    });

    it('should show retry option for failed prints', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockRejectedValue(new Error('Print job failed'));
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('kitchen-print-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('retry-print-button')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching printers', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPrinters), 1000))
      );
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading state while printing', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.printOrder.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: 'job123',
          order_id: 'order123',
          printer_id: 'printer001',
          print_type: 'kitchen',
          status: 'queued'
        }), 1000))
      );
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('kitchen-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('kitchen-print-button'));
      
      expect(screen.getByTestId('kitchen-print-button')).toBeDisabled();
      expect(screen.getByText('Printing...')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show message when no printers available', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockResolvedValue([]);
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('no-printers-message')).toBeInTheDocument();
        expect(screen.getByText('No printers configured')).toBeInTheDocument();
      });
    });

    it('should show setup link when no printers available', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockResolvedValue([]);
      
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('setup-printers-link')).toBeInTheDocument();
        expect(screen.getByText('Set up printers')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      const button = screen.getByTestId('print-options-button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
      
      // Press Enter to open menu
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('printer-selection-menu')).toBeInTheDocument();
      });
    });

    it('should close menu on Escape key', async () => {
      render(<AdvancedPrintOrderButton {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-options-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('printer-selection-menu')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('printer-selection-menu')).not.toBeInTheDocument();
      });
    });
  });
}); 