/// <reference types="jest" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrinterManagement from '../../components/PrinterManagement';

// Mock the printer service
jest.mock('../../services/printerService', () => ({
  printerService: {
    getRestaurantPrinters: jest.fn(),
    createPrinter: jest.fn(),
    updatePrinter: jest.fn(),
    deletePrinter: jest.fn(),
    testPrinter: jest.fn(),
    getPrintQueue: jest.fn(),
    retryPrintJob: jest.fn(),
    getPrinterTypes: jest.fn(() => [
      { value: 'kitchen', label: 'Kitchen Printer', description: 'For kitchen tickets' },
      { value: 'receipt', label: 'Receipt Printer', description: 'For customer receipts' },
      { value: 'label', label: 'Label Printer', description: 'For order labels' }
    ]),
    getConnectionTypes: jest.fn(() => [
      { value: 'network', label: 'Network (IP)', description: 'Connect via network IP' },
      { value: 'usb', label: 'USB', description: 'Connect via USB cable' },
      { value: 'bluetooth', label: 'Bluetooth', description: 'Connect via Bluetooth' }
    ]),
    getStatusBadgeColor: jest.fn((status) => {
      const colors = {
        online: 'bg-green-100 text-green-800',
        offline: 'bg-gray-100 text-gray-800',
        error: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    }),
    getPrintJobStatusColor: jest.fn((status) => {
      const colors = {
        queued: 'bg-yellow-100 text-yellow-800',
        printing: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
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
    }),
    validatePrinterConfig: jest.fn(() => [])
  }
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'restaurant123' },
    push: jest.fn(),
    pathname: '/dashboard/restaurants/restaurant123/printers'
  })
}));

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
  }
];

const mockPrintJobs = [
  {
    id: 'job001',
    order_id: 'order001',
    printer_id: 'printer001',
    print_type: 'kitchen',
    status: 'completed',
    created_at: '2024-01-01T12:15:00Z',
    completed_at: '2024-01-01T12:15:30Z',
    attempts: 1,
    max_attempts: 3
  },
  {
    id: 'job002',
    order_id: 'order002',
    printer_id: 'printer002',
    print_type: 'receipt',
    status: 'failed',
    created_at: '2024-01-01T12:20:00Z',
    attempts: 2,
    max_attempts: 3,
    error: 'Printer communication error'
  }
];

