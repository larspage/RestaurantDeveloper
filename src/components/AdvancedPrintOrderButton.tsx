import React, { useState, useEffect } from 'react';
import { Order } from '../services/orderService';
import { Restaurant } from '../services/restaurantService';
import { Printer, printerService } from '../services/printerService';
// Simple toast component for individual notifications
const SimpleToast: React.FC<{ type: 'success' | 'error'; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
      <div className={`p-4 border-l-4 ${type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm text-gray-900">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdvancedPrintOrderButtonProps {
  order: Order;
  restaurant: Restaurant;
  className?: string;
}

const AdvancedPrintOrderButton: React.FC<AdvancedPrintOrderButtonProps> = ({ 
  order, 
  restaurant, 
  className = '' 
}) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [showPrinterMenu, setShowPrinterMenu] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPrinters();
  }, [restaurant._id]);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      const printersData = await printerService.getRestaurantPrinters(restaurant._id || '');
      setPrinters(printersData.filter(p => p.enabled));
    } catch (err) {
      console.error('Failed to load printers:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePrint = async (printer: Printer, printType: 'kitchen' | 'receipt' | 'label') => {
    try {
      setPrinting(printer.id);
      await printerService.printOrder(order._id, {
        printer_id: printer.id,
        print_type: printType
      });
      showNotification('success', `Print job sent to ${printer.name}`);
      setShowPrinterMenu(false);
    } catch (err) {
      showNotification('error', `Failed to print to ${printer.name}`);
    } finally {
      setPrinting(null);
    }
  };

  const handleQuickPrint = () => {
    // Find the first available printer for each type
    const kitchenPrinter = printers.find(p => p.type === 'kitchen' && p.status === 'online');
    const receiptPrinter = printers.find(p => p.type === 'receipt' && p.status === 'online');

    if (kitchenPrinter) {
      handlePrint(kitchenPrinter, 'kitchen');
    } else if (receiptPrinter) {
      handlePrint(receiptPrinter, 'receipt');
    } else {
      // Fallback to browser print
      handleBrowserPrint();
    }
  };

  const handleBrowserPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintContent());
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const generatePrintContent = () => {
    const orderDateTime = new Date(order.createdAt).toLocaleString();
    const customerName = order.guest_info?.name || 'Customer';
    const customerPhone = order.guest_info?.phone || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${order._id.slice(-8).toUpperCase()}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .no-print { display: none; }
            }
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .restaurant-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .order-info { margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 18px; }
            .notes { margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${restaurant.name}</div>
            <div>${restaurant.location}</div>
          </div>

          <div class="order-info">
            <h2>Order #${order._id.slice(-8).toUpperCase()}</h2>
            <p><strong>Date:</strong> ${orderDateTime}</p>
            <p><strong>Status:</strong> ${order.status.replace('_', ' ').toUpperCase()}</p>
          </div>

          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customerName}</p>
            ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
            ${order.guest_info?.email ? `<p><strong>Email:</strong> ${order.guest_info.email}</p>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td><strong>$${order.total_price.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          ${order.notes ? `
            <div class="notes">
              <h3>Special Instructions</h3>
              <p>${order.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const availablePrinters = printers.filter(p => p.enabled);
  const onlinePrinters = printers.filter(p => p.enabled && p.status === 'online');

  return (
    <div className="relative">
      {notification && (
        <SimpleToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex space-x-2">
        {/* Quick Print Button */}
        <button
          onClick={handleQuickPrint}
          disabled={printing !== null}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors ${className}`}
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
            />
          </svg>
          {printing ? 'Printing...' : 'Print'}
        </button>

        {/* Advanced Print Options */}
        {availablePrinters.length > 0 && (
          <button
            onClick={() => setShowPrinterMenu(!showPrinterMenu)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Printer Selection Menu */}
      {showPrinterMenu && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Printer</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : availablePrinters.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No printers configured</p>
                <button
                  onClick={() => window.open(`/dashboard/restaurants/${restaurant._id}/printers`, '_blank')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Configure Printers
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availablePrinters.map((printer) => (
                  <div key={printer.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{printer.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${printerService.getStatusBadgeColor(printer.status)}`}>
                          {printer.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{printer.type}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {printer.type === 'kitchen' && (
                        <button
                          onClick={() => handlePrint(printer, 'kitchen')}
                          disabled={printing === printer.id || printer.status !== 'online'}
                          className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {printing === printer.id ? 'Printing...' : 'Kitchen Ticket'}
                        </button>
                      )}
                      {printer.type === 'receipt' && (
                        <button
                          onClick={() => handlePrint(printer, 'receipt')}
                          disabled={printing === printer.id || printer.status !== 'online'}
                          className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {printing === printer.id ? 'Printing...' : 'Receipt'}
                        </button>
                      )}
                      {printer.type === 'label' && (
                        <button
                          onClick={() => handlePrint(printer, 'label')}
                          disabled={printing === printer.id || printer.status !== 'online'}
                          className="flex-1 bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:bg-gray-400"
                        >
                          {printing === printer.id ? 'Printing...' : 'Label'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleBrowserPrint}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
              >
                Browser Print (Fallback)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPrintOrderButton; 