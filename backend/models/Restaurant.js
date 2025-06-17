const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner_id: {
    type: String, // UUID from Supabase
    required: true
  },
  theme_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    required: true
  },
  // TODO: Add additional restaurant metadata fields
  // - address, phone, description, hours, etc.
}, {
  timestamps: true
});

// Index for efficient queries
restaurantSchema.index({ owner_id: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema); 