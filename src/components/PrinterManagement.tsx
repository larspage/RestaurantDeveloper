import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  PrintJob, 
  CreatePrinterData, 
  UpdatePrinterData, 
  printerService 
} from '../services/printerService';
import { NotificationToast } from './NotificationToast';

interface PrinterManagementProps {
  restaurantId: string;
  restaurantName: string;
}

const PrinterManagement: React.FC<PrinterManagementProps> = ({ restaurantId, restaurantName }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state for adding/editing printers
  const [formData, setFormData] = useState<CreatePrinterData>({
    name: '',
    type: 'kitchen',
    connection_type: 'network',
    ip_address: '',
    port: 9100,
    usb_device: '',
    auto_print_orders: false,
    enabled: true
  });

  const [activeTab, setActiveTab] = useState<'printers' | 'queue'>('printers');

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [printersData, queueData] = await Promise.all([
        printerService.getRestaurantPrinters(restaurantId),
        printerService.getPrintQueue(restaurantId)
      ]);
      setPrinters(printersData);
      setPrintQueue(queueData);
    } catch (err) {
      setError('Failed to load printer data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = printerService.validatePrinterConfig(formData);
    if (errors.length > 0) {
      showNotification('error', errors.join(', '));
      return;
    }

    try {
      if (editingPrinter) {
        // Update existing printer
        const updatedPrinter = await printerService.updatePrinter(
          restaurantId, 
          editingPrinter.id, 
          formData as UpdatePrinterData
        );
        setPrinters(prev => prev.map(p => p.id === editingPrinter.id ? updatedPrinter : p));
        showNotification('success', 'Printer updated successfully');
      } else {
        // Add new printer
        const newPrinter = await printerService.createPrinter(restaurantId, formData);
        setPrinters(prev => [...prev, newPrinter]);
        showNotification('success', 'Printer added successfully');
      }
      
      resetForm();
    } catch (err) {
      showNotification('error', 'Failed to save printer configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'kitchen',
      connection_type: 'network',
      ip_address: '',
      port: 9100,
      usb_device: '',
      auto_print_orders: false,
      enabled: true
    });
    setShowAddPrinter(false);
    setEditingPrinter(null);
  };

  const handleEdit = (printer: Printer) => {
    setFormData({
      name: printer.name,
      type: printer.type,
      connection_type: printer.connection_type,
      ip_address: printer.ip_address || '',
      port: printer.port || 9100,
      usb_device: printer.usb_device || '',
      auto_print_orders: printer.auto_print_orders,
      enabled: printer.enabled
    });
    setEditingPrinter(printer);
    setShowAddPrinter(true);
  };

  const handleDelete = async (printerId: string) => {
    if (!confirm('Are you sure you want to delete this printer?')) return;

    try {
      await printerService.deletePrinter(restaurantId, printerId);
      setPrinters(prev => prev.filter(p => p.id !== printerId));
      showNotification('success', 'Printer deleted successfully');
    } catch (err) {
      showNotification('error', 'Failed to delete printer');
    }
  };

  const handleTest = async (printerId: string) => {
    try {
      setTestingPrinter(printerId);
      const result = await printerService.testPrinter(restaurantId, printerId);
      
      if (result.success) {
        showNotification('success', 'Printer test successful');
        // Update printer status
        setPrinters(prev => prev.map(p => 
          p.id === printerId ? { ...p, status: 'online' as const } : p
        ));
      } else {
        showNotification('error', `Printer test failed: ${result.message}`);
        // Update printer status
        setPrinters(prev => prev.map(p => 
          p.id === printerId ? { ...p, status: 'error' as const } : p
        ));
      }
    } catch (err) {
      showNotification('error', 'Failed to test printer');
    } finally {
      setTestingPrinter(null);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await printerService.retryPrintJob(restaurantId, jobId);
      showNotification('success', 'Print job retried');
      loadData(); // Refresh data
    } catch (err) {
      showNotification('error', 'Failed to retry print job');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Printer Management - {restaurantName}
          </h1>
          <p className="text-gray-600 mt-1">
            Configure and manage thermal printers for your restaurant
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('printers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'printers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Printers ({printers.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Print Queue ({printQueue.length})
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'printers' && (
            <div>
              {/* Add Printer Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddPrinter(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Printer
                </button>
              </div>

              {/* Printers List */}
              {printers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No printers configured</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first printer.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {printers.map((printer) => (
                    <div key={printer.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{printer.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${printerService.getStatusBadgeColor(printer.status)}`}>
                          {printer.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Type:</span> {printer.type}
                        </div>
                        <div>
                          <span className="font-medium">Connection:</span> {printerService.formatConnectionInfo(printer)}
                        </div>
                        <div>
                          <span className="font-medium">Auto Print:</span> {printer.auto_print_orders ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <span className={`ml-1 ${printerService.getStatusColor(printer.status)}`}>
                            {printer.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleTest(printer.id)}
                          disabled={testingPrinter === printer.id}
                          className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {testingPrinter === printer.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleEdit(printer)}
                          className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(printer.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div>
              {/* Print Queue */}
              {printQueue.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No print jobs</h3>
                  <p className="mt-1 text-sm text-gray-500">Print jobs will appear here when orders are printed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {printQueue.map((job) => (
                    <div key={job.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            Order #{job.order_id.slice(-8).toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${printerService.getPrintJobStatusColor(job.status)}`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(job.created_at)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Printer:</span> {job.printer_id}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {job.print_type}
                        </div>
                        <div>
                          <span className="font-medium">Attempts:</span> {job.attempts}/{job.max_attempts}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> {job.status}
                        </div>
                      </div>

                      {job.error && (
                        <div className="mt-2 text-sm text-red-600">
                          <span className="font-medium">Error:</span> {job.error}
                        </div>
                      )}

                      {job.status === 'failed' && job.attempts < job.max_attempts && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Retry Print
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Printer Modal */}
      {showAddPrinter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingPrinter ? 'Edit Printer' : 'Add Printer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Printer Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Kitchen Printer 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Printer Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {printerService.getPrinterTypes().map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={formData.connection_type}
                  onChange={(e) => setFormData({ ...formData, connection_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {printerService.getConnectionTypes().map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.connection_type === 'network' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 9100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="9100"
                      min="1"
                      max="65535"
                      required
                    />
                  </div>
                </>
              )}

              {formData.connection_type === 'usb' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    USB Device Path
                  </label>
                  <input
                    type="text"
                    value={formData.usb_device}
                    onChange={(e) => setFormData({ ...formData, usb_device: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/dev/usb/lp0 or COM1"
                    required
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-print"
                  checked={formData.auto_print_orders}
                  onChange={(e) => setFormData({ ...formData, auto_print_orders: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-print" className="ml-2 block text-sm text-gray-900">
                  Auto-print new orders
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enable printer
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPrinter ? 'Update' : 'Add'} Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterManagement; 