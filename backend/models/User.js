const mongoose = require('mongoose');

// This model stores minimal user data in MongoDB for efficient queries
// Full user data (auth, email, contact info) remains in Supabase
const userSchema = new mongoose.Schema({
  supabase_id: {
    type: String, // UUID from Supabase
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['restaurant_owner', 'customer'],
    default: 'customer'
  },
  // For restaurant owners - which restaurant they own
  restaurant_id: {
    type: String, // UUID from Supabase restaurants table
    default: null
  },
  // User preferences that don't belong in Supabase
  preferences: {
    dietary_restrictions: [{
      type: String,
      trim: true
    }],
    favorite_items: [{
      restaurant_id: String,
      item_name: String
    }]
  },
  // Cache frequently accessed data to avoid Supabase queries
  last_sync: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userSchema.index({ supabase_id: 1 });
userSchema.index({ restaurant_id: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema); 