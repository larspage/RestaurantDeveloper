import React, { useState } from 'react';
import { Order } from '../services/orderService';
import { Restaurant } from '../services/restaurantService';

interface PrintOrderButtonProps {
  order: Order;
  restaurant: Restaurant;
  className?: string;
}

const PrintOrderButton: React.FC<PrintOrderButtonProps> = ({ order, restaurant, className = '' }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const generatePrintContent = () => {
    const orderDateTime = formatDateTime(order.createdAt);
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
            <p><strong>Date:</strong> ${orderDateTime.date}</p>
            <p><strong>Time:</strong> ${orderDateTime.time}</p>
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

  const handlePrint = () => {
    setIsPrinting(true);
    
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintContent());
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } else {
        // Fallback to browser print if popup is blocked
        const printContent = generatePrintContent();
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore the page
      }
    } catch (error) {
      console.error('Print failed:', error);
      // Fallback to simple browser print
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
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
      {isPrinting ? 'Printing...' : 'Print Order'}
    </button>
  );
};

export default PrintOrderButton; 