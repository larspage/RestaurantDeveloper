const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  colors: {
    primary: {
      type: String,
      required: true
    },
    secondary: {
      type: String,
      required: true
    },
    accent: {
      type: String,
      required: true
    },
    background: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  fonts: {
    heading: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    }
  },
  spacing: {
    unit: {
      type: Number,
      required: true,
      default: 8
    },
    scale: {
      type: Number,
      required: true,
      default: 1.5
    }
  },
  borderRadius: {
    type: Number,
    required: true,
    default: 4
  },
  shadows: [{
    type: String
  }],
  // For tracking usage and popularity
  usage_count: {
    type: Number,
    default: 0
  },
  // For theme categorization
  tags: [{
    type: String,
    trim: true
  }],
  // For theme customization
  customizable: {
    type: Boolean,
    default: true
  },
  // For theme versioning
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
themeSchema.index({ name: 1 });
themeSchema.index({ tags: 1 });
themeSchema.index({ usage_count: -1 });

module.exports = mongoose.model('Theme', themeSchema); 