import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import restaurantService from '../../../../services/restaurantService';

interface NotificationSettings {
  email_notifications: {
    enabled: boolean;
    new_orders: boolean;
    order_updates: boolean;
    order_cancelled: boolean;
    daily_summary: boolean;
    weekly_report: boolean;
    system_alerts: boolean;
  };
  sms_notifications: {
    enabled: boolean;
    new_orders: boolean;
    order_ready: boolean;
    order_cancelled: boolean;
    urgent_alerts: boolean;
  };
  push_notifications: {
    enabled: boolean;
    new_orders: boolean;
    order_updates: boolean;
    system_alerts: boolean;
    marketing_updates: boolean;
  };
  notification_preferences: {
    email_address: string;
    phone_number: string;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    notification_sound: boolean;
    notification_frequency: 'immediate' | 'batched_15min' | 'batched_1hour';
  };
}

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  settings?: {
    notification_settings?: NotificationSettings;
    contact_preferences?: {
      email_notifications?: boolean;
      sms_notifications?: boolean;
      notification_email?: string;
      notification_phone?: string;
    };
  };
}

const NotificationSettings = () => {
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state with default values
  const [formData, setFormData] = useState<NotificationSettings>({
    email_notifications: {
      enabled: true,
      new_orders: true,
      order_updates: true,
      order_cancelled: true,
      daily_summary: false,
      weekly_report: false,
      system_alerts: true
    },
    sms_notifications: {
      enabled: false,
      new_orders: false,
      order_ready: false,
      order_cancelled: false,
      urgent_alerts: false
    },
    push_notifications: {
      enabled: true,
      new_orders: true,
      order_updates: true,
      system_alerts: true,
      marketing_updates: false
    },
    notification_preferences: {
      email_address: '',
      phone_number: '',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      notification_sound: true,
      notification_frequency: 'immediate'
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
      if (data.settings?.notification_settings) {
        setFormData(data.settings.notification_settings);
      } else {
        // If no notification settings exist, use contact preferences as defaults
        setFormData(prev => ({
          ...prev,
          email_notifications: {
            ...prev.email_notifications,
            enabled: data.settings?.contact_preferences?.email_notifications ?? true
          },
          sms_notifications: {
            ...prev.sms_notifications,
            enabled: data.settings?.contact_preferences?.sms_notifications ?? false
          },
          notification_preferences: {
            ...prev.notification_preferences,
            email_address: data.settings?.contact_preferences?.notification_email || '',
            phone_number: data.settings?.contact_preferences?.notification_phone || ''
          }
        }));
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
        notification_settings: formData,
        // Also update contact preferences for backward compatibility
        contact_preferences: {
          email_notifications: formData.email_notifications.enabled,
          sms_notifications: formData.sms_notifications.enabled,
          notification_email: formData.notification_preferences.email_address,
          notification_phone: formData.notification_preferences.phone_number
        }
      };

      await restaurantService.updateRestaurantSettings(id as string, settings);
      setMessage({ type: 'success', text: 'Notification settings updated successfully' });
      
      // Refresh restaurant data
      await fetchRestaurant();
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save notification settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (restaurant?.settings?.notification_settings) {
      // Reset to original values
      fetchRestaurant();
    }
    setMessage(null);
  };

  const updateFormData = (section: keyof NotificationSettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const ToggleSwitch = ({ checked, onChange, label, disabled = false }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between">
      <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          disabled 
            ? 'bg-gray-200 cursor-not-allowed' 
            : checked 
              ? 'bg-primary-600' 
              : 'bg-gray-200'
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
                <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                <p className="text-gray-600 mt-1">Configure alerts and notifications for {restaurant.name}</p>
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
            {/* Notification Preferences */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.notification_preferences.email_address}
                    onChange={(e) => updateFormData('notification_preferences', 'email_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="notifications@restaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.notification_preferences.phone_number}
                    onChange={(e) => updateFormData('notification_preferences', 'phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                  <select
                    value={formData.notification_preferences.notification_frequency}
                    onChange={(e) => updateFormData('notification_preferences', 'notification_frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="batched_15min">Batched (15 minutes)</option>
                    <option value="batched_1hour">Batched (1 hour)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <ToggleSwitch
                    checked={formData.notification_preferences.notification_sound}
                    onChange={(checked) => updateFormData('notification_preferences', 'notification_sound', checked)}
                    label="Enable Notification Sounds"
                  />
                  <ToggleSwitch
                    checked={formData.notification_preferences.quiet_hours_enabled}
                    onChange={(checked) => updateFormData('notification_preferences', 'quiet_hours_enabled', checked)}
                    label="Enable Quiet Hours"
                  />
                </div>

                {formData.notification_preferences.quiet_hours_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours Start</label>
                      <input
                        type="time"
                        value={formData.notification_preferences.quiet_hours_start}
                        onChange={(e) => updateFormData('notification_preferences', 'quiet_hours_start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quiet Hours End</label>
                      <input
                        type="time"
                        value={formData.notification_preferences.quiet_hours_end}
                        onChange={(e) => updateFormData('notification_preferences', 'quiet_hours_end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.email_notifications.enabled}
                  onChange={(checked) => updateFormData('email_notifications', 'enabled', checked)}
                  label="Enable Email Notifications"
                />
                
                {formData.email_notifications.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToggleSwitch
                      checked={formData.email_notifications.new_orders}
                      onChange={(checked) => updateFormData('email_notifications', 'new_orders', checked)}
                      label="New Orders"
                    />
                    <ToggleSwitch
                      checked={formData.email_notifications.order_updates}
                      onChange={(checked) => updateFormData('email_notifications', 'order_updates', checked)}
                      label="Order Status Updates"
                    />
                    <ToggleSwitch
                      checked={formData.email_notifications.order_cancelled}
                      onChange={(checked) => updateFormData('email_notifications', 'order_cancelled', checked)}
                      label="Order Cancellations"
                    />
                    <ToggleSwitch
                      checked={formData.email_notifications.system_alerts}
                      onChange={(checked) => updateFormData('email_notifications', 'system_alerts', checked)}
                      label="System Alerts"
                    />
                    <ToggleSwitch
                      checked={formData.email_notifications.daily_summary}
                      onChange={(checked) => updateFormData('email_notifications', 'daily_summary', checked)}
                      label="Daily Summary"
                    />
                    <ToggleSwitch
                      checked={formData.email_notifications.weekly_report}
                      onChange={(checked) => updateFormData('email_notifications', 'weekly_report', checked)}
                      label="Weekly Report"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">SMS Notifications</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.sms_notifications.enabled}
                  onChange={(checked) => updateFormData('sms_notifications', 'enabled', checked)}
                  label="Enable SMS Notifications"
                />
                
                {formData.sms_notifications.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToggleSwitch
                      checked={formData.sms_notifications.new_orders}
                      onChange={(checked) => updateFormData('sms_notifications', 'new_orders', checked)}
                      label="New Orders"
                    />
                    <ToggleSwitch
                      checked={formData.sms_notifications.order_ready}
                      onChange={(checked) => updateFormData('sms_notifications', 'order_ready', checked)}
                      label="Order Ready"
                    />
                    <ToggleSwitch
                      checked={formData.sms_notifications.order_cancelled}
                      onChange={(checked) => updateFormData('sms_notifications', 'order_cancelled', checked)}
                      label="Order Cancellations"
                    />
                    <ToggleSwitch
                      checked={formData.sms_notifications.urgent_alerts}
                      onChange={(checked) => updateFormData('sms_notifications', 'urgent_alerts', checked)}
                      label="Urgent Alerts"
                    />
                  </div>
                )}
                
                {formData.sms_notifications.enabled && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> SMS notifications require a valid phone number and may incur additional charges.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Push Notifications</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={formData.push_notifications.enabled}
                  onChange={(checked) => updateFormData('push_notifications', 'enabled', checked)}
                  label="Enable Push Notifications"
                />
                
                {formData.push_notifications.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToggleSwitch
                      checked={formData.push_notifications.new_orders}
                      onChange={(checked) => updateFormData('push_notifications', 'new_orders', checked)}
                      label="New Orders"
                    />
                    <ToggleSwitch
                      checked={formData.push_notifications.order_updates}
                      onChange={(checked) => updateFormData('push_notifications', 'order_updates', checked)}
                      label="Order Status Updates"
                    />
                    <ToggleSwitch
                      checked={formData.push_notifications.system_alerts}
                      onChange={(checked) => updateFormData('push_notifications', 'system_alerts', checked)}
                      label="System Alerts"
                    />
                    <ToggleSwitch
                      checked={formData.push_notifications.marketing_updates}
                      onChange={(checked) => updateFormData('push_notifications', 'marketing_updates', checked)}
                      label="Marketing Updates"
                    />
                  </div>
                )}
                
                {formData.push_notifications.enabled && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Push notifications require browser permission and work only when the dashboard is open.
                    </p>
                  </div>
                )}
              </div>
            </div>

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
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NotificationSettings; 