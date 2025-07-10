/// <reference types="jest" />
import '@testing-library/jest-dom';
import { printerService, Printer, PrintJob, CreatePrinterData } from '../../services/printerService';

// Mock the api module
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Import the mocked api
import api from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

describe('PrinterService', () => {
  const mockRestaurantId = 'restaurant123';
  const mockPrinterId = 'printer123';
  const mockOrderId = 'order123';

  const mockPrinter: Printer = {
    id: mockPrinterId,
    name: 'Kitchen Printer 1',
    type: 'kitchen',
    connection_type: 'network',
    ip_address: '192.168.1.100',
    port: 9100,
    auto_print_orders: true,
    enabled: true,
    status: 'online',
    last_checked: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockPrintJob: PrintJob = {
    id: 'job123',
    order_id: mockOrderId,
    printer_id: mockPrinterId,
    print_type: 'kitchen',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    completed_at: '2024-01-01T00:01:00Z',
    attempts: 1,
    max_attempts: 3
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRestaurantPrinters', () => {
    it('should fetch restaurant printers successfully', async () => {
      mockApi.get.mockResolvedValue({ data: [mockPrinter] });

      const result = await printerService.getRestaurantPrinters(mockRestaurantId);

      expect(mockApi.get).toHaveBeenCalledWith(`/printers/restaurants/${mockRestaurantId}/printers`);
      expect(result).toEqual([mockPrinter]);
    });

    it('should handle API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      await expect(printerService.getRestaurantPrinters(mockRestaurantId))
        .rejects.toThrow('API Error');
    });
  });

  describe('createPrinter', () => {
    const mockCreateData: CreatePrinterData = {
      name: 'New Printer',
      type: 'receipt',
      connection_type: 'network',
      ip_address: '192.168.1.101',
      port: 9100,
      auto_print_orders: false,
      enabled: true
    };

    it('should create a new printer successfully', async () => {
      mockedApi.post.mockResolvedValue({ data: mockPrinter });

      const result = await printerService.createPrinter(mockRestaurantId, mockCreateData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        `/printers/restaurants/${mockRestaurantId}/printers`,
        mockCreateData
      );
      expect(result).toEqual(mockPrinter);
    });

    it('should handle creation errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Creation failed'));

      await expect(printerService.createPrinter(mockRestaurantId, mockCreateData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('updatePrinter', () => {
    const mockUpdateData = {
      name: 'Updated Printer',
      enabled: false
    };

    it('should update printer successfully', async () => {
      const updatedPrinter = { ...mockPrinter, ...mockUpdateData };
      mockedApi.put.mockResolvedValue({ data: updatedPrinter });

      const result = await printerService.updatePrinter(mockRestaurantId, mockPrinterId, mockUpdateData);

      expect(mockedApi.put).toHaveBeenCalledWith(
        `/printers/restaurants/${mockRestaurantId}/printers/${mockPrinterId}`,
        mockUpdateData
      );
      expect(result).toEqual(updatedPrinter);
    });
  });

  describe('deletePrinter', () => {
    it('should delete printer successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await printerService.deletePrinter(mockRestaurantId, mockPrinterId);

      expect(mockedApi.delete).toHaveBeenCalledWith(
        `/printers/restaurants/${mockRestaurantId}/printers/${mockPrinterId}`
      );
    });
  });

  describe('testPrinter', () => {
    it('should test printer connection successfully', async () => {
      const testResult = { success: true, message: 'Test successful', timestamp: '2024-01-01T00:00:00Z' };
      mockedApi.post.mockResolvedValue({ data: testResult });

      const result = await printerService.testPrinter(mockRestaurantId, mockPrinterId);

      expect(mockedApi.post).toHaveBeenCalledWith(
        `/printers/restaurants/${mockRestaurantId}/printers/${mockPrinterId}/test`
      );
      expect(result).toEqual(testResult);
    });

    it('should handle test failures', async () => {
      const testResult = { success: false, message: 'Connection failed', timestamp: '2024-01-01T00:00:00Z' };
      mockedApi.post.mockResolvedValue({ data: testResult });

      const result = await printerService.testPrinter(mockRestaurantId, mockPrinterId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed');
    });
  });

  describe('printOrder', () => {
    const printData = {
      printer_id: mockPrinterId,
      print_type: 'kitchen' as const
    };

    it('should create print job successfully', async () => {
      mockedApi.post.mockResolvedValue({ data: mockPrintJob });

      const result = await printerService.printOrder(mockOrderId, printData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        `/printers/orders/${mockOrderId}/print`,
        printData
      );
      expect(result).toEqual(mockPrintJob);
    });
  });

  describe('getPrintQueue', () => {
    it('should fetch print queue successfully', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockPrintJob] });

      const result = await printerService.getPrintQueue(mockRestaurantId);

      expect(mockedApi.get).toHaveBeenCalledWith(`/printers/print-queue/${mockRestaurantId}`);
      expect(result).toEqual([mockPrintJob]);
    });
  });

  describe('retryPrintJob', () => {
    it('should retry failed print job successfully', async () => {
      const retriedJob = { ...mockPrintJob, attempts: 2 };
      mockedApi.post.mockResolvedValue({ data: retriedJob });

      const result = await printerService.retryPrintJob(mockRestaurantId, mockPrintJob.id);

      expect(mockedApi.post).toHaveBeenCalledWith(
        `/printers/print-queue/${mockRestaurantId}/${mockPrintJob.id}/retry`
      );
      expect(result).toEqual(retriedJob);
    });
  });

  describe('utility functions', () => {
    describe('getPrinterTypes', () => {
      it('should return available printer types', () => {
        const types = printerService.getPrinterTypes();
        
        expect(types).toHaveLength(3);
        expect(types[0]).toEqual({
          value: 'kitchen',
          label: 'Kitchen Printer',
          description: 'For kitchen tickets and order preparation'
        });
      });
    });

    describe('getConnectionTypes', () => {
      it('should return available connection types', () => {
        const types = printerService.getConnectionTypes();
        
        expect(types).toHaveLength(3);
        expect(types[0]).toEqual({
          value: 'network',
          label: 'Network (IP)',
          description: 'Connect via network IP address'
        });
      });
    });

    describe('getStatusColor', () => {
      it('should return correct colors for different statuses', () => {
        expect(printerService.getStatusColor('online')).toBe('text-green-600');
        expect(printerService.getStatusColor('offline')).toBe('text-gray-500');
        expect(printerService.getStatusColor('error')).toBe('text-red-600');
        expect(printerService.getStatusColor('unknown')).toBe('text-gray-500');
      });
    });

    describe('getStatusBadgeColor', () => {
      it('should return correct badge colors for different statuses', () => {
        expect(printerService.getStatusBadgeColor('online')).toBe('bg-green-100 text-green-800');
        expect(printerService.getStatusBadgeColor('offline')).toBe('bg-gray-100 text-gray-800');
        expect(printerService.getStatusBadgeColor('error')).toBe('bg-red-100 text-red-800');
      });
    });

    describe('getPrintJobStatusColor', () => {
      it('should return correct colors for print job statuses', () => {
        expect(printerService.getPrintJobStatusColor('queued')).toBe('bg-yellow-100 text-yellow-800');
        expect(printerService.getPrintJobStatusColor('printing')).toBe('bg-blue-100 text-blue-800');
        expect(printerService.getPrintJobStatusColor('completed')).toBe('bg-green-100 text-green-800');
        expect(printerService.getPrintJobStatusColor('failed')).toBe('bg-red-100 text-red-800');
      });
    });

    describe('formatConnectionInfo', () => {
      it('should format network connection info', () => {
        const networkPrinter = { ...mockPrinter, connection_type: 'network' as const };
        expect(printerService.formatConnectionInfo(networkPrinter)).toBe('192.168.1.100:9100');
      });

      it('should format USB connection info', () => {
        const usbPrinter = { ...mockPrinter, connection_type: 'usb' as const, usb_device: '/dev/usb/lp0' };
        expect(printerService.formatConnectionInfo(usbPrinter)).toBe('/dev/usb/lp0');
      });

      it('should format Bluetooth connection info', () => {
        const bluetoothPrinter = { ...mockPrinter, connection_type: 'bluetooth' as const };
        expect(printerService.formatConnectionInfo(bluetoothPrinter)).toBe('Bluetooth Connection');
      });
    });

    describe('validatePrinterConfig', () => {
      it('should validate complete network printer config', () => {
        const validConfig: CreatePrinterData = {
          name: 'Test Printer',
          type: 'kitchen',
          connection_type: 'network',
          ip_address: '192.168.1.100',
          port: 9100
        };

        const errors = printerService.validatePrinterConfig(validConfig);
        expect(errors).toHaveLength(0);
      });

      it('should validate complete USB printer config', () => {
        const validConfig: CreatePrinterData = {
          name: 'Test Printer',
          type: 'receipt',
          connection_type: 'usb',
          usb_device: '/dev/usb/lp0'
        };

        const errors = printerService.validatePrinterConfig(validConfig);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const invalidConfig: CreatePrinterData = {
          name: '',
          type: 'kitchen',
          connection_type: 'network'
        };

        const errors = printerService.validatePrinterConfig(invalidConfig);
        expect(errors).toContain('Printer name is required');
        expect(errors).toContain('IP address is required for network printers');
        expect(errors).toContain('Valid port number is required for network printers');
      });

      it('should validate port range for network printers', () => {
        const invalidConfig: CreatePrinterData = {
          name: 'Test Printer',
          type: 'kitchen',
          connection_type: 'network',
          ip_address: '192.168.1.100',
          port: 70000
        };

        const errors = printerService.validatePrinterConfig(invalidConfig);
        expect(errors).toContain('Valid port number is required for network printers');
      });

      it('should require USB device for USB printers', () => {
        const invalidConfig: CreatePrinterData = {
          name: 'Test Printer',
          type: 'kitchen',
          connection_type: 'usb'
        };

        const errors = printerService.validatePrinterConfig(invalidConfig);
        expect(errors).toContain('USB device path is required for USB printers');
      });
    });
  });
}); 