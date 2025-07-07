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
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema); 