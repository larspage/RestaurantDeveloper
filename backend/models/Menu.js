const mongoose = require('mongoose');

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
  available: {
    type: Boolean,
    default: true
  },
  customizations: [{
    type: String,
    trim: true
  }],
  // TODO: Add fields like images, dietary restrictions, prep time
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