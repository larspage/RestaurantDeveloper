import React from 'react';

interface PrintSettings {
  paper_format: {
    size: '58mm' | '80mm' | 'standard';
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
    line_spacing: number;
    auto_cut: boolean;
  };
  font_settings: {
    header_font_size: 'small' | 'medium' | 'large';
    body_font_size: 'small' | 'medium' | 'large';
    font_style: 'normal' | 'bold';
    print_density: 'light' | 'medium' | 'dark';
  };
  header_settings: {
    include_logo: boolean;
    logo_url: string;
    header_text: string;
    include_restaurant_info: boolean;
    include_contact_info: boolean;
    include_order_date: boolean;
  };
  kitchen_ticket: {
    enabled: boolean;
    show_customer_info: boolean;
    show_special_instructions: boolean;
    show_item_modifiers: boolean;
    show_preparation_time: boolean;
    group_by_category: boolean;
    highlight_allergens: boolean;
  };
  customer_receipt: {
    enabled: boolean;
    show_item_details: boolean;
    show_price_breakdown: boolean;
    show_tax_details: boolean;
    show_payment_method: boolean;
    include_thank_you_message: boolean;
    thank_you_message: string;
    include_reorder_info: boolean;
  };
}

interface PrintPreviewProps {
  settings: PrintSettings;
  restaurantName: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ settings, restaurantName }) => {
  const getPaperWidth = () => {
    switch (settings.paper_format.size) {
      case '58mm': return '58mm';
      case '80mm': return '80mm';
      case 'standard': return '210mm';
      default: return '80mm';
    }
  };

  const getFontSize = (type: 'header' | 'body') => {
    const size = type === 'header' ? settings.font_settings.header_font_size : settings.font_settings.body_font_size;
    switch (size) {
      case 'small': return '12px';
      case 'medium': return '14px';
      case 'large': return '16px';
      default: return '14px';
    }
  };

  const getLineHeight = () => {
    return settings.paper_format.line_spacing;
  };

  const mockOrderData = {
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '(555) 123-4567',
    orderDate: new Date().toLocaleDateString(),
    orderTime: new Date().toLocaleTimeString(),
    items: [
      {
        name: 'Margherita Pizza',
        quantity: 2,
        price: 15.99,
        modifiers: ['Extra Cheese', 'Thin Crust'],
        allergens: ['Gluten', 'Dairy'],
        category: 'Pizza'
      },
      {
        name: 'Caesar Salad',
        quantity: 1,
        price: 8.99,
        modifiers: ['No Croutons'],
        allergens: ['Dairy'],
        category: 'Salads'
      }
    ],
    specialInstructions: 'Please deliver to side door',
    subtotal: 40.97,
    tax: 3.28,
    total: 44.25,
    preparationTime: '25 minutes'
  };

  const previewStyle = {
    width: getPaperWidth(),
    minHeight: '200px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    padding: `${settings.paper_format.margin_top}mm ${settings.paper_format.margin_right}mm ${settings.paper_format.margin_bottom}mm ${settings.paper_format.margin_left}mm`,
    fontFamily: 'monospace',
    fontSize: getFontSize('body'),
    lineHeight: getLineHeight(),
    fontWeight: settings.font_settings.font_style === 'bold' ? 'bold' : 'normal',
    color: settings.font_settings.print_density === 'light' ? '#666' : settings.font_settings.print_density === 'dark' ? '#000' : '#333'
  };

  const headerStyle = {
    fontSize: getFontSize('header'),
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '8px'
  };

  const sectionStyle = {
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px dashed #ccc'
  };

  const KitchenTicketPreview = () => (
    <div style={previewStyle}>
      {/* Header */}
      {settings.header_settings.include_logo && settings.header_settings.logo_url && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: '#666' }}>[LOGO]</div>
        </div>
      )}
      
      <div style={headerStyle}>
        {settings.header_settings.header_text}
      </div>
      
      {settings.header_settings.include_restaurant_info && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>{restaurantName}</div>
        </div>
      )}
      
      {settings.header_settings.include_contact_info && (
        <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
          <div>Phone: (555) 123-4567</div>
          <div>123 Main St, City, State</div>
        </div>
      )}
      
      {settings.header_settings.include_order_date && (
        <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '12px' }}>
          <div>{mockOrderData.orderDate} {mockOrderData.orderTime}</div>
        </div>
      )}
      
      {/* Order Info */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold' }}>Order: {mockOrderData.orderNumber}</div>
        {settings.kitchen_ticket.show_preparation_time && (
          <div>Prep Time: {mockOrderData.preparationTime}</div>
        )}
      </div>
      
      {/* Customer Info */}
      {settings.kitchen_ticket.show_customer_info && (
        <div style={sectionStyle}>
          <div style={{ fontWeight: 'bold' }}>Customer:</div>
          <div>{mockOrderData.customerName}</div>
          <div>{mockOrderData.customerPhone}</div>
        </div>
      )}
      
      {/* Items */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold' }}>Items:</div>
        {settings.kitchen_ticket.group_by_category ? (
          // Group by category
          Object.entries(
            mockOrderData.items.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {} as Record<string, typeof mockOrderData.items>)
          ).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{category}:</div>
              {items.map((item, index) => (
                <div key={index} style={{ marginLeft: '8px', marginBottom: '4px' }}>
                  <div>{item.quantity}x {item.name}</div>
                  {settings.kitchen_ticket.show_item_modifiers && item.modifiers.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#666', marginLeft: '12px' }}>
                      Modifiers: {item.modifiers.join(', ')}
                    </div>
                  )}
                  {settings.kitchen_ticket.highlight_allergens && item.allergens.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#d97706', marginLeft: '12px', fontWeight: 'bold' }}>
                      ⚠️ Allergens: {item.allergens.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        ) : (
          // Regular list
          mockOrderData.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <div>{item.quantity}x {item.name}</div>
              {settings.kitchen_ticket.show_item_modifiers && item.modifiers.length > 0 && (
                <div style={{ fontSize: '11px', color: '#666', marginLeft: '12px' }}>
                  Modifiers: {item.modifiers.join(', ')}
                </div>
              )}
              {settings.kitchen_ticket.highlight_allergens && item.allergens.length > 0 && (
                <div style={{ fontSize: '11px', color: '#d97706', marginLeft: '12px', fontWeight: 'bold' }}>
                  ⚠️ Allergens: {item.allergens.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Special Instructions */}
      {settings.kitchen_ticket.show_special_instructions && mockOrderData.specialInstructions && (
        <div style={sectionStyle}>
          <div style={{ fontWeight: 'bold' }}>Special Instructions:</div>
          <div>{mockOrderData.specialInstructions}</div>
        </div>
      )}
      
      {settings.paper_format.auto_cut && (
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '12px' }}>
          [AUTO CUT]
        </div>
      )}
    </div>
  );

  const CustomerReceiptPreview = () => (
    <div style={previewStyle}>
      {/* Header */}
      {settings.header_settings.include_logo && settings.header_settings.logo_url && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: '#666' }}>[LOGO]</div>
        </div>
      )}
      
      <div style={headerStyle}>
        {settings.header_settings.header_text}
      </div>
      
      {settings.header_settings.include_restaurant_info && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>{restaurantName}</div>
        </div>
      )}
      
      {settings.header_settings.include_contact_info && (
        <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
          <div>Phone: (555) 123-4567</div>
          <div>123 Main St, City, State</div>
        </div>
      )}
      
      {settings.header_settings.include_order_date && (
        <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '12px' }}>
          <div>{mockOrderData.orderDate} {mockOrderData.orderTime}</div>
        </div>
      )}
      
      {/* Order Info */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold' }}>Order: {mockOrderData.orderNumber}</div>
        <div>Customer: {mockOrderData.customerName}</div>
        <div>Phone: {mockOrderData.customerPhone}</div>
      </div>
      
      {/* Items */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold' }}>Items:</div>
        {mockOrderData.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.quantity}x {item.name}</span>
              {settings.customer_receipt.show_item_details && (
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              )}
            </div>
            {settings.customer_receipt.show_item_details && item.modifiers.length > 0 && (
              <div style={{ fontSize: '11px', color: '#666', marginLeft: '12px' }}>
                {item.modifiers.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Price Breakdown */}
      {settings.customer_receipt.show_price_breakdown && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>${mockOrderData.subtotal.toFixed(2)}</span>
          </div>
          {settings.customer_receipt.show_tax_details && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax:</span>
              <span>${mockOrderData.tax.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span>${mockOrderData.total.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {/* Payment Method */}
      {settings.customer_receipt.show_payment_method && (
        <div style={sectionStyle}>
          <div>Payment: Cash</div>
        </div>
      )}
      
      {/* Thank You Message */}
      {settings.customer_receipt.include_thank_you_message && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div>{settings.customer_receipt.thank_you_message}</div>
        </div>
      )}
      
      {/* Reorder Info */}
      {settings.customer_receipt.include_reorder_info && (
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px' }}>
          <div>Visit us online to reorder:</div>
          <div>www.{restaurantName.toLowerCase().replace(/\s+/g, '')}.com</div>
        </div>
      )}
      
      {settings.paper_format.auto_cut && (
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '12px' }}>
          [AUTO CUT]
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Print Preview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kitchen Ticket Preview */}
        {settings.kitchen_ticket.enabled && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Kitchen Ticket</h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <div className="flex justify-center">
                <KitchenTicketPreview />
              </div>
            </div>
          </div>
        )}
        
        {/* Customer Receipt Preview */}
        {settings.customer_receipt.enabled && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Customer Receipt</h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
              <div className="flex justify-center">
                <CustomerReceiptPreview />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!settings.kitchen_ticket.enabled && !settings.customer_receipt.enabled && (
        <div className="text-center py-8 text-gray-500">
          <p>No print formats are currently enabled.</p>
          <p className="text-sm mt-2">Enable Kitchen Tickets or Customer Receipts to see previews.</p>
        </div>
      )}
    </div>
  );
};

export default PrintPreview; 