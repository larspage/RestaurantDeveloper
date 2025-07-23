const mongoose = require('mongoose');

const pricePointSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
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
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pricePoints: [pricePointSchema], // Array of price points for multiple sizes
  available: {
    type: Boolean,
    default: true
  },
  customizations: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  // TODO: Add fields like dietary restrictions, prep time
}, { _id: true });

const menuSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  items: [menuItemSchema]
}, { _id: true });

const menuSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true
  },
  sections: [menuSectionSchema]
}, {
  timestamps: true
});

// Index for efficient restaurant queries
menuSchema.index({ restaurant: 1 });

module.exports = mongoose.model('Menu', menuSchema); 