const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  modifications: [{
    type: String,
    trim: true
  }],
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for guest orders
  },
  items: [orderItemSchema],
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['received', 'confirmed', 'in_kitchen', 'ready_for_pickup', 'delivered', 'cancelled'],
    default: 'received'
  },
  // Guest order contact info (when customer is null)
  guest_info: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  // Order timing
  estimated_ready_time: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema); 