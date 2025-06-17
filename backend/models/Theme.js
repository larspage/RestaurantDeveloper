const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  colors: {
    primary: { type: String, required: true },
    secondary: { type: String, required: true },
    accent: { type: String, required: true },
    background: { type: String, required: true },
    text: { type: String, required: true },
    textSecondary: { type: String, required: true }
  },
  fonts: {
    heading: { type: String, required: true },
    body: { type: String, required: true }
  },
  layout: {
    style: { type: String, required: true }, // 'modern', 'classic', 'minimal'
    cardStyle: { type: String, required: true }, // 'rounded', 'square', 'bordered'
    buttonStyle: { type: String, required: true } // 'filled', 'outlined', 'minimal'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Theme', themeSchema); 