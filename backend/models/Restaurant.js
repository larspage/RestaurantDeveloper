const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  cuisine: [{
    type: String,
    trim: true
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  theme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  contact_info: {
    email: String,
    phone: String,
    website: String
  },
  business_hours: {
    type: Map,
    of: String
  },
  // Restaurant Settings
  settings: {
    // Order Management Settings
    accept_new_orders: {
      type: Boolean,
      default: true
    },
    auto_confirm_orders: {
      type: Boolean,
      default: false
    },
    show_unavailable_items: {
      type: Boolean,
      default: false
    },
    // Contact Preferences
    contact_preferences: {
      email_notifications: {
        type: Boolean,
        default: true
      },
      sms_notifications: {
        type: Boolean,
        default: false
      },
      notification_email: {
        type: String,
        trim: true
      },
      notification_phone: {
        type: String,
        trim: true
      }
    },
    // Operating Hours (detailed)
    operating_hours: {
      monday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      tuesday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      wednesday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      thursday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      friday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      saturday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      },
      sunday: {
        is_open: { type: Boolean, default: true },
        open_time: { type: String, default: '09:00' },
        close_time: { type: String, default: '22:00' }
      }
    },
    // Print Settings
    print_settings: {
      // Paper Format Settings
      paper_format: {
        size: { type: String, enum: ['58mm', '80mm', 'standard'], default: '80mm' },
        margin_top: { type: Number, default: 5 },
        margin_bottom: { type: Number, default: 5 },
        margin_left: { type: Number, default: 2 },
        margin_right: { type: Number, default: 2 },
        line_spacing: { type: Number, default: 1 },
        auto_cut: { type: Boolean, default: true }
      },
      // Font Settings
      font_settings: {
        header_font_size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        body_font_size: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
        font_style: { type: String, enum: ['normal', 'bold'], default: 'normal' },
        print_density: { type: String, enum: ['light', 'medium', 'dark'], default: 'medium' }
      },
      // Header/Logo Settings
      header_settings: {
        include_logo: { type: Boolean, default: false },
        logo_url: { type: String, trim: true },
        header_text: { type: String, default: 'Order Receipt', trim: true },
        include_restaurant_info: { type: Boolean, default: true },
        include_contact_info: { type: Boolean, default: true },
        include_order_date: { type: Boolean, default: true }
      },
      // Kitchen Ticket Settings
      kitchen_ticket: {
        enabled: { type: Boolean, default: true },
        show_customer_info: { type: Boolean, default: false },
        show_special_instructions: { type: Boolean, default: true },
        show_item_modifiers: { type: Boolean, default: true },
        show_preparation_time: { type: Boolean, default: false },
        group_by_category: { type: Boolean, default: false },
        highlight_allergens: { type: Boolean, default: true }
      },
      // Customer Receipt Settings
      customer_receipt: {
        enabled: { type: Boolean, default: true },
        show_item_details: { type: Boolean, default: true },
        show_price_breakdown: { type: Boolean, default: true },
        show_tax_details: { type: Boolean, default: true },
        show_payment_method: { type: Boolean, default: false },
        include_thank_you_message: { type: Boolean, default: true },
        thank_you_message: { type: String, default: 'Thank you for your order!', trim: true },
        include_reorder_info: { type: Boolean, default: false }
      },
      // Email Template Settings
      email_template: {
        enabled: { type: Boolean, default: true },
        subject_template: { type: String, default: 'Order Confirmation - #{orderNumber}', trim: true },
        header_template: { type: String, default: 'Thank you for your order!', trim: true },
        footer_template: { type: String, default: 'We appreciate your business.', trim: true },
        include_restaurant_logo: { type: Boolean, default: true },
        include_order_tracking: { type: Boolean, default: false }
      }
    },
    // Notification Settings
    notification_settings: {
      // Email Notifications
      email_notifications: {
        enabled: { type: Boolean, default: true },
        new_orders: { type: Boolean, default: true },
        order_updates: { type: Boolean, default: true },
        order_cancelled: { type: Boolean, default: true },
        daily_summary: { type: Boolean, default: false },
        weekly_report: { type: Boolean, default: false },
        system_alerts: { type: Boolean, default: true }
      },
      // SMS Notifications
      sms_notifications: {
        enabled: { type: Boolean, default: false },
        new_orders: { type: Boolean, default: false },
        order_ready: { type: Boolean, default: false },
        order_cancelled: { type: Boolean, default: false },
        urgent_alerts: { type: Boolean, default: false }
      },
      // Push Notifications
      push_notifications: {
        enabled: { type: Boolean, default: true },
        new_orders: { type: Boolean, default: true },
        order_updates: { type: Boolean, default: true },
        system_alerts: { type: Boolean, default: true },
        marketing_updates: { type: Boolean, default: false }
      },
      // Notification Preferences
      notification_preferences: {
        email_address: { type: String, trim: true },
        phone_number: { type: String, trim: true },
        quiet_hours_enabled: { type: Boolean, default: false },
        quiet_hours_start: { type: String, default: '22:00' },
        quiet_hours_end: { type: String, default: '08:00' },
        notification_sound: { type: Boolean, default: true },
        notification_frequency: { type: String, enum: ['immediate', 'batched_15min', 'batched_1hour'], default: 'immediate' }
      }
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