describe('PrinterManagement Component', () => {
  const mockProps = {
    restaurantId: 'restaurant123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { printerService } = require('../../services/printerService');
    printerService.getRestaurantPrinters.mockResolvedValue(mockPrinters);
    printerService.getPrintQueue.mockResolvedValue(mockPrintJobs);
  });

  describe('Initial Render', () => {
    it('should render printer management interface', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      expect(screen.getByTestId('printer-management-title')).toBeInTheDocument();
      expect(screen.getByTestId('printers-tab')).toBeInTheDocument();
      expect(screen.getByTestId('print-queue-tab')).toBeInTheDocument();
      expect(screen.getByTestId('add-printer-button')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Kitchen Printer 1')).toBeInTheDocument();
        expect(screen.getByText('Receipt Printer 1')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<PrinterManagement {...mockProps} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display printer cards after loading', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('printer-card')).toBeInTheDocument();
        expect(screen.getByText('Kitchen Printer 1')).toBeInTheDocument();
        expect(screen.getByText('Receipt Printer 1')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no printers exist', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockResolvedValue([]);
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('no-printers-message')).toBeInTheDocument();
        expect(screen.getByText('No printers configured')).toBeInTheDocument();
      });
    });

    it('should show empty state when no print jobs exist', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getPrintQueue.mockResolvedValue([]);
      
      render(<PrinterManagement {...mockProps} />);
      
      // Switch to print queue tab
      fireEvent.click(screen.getByTestId('print-queue-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('no-print-jobs-message')).toBeInTheDocument();
        expect(screen.getByText('No print jobs')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between printers and print queue tabs', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      // Initially on printers tab
      expect(screen.getByTestId('printers-tab')).toHaveClass('active');
      
      // Switch to print queue tab
      fireEvent.click(screen.getByTestId('print-queue-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('print-queue-tab')).toHaveClass('active');
        expect(screen.getByTestId('printers-tab')).not.toHaveClass('active');
      });
    });

    it('should maintain tab state when switching', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Kitchen Printer 1')).toBeInTheDocument();
      });
      
      // Switch to print queue
      fireEvent.click(screen.getByTestId('print-queue-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('print-job-card')).toBeInTheDocument();
      });
      
      // Switch back to printers
      fireEvent.click(screen.getByTestId('printers-tab'));
      
      await waitFor(() => {
        expect(screen.getByText('Kitchen Printer 1')).toBeInTheDocument();
      });
    });
  });

  describe('Printer Operations', () => {
    it('should open add printer modal', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('add-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('add-printer-button'));
      
      expect(screen.getByTestId('printer-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Add Printer');
    });

    it('should test printer connection', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.testPrinter.mockResolvedValue({
        success: true,
        message: 'Test successful',
        timestamp: '2024-01-01T12:00:00Z'
      });
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('test-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('test-printer-button'));
      
      await waitFor(() => {
        expect(printerService.testPrinter).toHaveBeenCalledWith('restaurant123', 'printer001');
      });
    });

    it('should handle printer test failure', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.testPrinter.mockResolvedValue({
        success: false,
        message: 'Connection failed',
        timestamp: '2024-01-01T12:00:00Z'
      });
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('test-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('test-printer-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-notification')).toBeInTheDocument();
      });
    });

    it('should delete printer with confirmation', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.deletePrinter.mockResolvedValue({});
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-printer-button'));
      
      await waitFor(() => {
        expect(printerService.deletePrinter).toHaveBeenCalledWith('restaurant123', 'printer001');
      });
    });

    it('should cancel printer deletion', async () => {
      const { printerService } = require('../../services/printerService');
      
      // Mock window.confirm to return false
      window.confirm = jest.fn(() => false);
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-printer-button'));
      
      // Should not call delete service
      expect(printerService.deletePrinter).not.toHaveBeenCalled();
    });
  });

  describe('Print Queue Operations', () => {
    it('should display print jobs', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-queue-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('print-job-card')).toBeInTheDocument();
        expect(screen.getByTestId('job-order-id')).toBeInTheDocument();
        expect(screen.getByTestId('job-status')).toBeInTheDocument();
      });
    });

    it('should retry failed print jobs', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.retryPrintJob.mockResolvedValue({
        ...mockPrintJobs[1],
        attempts: 3
      });
      
      render(<PrinterManagement {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('print-queue-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('retry-print-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('retry-print-button'));
      
      await waitFor(() => {
        expect(printerService.retryPrintJob).toHaveBeenCalledWith('restaurant123', 'job002');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate printer form fields', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.validatePrinterConfig.mockReturnValue([
        'Printer name is required',
        'IP address is required for network printers'
      ]);
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('add-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('add-printer-button'));
      fireEvent.click(screen.getByTestId('submit-printer-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Printer name is required')).toBeInTheDocument();
        expect(screen.getByText('IP address is required for network printers')).toBeInTheDocument();
      });
    });

    it('should show connection-specific fields', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('add-printer-button'));
      
      // Select network connection
      fireEvent.change(screen.getByTestId('connection-type-select'), {
        target: { value: 'network' }
      });
      
      expect(screen.getByTestId('ip-address-input')).toBeInTheDocument();
      expect(screen.getByTestId('port-input')).toBeInTheDocument();
      
      // Switch to USB connection
      fireEvent.change(screen.getByTestId('connection-type-select'), {
        target: { value: 'usb' }
      });
      
      expect(screen.getByTestId('usb-device-input')).toBeInTheDocument();
      expect(screen.queryByTestId('ip-address-input')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.getRestaurantPrinters.mockRejectedValue(new Error('API Error'));
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to load printer data')).toBeInTheDocument();
      });
    });

    it('should handle printer creation errors', async () => {
      const { printerService } = require('../../services/printerService');
      printerService.createPrinter.mockRejectedValue(new Error('Creation failed'));
      
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('add-printer-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('add-printer-button'));
      
      // Fill form with valid data
      fireEvent.change(screen.getByTestId('printer-name-input'), {
        target: { value: 'Test Printer' }
      });
      fireEvent.change(screen.getByTestId('printer-type-select'), {
        target: { value: 'kitchen' }
      });
      fireEvent.change(screen.getByTestId('connection-type-select'), {
        target: { value: 'network' }
      });
      fireEvent.change(screen.getByTestId('ip-address-input'), {
        target: { value: '192.168.1.100' }
      });
      fireEvent.change(screen.getByTestId('port-input'), {
        target: { value: '9100' }
      });
      
      fireEvent.click(screen.getByTestId('submit-printer-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-notification')).toBeInTheDocument();
      });
    });
  });

  describe('Printer Status Display', () => {
    it('should display printer status badges', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByTestId('printer-status');
        expect(statusBadges).toHaveLength(2);
        expect(statusBadges[0]).toHaveTextContent('online');
        expect(statusBadges[1]).toHaveTextContent('offline');
      });
    });

    it('should show connection information', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('192.168.1.100:9100')).toBeInTheDocument();
        expect(screen.getByText('/dev/usb/lp0')).toBeInTheDocument();
      });
    });

    it('should show auto-print status', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        const autoPrintBadges = screen.getAllByTestId('auto-print-badge');
        expect(autoPrintBadges[0]).toHaveTextContent('Auto Print: ON');
        expect(autoPrintBadges[1]).toHaveTextContent('Auto Print: OFF');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /printers/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /print queue/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<PrinterManagement {...mockProps} />);
      
      await waitFor(() => {
        const printersTab = screen.getByTestId('printers-tab');
        const printQueueTab = screen.getByTestId('print-queue-tab');
        
        expect(printersTab).toHaveAttribute('tabIndex', '0');
        expect(printQueueTab).toHaveAttribute('tabIndex', '0');
      });
    });
  });
}); 