import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import restaurantService from '../../../../services/restaurantService';

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  settings?: {
    accept_new_orders?: boolean;
    auto_confirm_orders?: boolean;
    show_unavailable_items?: boolean;
    contact_preferences?: {
      email_notifications?: boolean;
      sms_notifications?: boolean;
      notification_email?: string;
      notification_phone?: string;
    };
    operating_hours?: {
      [key: string]: {
        is_open: boolean;
        open_time: string;
        close_time: string;
      };
    };
  };
}

const RestaurantSettings = () => {
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    contact_info: {
      email: '',
      phone: '',
      website: ''
    },
    accept_new_orders: true,
    auto_confirm_orders: false,
    show_unavailable_items: false,
    contact_preferences: {
      email_notifications: true,
      sms_notifications: false,
      notification_email: '',
      notification_phone: ''
    },
    operating_hours: {
      monday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      tuesday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      wednesday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      thursday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      friday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      saturday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      sunday: { is_open: true, open_time: '09:00', close_time: '22:00' }
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
      
      // Populate form with existing data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        contact_info: {
          email: data.contact_info?.email || '',
          phone: data.contact_info?.phone || '',
          website: data.contact_info?.website || ''
        },
        accept_new_orders: data.settings?.accept_new_orders ?? true,
        auto_confirm_orders: data.settings?.auto_confirm_orders ?? false,
        show_unavailable_items: data.settings?.show_unavailable_items ?? false,
        contact_preferences: {
          email_notifications: data.settings?.contact_preferences?.email_notifications ?? true,
          sms_notifications: data.settings?.contact_preferences?.sms_notifications ?? false,
          notification_email: data.settings?.contact_preferences?.notification_email || '',
          notification_phone: data.settings?.contact_preferences?.notification_phone || ''
        },
        operating_hours: {
          monday: data.settings?.operating_hours?.monday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          tuesday: data.settings?.operating_hours?.tuesday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          wednesday: data.settings?.operating_hours?.wednesday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          thursday: data.settings?.operating_hours?.thursday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          friday: data.settings?.operating_hours?.friday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          saturday: data.settings?.operating_hours?.saturday || { is_open: true, open_time: '09:00', close_time: '22:00' },
          sunday: data.settings?.operating_hours?.sunday || { is_open: true, open_time: '09:00', close_time: '22:00' }
        }
      });
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
        name: formData.name,
        description: formData.description,
        location: formData.location,
        contact_info: formData.contact_info,
        accept_new_orders: formData.accept_new_orders,
        auto_confirm_orders: formData.auto_confirm_orders,
        show_unavailable_items: formData.show_unavailable_items,
        contact_preferences: formData.contact_preferences,
        operating_hours: formData.operating_hours
      };

      await restaurantService.updateRestaurantSettings(id as string, settings);
      setMessage({ type: 'success', text: 'Restaurant settings updated successfully' });
      
      // Refresh restaurant data
      await fetchRestaurant();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }));
  };

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...(prev.operating_hours as any)[day],
          [field]: value
        }
      }
    }));
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
              className="btn-primary"
            >
              Back to Dashboard
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
                <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
                <p className="text-gray-600 mt-2">{restaurant.name}</p>
              </div>
              <button
                onClick={() => router.push(`/dashboard/restaurants/${id}`)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Restaurant
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Settings Form */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_info.email}
                    onChange={(e) => handleNestedInputChange('contact_info', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_info.phone}
                    onChange={(e) => handleNestedInputChange('contact_info', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.contact_info.website}
                    onChange={(e) => handleNestedInputChange('contact_info', 'website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Order Management Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Accept New Orders</h3>
                    <p className="text-sm text-gray-500">Allow customers to place new orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accept_new_orders}
                      onChange={(e) => handleInputChange('accept_new_orders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Auto-Confirm Orders</h3>
                    <p className="text-sm text-gray-500">Automatically confirm new orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_confirm_orders}
                      onChange={(e) => handleInputChange('auto_confirm_orders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Show Unavailable Items</h3>
                    <p className="text-sm text-gray-500">Display unavailable menu items to customers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_unavailable_items}
                      onChange={(e) => handleInputChange('show_unavailable_items', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <span className="text-sm font-medium text-gray-900 capitalize">{day}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.operating_hours as any)[day].is_open}
                        onChange={(e) => handleOperatingHoursChange(day, 'is_open', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                    {(formData.operating_hours as any)[day].is_open && (
                      <>
                        <input
                          type="time"
                          value={(formData.operating_hours as any)[day].open_time}
                          onChange={(e) => handleOperatingHoursChange(day, 'open_time', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={(formData.operating_hours as any)[day].close_time}
                          onChange={(e) => handleOperatingHoursChange(day, 'close_time', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </>
                    )}
                    {!(formData.operating_hours as any)[day].is_open && (
                      <span className="text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive order notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contact_preferences.email_notifications}
                        onChange={(e) => handleNestedInputChange('contact_preferences', 'email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  {formData.contact_preferences.email_notifications && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Email
                      </label>
                      <input
                        type="email"
                        value={formData.contact_preferences.notification_email}
                        onChange={(e) => handleNestedInputChange('contact_preferences', 'notification_email', e.target.value)}
                        placeholder="Enter email for notifications"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive order notifications via SMS (coming soon)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contact_preferences.sms_notifications}
                        onChange={(e) => handleNestedInputChange('contact_preferences', 'sms_notifications', e.target.checked)}
                        className="sr-only peer"
                        disabled
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 opacity-50"></div>
                    </label>
                  </div>
                  {formData.contact_preferences.sms_notifications && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_preferences.notification_phone}
                        onChange={(e) => handleNestedInputChange('contact_preferences', 'notification_phone', e.target.value)}
                        placeholder="Enter phone for notifications"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push(`/dashboard/restaurants/${id}`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default RestaurantSettings; 