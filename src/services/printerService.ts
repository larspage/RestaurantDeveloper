import api from './api';

export interface Printer {
  id: string;
  name: string;
  type: 'kitchen' | 'receipt' | 'label';
  connection_type: 'network' | 'usb' | 'bluetooth';
  ip_address?: string;
  port?: number;
  usb_device?: string;
  auto_print_orders: boolean;
  enabled: boolean;
  status: 'online' | 'offline' | 'error';
  last_checked: string;
  created_at: string;
  updated_at?: string;
}

export interface PrintJob {
  id: string;
  order_id: string;
  printer_id: string;
  print_type: 'kitchen' | 'receipt' | 'label';
  status: 'queued' | 'printing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  attempts: number;
  max_attempts: number;
  error?: string;
  retry_at?: string;
}

export interface PrinterTestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface CreatePrinterData {
  name: string;
  type: 'kitchen' | 'receipt' | 'label';
  connection_type: 'network' | 'usb' | 'bluetooth';
  ip_address?: string;
  port?: number;
  usb_device?: string;
  auto_print_orders?: boolean;
  enabled?: boolean;
}

export interface UpdatePrinterData {
  name?: string;
  type?: 'kitchen' | 'receipt' | 'label';
  connection_type?: 'network' | 'usb' | 'bluetooth';
  ip_address?: string;
  port?: number;
  usb_device?: string;
  auto_print_orders?: boolean;
  enabled?: boolean;
}

export interface PrintOrderData {
  printer_id: string;
  print_type: 'kitchen' | 'receipt' | 'label';
}

class PrinterService {
  // Get all printers for a restaurant
  async getRestaurantPrinters(restaurantId: string): Promise<Printer[]> {
    const response = await api.get(`/printers/restaurants/${restaurantId}/printers`);
    return response.data;
  }

  // Add new printer
  async createPrinter(restaurantId: string, printerData: CreatePrinterData): Promise<Printer> {
    const response = await api.post(`/printers/restaurants/${restaurantId}/printers`, printerData);
    return response.data;
  }

  // Update printer configuration
  async updatePrinter(restaurantId: string, printerId: string, printerData: UpdatePrinterData): Promise<Printer> {
    const response = await api.put(`/printers/restaurants/${restaurantId}/printers/${printerId}`, printerData);
    return response.data;
  }

  // Delete printer
  async deletePrinter(restaurantId: string, printerId: string): Promise<void> {
    await api.delete(`/printers/restaurants/${restaurantId}/printers/${printerId}`);
  }

  // Test printer connection
  async testPrinter(restaurantId: string, printerId: string): Promise<PrinterTestResult> {
    const response = await api.post(`/printers/restaurants/${restaurantId}/printers/${printerId}/test`);
    return response.data;
  }

  // Print order
  async printOrder(orderId: string, printData: PrintOrderData): Promise<PrintJob> {
    const response = await api.post(`/printers/orders/${orderId}/print`, printData);
    return response.data;
  }

  // Get print queue
  async getPrintQueue(restaurantId: string): Promise<PrintJob[]> {
    const response = await api.get(`/printers/print-queue/${restaurantId}`);
    return response.data;
  }

  // Retry failed print job
  async retryPrintJob(restaurantId: string, jobId: string): Promise<PrintJob> {
    const response = await api.post(`/printers/print-queue/${restaurantId}/${jobId}/retry`);
    return response.data;
  }

  // Get printer types for UI
  getPrinterTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'kitchen', label: 'Kitchen Printer', description: 'For kitchen tickets and order preparation' },
      { value: 'receipt', label: 'Receipt Printer', description: 'For customer receipts and order confirmations' },
      { value: 'label', label: 'Label Printer', description: 'For order labels and packaging' }
    ];
  }

  // Get connection types for UI
  getConnectionTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'network', label: 'Network (IP)', description: 'Connect via network IP address' },
      { value: 'usb', label: 'USB', description: 'Connect via USB cable' },
      { value: 'bluetooth', label: 'Bluetooth', description: 'Connect via Bluetooth pairing' }
    ];
  }

  // Get status color for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-gray-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  }

  // Get status badge color for UI
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Get print job status color for UI
  getPrintJobStatusColor(status: string): string {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'printing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Format printer connection info for display
  formatConnectionInfo(printer: Printer): string {
    switch (printer.connection_type) {
      case 'network':
        return `${printer.ip_address}:${printer.port}`;
      case 'usb':
        return printer.usb_device || 'USB Device';
      case 'bluetooth':
        return 'Bluetooth Connection';
      default:
        return 'Unknown Connection';
    }
  }

  // Validate printer configuration
  validatePrinterConfig(printerData: CreatePrinterData): string[] {
    const errors: string[] = [];

    if (!printerData.name?.trim()) {
      errors.push('Printer name is required');
    }

    if (!printerData.type) {
      errors.push('Printer type is required');
    }

    if (!printerData.connection_type) {
      errors.push('Connection type is required');
    }

    if (printerData.connection_type === 'network') {
      if (!printerData.ip_address?.trim()) {
        errors.push('IP address is required for network printers');
      }
      if (!printerData.port || printerData.port <= 0 || printerData.port > 65535) {
        errors.push('Valid port number is required for network printers');
      }
    }

    if (printerData.connection_type === 'usb') {
      if (!printerData.usb_device?.trim()) {
        errors.push('USB device path is required for USB printers');
      }
    }

    return errors;
  }
}

export const printerService = new PrinterService(); 