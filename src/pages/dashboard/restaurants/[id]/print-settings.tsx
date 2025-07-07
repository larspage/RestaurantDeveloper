import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import restaurantService from '../../../../services/restaurantService';
import PrintPreview from '../../../../components/PrintPreview';

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
  email_template: {
    enabled: boolean;
    subject_template: string;
    header_template: string;
    footer_template: string;
    include_restaurant_logo: boolean;
    include_order_tracking: boolean;
  };
}

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  settings?: {
    print_settings?: PrintSettings;
  };
}

const PrintSettings = () => {
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state with default values
  const [formData, setFormData] = useState<PrintSettings>({
    paper_format: {
      size: '80mm',
      margin_top: 5,
      margin_bottom: 5,
      margin_left: 2,
      margin_right: 2,
      line_spacing: 1,
      auto_cut: true
    },
    font_settings: {
      header_font_size: 'medium',
      body_font_size: 'small',
      font_style: 'normal',
      print_density: 'medium'
    },
    header_settings: {
      include_logo: false,
      logo_url: '',
      header_text: 'Order Receipt',
      include_restaurant_info: true,
      include_contact_info: true,
      include_order_date: true
    },
    kitchen_ticket: {
      enabled: true,
      show_customer_info: false,
      show_special_instructions: true,
      show_item_modifiers: true,
      show_preparation_time: false,
      group_by_category: false,
      highlight_allergens: true
    },
    customer_receipt: {
      enabled: true,
      show_item_details: true,
      show_price_breakdown: true,
      show_tax_details: true,
      show_payment_method: false,
      include_thank_you_message: true,
      thank_you_message: 'Thank you for your order!',
      include_reorder_info: false
    },
    email_template: {
      enabled: true,
      subject_template: 'Order Confirmation - #{orderNumber}',
      header_template: 'Thank you for your order!',
      footer_template: 'We appreciate your business.',
      include_restaurant_logo: true,
      include_order_tracking: false
    }
  });

  useEffect(() => {
    if (id) {
      fetchRestaurant();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getRestaurant(id as string);
      setRestaurant(data);
      
      // Populate form with existing data or defaults
      if (data.settings?.print_settings) {
        setFormData({
          paper_format: {
            size: data.settings.print_settings.paper_format?.size || '80mm',
            margin_top: data.settings.print_settings.paper_format?.margin_top || 5,
            margin_bottom: data.settings.print_settings.paper_format?.margin_bottom || 5,
            margin_left: data.settings.print_settings.paper_format?.margin_left || 2,
            margin_right: data.settings.print_settings.paper_format?.margin_right || 2,
            line_spacing: data.settings.print_settings.paper_format?.line_spacing || 1,
            auto_cut: data.settings.print_settings.paper_format?.auto_cut ?? true
          },
          font_settings: {
            header_font_size: data.settings.print_settings.font_settings?.header_font_size || 'medium',
            body_font_size: data.settings.print_settings.font_settings?.body_font_size || 'small',
            font_style: data.settings.print_settings.font_settings?.font_style || 'normal',
            print_density: data.settings.print_settings.font_settings?.print_density || 'medium'
          },
          header_settings: {
            include_logo: data.settings.print_settings.header_settings?.include_logo ?? false,
            logo_url: data.settings.print_settings.header_settings?.logo_url || '',
            header_text: data.settings.print_settings.header_settings?.header_text || 'Order Receipt',
            include_restaurant_info: data.settings.print_settings.header_settings?.include_restaurant_info ?? true,
            include_contact_info: data.settings.print_settings.header_settings?.include_contact_info ?? true,
            include_order_date: data.settings.print_settings.header_settings?.include_order_date ?? true
          },
          kitchen_ticket: {
            enabled: data.settings.print_settings.kitchen_ticket?.enabled ?? true,
            show_customer_info: data.settings.print_settings.kitchen_ticket?.show_customer_info ?? false,
            show_special_instructions: data.settings.print_settings.kitchen_ticket?.show_special_instructions ?? true,
            show_item_modifiers: data.settings.print_settings.kitchen_ticket?.show_item_modifiers ?? true,
            show_preparation_time: data.settings.print_settings.kitchen_ticket?.show_preparation_time ?? false,
            group_by_category: data.settings.print_settings.kitchen_ticket?.group_by_category ?? false,
            highlight_allergens: data.settings.print_settings.kitchen_ticket?.highlight_allergens ?? true
          },
          customer_receipt: {
            enabled: data.settings.print_settings.customer_receipt?.enabled ?? true,
            show_item_details: data.settings.print_settings.customer_receipt?.show_item_details ?? true,
            show_price_breakdown: data.settings.print_settings.customer_receipt?.show_price_breakdown ?? true,
            show_tax_details: data.settings.print_settings.customer_receipt?.show_tax_details ?? true,
            show_payment_method: data.settings.print_settings.customer_receipt?.show_payment_method ?? false,
            include_thank_you_message: data.settings.print_settings.customer_receipt?.include_thank_you_message ?? true,
            thank_you_message: data.settings.print_settings.customer_receipt?.thank_you_message || 'Thank you for your order!',
            include_reorder_info: data.settings.print_settings.customer_receipt?.include_reorder_info ?? false
          },
          email_template: {
            enabled: data.settings.print_settings.email_template?.enabled ?? true,
            subject_template: data.settings.print_settings.email_template?.subject_template || 'Order Confirmation - #{orderNumber}',
            header_template: data.settings.print_settings.email_template?.header_template || 'Thank you for your order!',
            footer_template: data.settings.print_settings.email_template?.footer_template || 'We appreciate your business.',
            include_restaurant_logo: data.settings.print_settings.email_template?.include_restaurant_logo ?? true,
            include_order_tracking: data.settings.print_settings.email_template?.include_order_tracking ?? false
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching restaurant:', error);
      setMessage({ type: 'error', text: 'Failed to load restaurant data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settings = {
        print_settings: formData
      };

      await restaurantService.updateRestaurantSettings(id as string, settings);
      setMessage({ type: 'success', text: 'Print settings updated successfully' });
      
      // Refresh restaurant data
      await fetchRestaurant();
    } catch (error: any) {
      console.error('Error saving print settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save print settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (restaurant?.settings?.print_settings) {
      // Reset to original values
      fetchRestaurant();
    }
    setMessage(null);
  };

  const updateFormData = (section: keyof PrintSettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Print Settings</h1>
                <p className="text-gray-600 mt-1">Configure receipt and kitchen ticket formats for {restaurant.name}</p>
              </div>
              <button
                onClick={() => router.push(`/dashboard/restaurants/${id}`)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Back to Restaurant
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            {/* Paper Format Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Paper Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                  <select
                    value={formData.paper_format.size}
                    onChange={(e) => updateFormData('paper_format', 'size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="58mm">58mm (Small)</option>
                    <option value="80mm">80mm (Standard)</option>
                    <option value="standard">Standard (A4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Line Spacing</label>
                  <select
                    value={formData.paper_format.line_spacing}
                    onChange={(e) => updateFormData('paper_format', 'line_spacing', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="1">Normal</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">Double</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top Margin (mm)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.paper_format.margin_top}
                    onChange={(e) => updateFormData('paper_format', 'margin_top', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Margin (mm)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.paper_format.margin_bottom}
                    onChange={(e) => updateFormData('paper_format', 'margin_bottom', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <ToggleSwitch
                    checked={formData.paper_format.auto_cut}
                    onChange={(checked) => updateFormData('paper_format', 'auto_cut', checked)}
                    label="Auto-cut paper after printing"
                  />
                </div>
              </div>
            </div>

            {/* Font Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Font Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Header Font Size</label>
                  <select
                    value={formData.font_settings.header_font_size}
                    onChange={(e) => updateFormData('font_settings', 'header_font_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Font Size</label>
                  <select
                    value={formData.font_settings.body_font_size}
                    onChange={(e) => updateFormData('font_settings', 'body_font_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Style</label>
                  <select
                    value={formData.font_settings.font_style}
                    onChange={(e) => updateFormData('font_settings', 'font_style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Print Density</label>
                  <select
                    value={formData.font_settings.print_density}
                    onChange={(e) => updateFormData('font_settings', 'print_density', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Header Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Header Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
                  <input
                    type="text"
                    value={formData.header_settings.header_text}
                    onChange={(e) => updateFormData('header_settings', 'header_text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Order Receipt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (optional)</label>
                  <input
                    type="url"
                    value={formData.header_settings.logo_url}
                    onChange={(e) => updateFormData('header_settings', 'logo_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleSwitch
                    checked={formData.header_settings.include_logo}
                    onChange={(checked) => updateFormData('header_settings', 'include_logo', checked)}
                    label="Include Logo"
                  />
                  <ToggleSwitch
                    checked={formData.header_settings.include_restaurant_info}
                    onChange={(checked) => updateFormData('header_settings', 'include_restaurant_info', checked)}
                    label="Include Restaurant Info"
                  />
                  <ToggleSwitch
                    checked={formData.header_settings.include_contact_info}
                    onChange={(checked) => updateFormData('header_settings', 'include_contact_info', checked)}
                    label="Include Contact Info"
                  />
                  <ToggleSwitch
                    checked={formData.header_settings.include_order_date}
                    onChange={(checked) => updateFormData('header_settings', 'include_order_date', checked)}
                    label="Include Order Date"
                  />
                </div>
              </div>
            </div>

            {/* Kitchen Ticket Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Ticket Settings</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.kitchen_ticket.enabled}
                  onChange={(checked) => updateFormData('kitchen_ticket', 'enabled', checked)}
                  label="Enable Kitchen Tickets"
                />
                
                {formData.kitchen_ticket.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.show_customer_info}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'show_customer_info', checked)}
                      label="Show Customer Info"
                    />
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.show_special_instructions}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'show_special_instructions', checked)}
                      label="Show Special Instructions"
                    />
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.show_item_modifiers}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'show_item_modifiers', checked)}
                      label="Show Item Modifiers"
                    />
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.show_preparation_time}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'show_preparation_time', checked)}
                      label="Show Preparation Time"
                    />
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.group_by_category}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'group_by_category', checked)}
                      label="Group by Category"
                    />
                    <ToggleSwitch
                      checked={formData.kitchen_ticket.highlight_allergens}
                      onChange={(checked) => updateFormData('kitchen_ticket', 'highlight_allergens', checked)}
                      label="Highlight Allergens"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Customer Receipt Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Receipt Settings</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.customer_receipt.enabled}
                  onChange={(checked) => updateFormData('customer_receipt', 'enabled', checked)}
                  label="Enable Customer Receipts"
                />
                
                {formData.customer_receipt.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <ToggleSwitch
                        checked={formData.customer_receipt.show_item_details}
                        onChange={(checked) => updateFormData('customer_receipt', 'show_item_details', checked)}
                        label="Show Item Details"
                      />
                      <ToggleSwitch
                        checked={formData.customer_receipt.show_price_breakdown}
                        onChange={(checked) => updateFormData('customer_receipt', 'show_price_breakdown', checked)}
                        label="Show Price Breakdown"
                      />
                      <ToggleSwitch
                        checked={formData.customer_receipt.show_tax_details}
                        onChange={(checked) => updateFormData('customer_receipt', 'show_tax_details', checked)}
                        label="Show Tax Details"
                      />
                      <ToggleSwitch
                        checked={formData.customer_receipt.show_payment_method}
                        onChange={(checked) => updateFormData('customer_receipt', 'show_payment_method', checked)}
                        label="Show Payment Method"
                      />
                      <ToggleSwitch
                        checked={formData.customer_receipt.include_thank_you_message}
                        onChange={(checked) => updateFormData('customer_receipt', 'include_thank_you_message', checked)}
                        label="Include Thank You Message"
                      />
                      <ToggleSwitch
                        checked={formData.customer_receipt.include_reorder_info}
                        onChange={(checked) => updateFormData('customer_receipt', 'include_reorder_info', checked)}
                        label="Include Reorder Info"
                      />
                    </div>
                    
                    {formData.customer_receipt.include_thank_you_message && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thank You Message</label>
                        <textarea
                          value={formData.customer_receipt.thank_you_message}
                          onChange={(e) => updateFormData('customer_receipt', 'thank_you_message', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          placeholder="Thank you for your order!"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Email Template Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Template Settings</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.email_template.enabled}
                  onChange={(checked) => updateFormData('email_template', 'enabled', checked)}
                  label="Enable Email Confirmations"
                />
                
                {formData.email_template.enabled && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Template</label>
                        <input
                          type="text"
                          value={formData.email_template.subject_template}
                          onChange={(e) => updateFormData('email_template', 'subject_template', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Order Confirmation - #{orderNumber}"
                        />
                                                 <p className="text-xs text-gray-500 mt-1">Use #&#123;orderNumber&#125; for order number</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Header Template</label>
                        <textarea
                          value={formData.email_template.header_template}
                          onChange={(e) => updateFormData('email_template', 'header_template', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          placeholder="Thank you for your order!"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Footer Template</label>
                        <textarea
                          value={formData.email_template.footer_template}
                          onChange={(e) => updateFormData('email_template', 'footer_template', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={3}
                          placeholder="We appreciate your business."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <ToggleSwitch
                        checked={formData.email_template.include_restaurant_logo}
                        onChange={(checked) => updateFormData('email_template', 'include_restaurant_logo', checked)}
                        label="Include Restaurant Logo"
                      />
                      <ToggleSwitch
                        checked={formData.email_template.include_order_tracking}
                        onChange={(checked) => updateFormData('email_template', 'include_order_tracking', checked)}
                        label="Include Order Tracking"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Print Preview */}
            <PrintPreview settings={formData} restaurantName={restaurant.name} />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Print Settings'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default PrintSettings;
