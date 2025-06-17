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
  }
}, {
  timestamps: true
});

// Index for efficient queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema); 