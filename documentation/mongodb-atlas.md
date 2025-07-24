# MongoDB Atlas Integration Guide

## Overview

MongoDB Atlas serves as the primary database service for the Restaurant Developer platform, providing a scalable, managed MongoDB database with enterprise-grade security and performance monitoring. It stores all restaurant data, menu items, orders, and user information while integrating seamlessly with our authentication layer.

### Purpose and Role
- **Primary Data Store**: Stores restaurant profiles, menus, orders, and analytics data
- **User Data Cache**: Caches user information from Supabase for performance
- **Business Logic Storage**: Manages complex restaurant business rules and relationships
- **Analytics Data Warehouse**: Stores aggregated data for reporting and insights
- **File Metadata Storage**: Tracks uploaded images and documents

### Key Features Utilized
- Managed MongoDB hosting with automatic scaling
- Built-in security with encryption at rest and in transit
- Performance monitoring and optimization tools
- Automated backups and point-in-time recovery
- Global cluster deployment for low latency
- Atlas Search for full-text search capabilities

### Integration Points
- **Supabase**: User data synchronization and caching
- **MinIO/DigitalOcean Spaces**: File metadata storage
- **Backend APIs**: Primary data source for all operations
- **Analytics Dashboard**: Data aggregation and reporting
- **Winston Logger**: Database operation logging

## Setup & Configuration

### Environment Variables

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant_developer?retryWrites=true&w=majority
MONGODB_URI_TEST=mongodb+srv://username:password@cluster.mongodb.net/restaurant_developer_test?retryWrites=true&w=majority

# Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_IDLE_TIME_MS=30000
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

# Database Names
DB_NAME=restaurant_developer
DB_NAME_TEST=restaurant_developer_test
```

### Initial Setup Steps

#### 1. Create MongoDB Atlas Cluster
```bash
# 1. Visit https://cloud.mongodb.com and create an account
# 2. Create a new cluster (recommend M10 or higher for production)
# 3. Configure network access (whitelist your IP addresses)
# 4. Create database user with appropriate permissions
# 5. Get connection string from Atlas dashboard
```

#### 2. Database User Setup
```javascript
// Create database user with specific permissions
// In Atlas Dashboard > Database Access > Add New Database User
{
  "username": "restaurant_app",
  "password": "secure_password_here",
  "roles": [
    {
      "role": "readWrite",
      "db": "restaurant_developer"
    },
    {
      "role": "read",
      "db": "restaurant_developer_test"
    }
  ]
}
```

#### 3. Network Security Configuration
```bash
# Configure IP Access List in Atlas Dashboard
# For development: Add your current IP
# For production: Add your server IP ranges
# For DigitalOcean: Add DigitalOcean IP ranges

# Example production IPs (adjust for your setup)
# 0.0.0.0/0 (not recommended for production)
# 192.168.1.0/24 (your server subnet)
# DigitalOcean IP ranges
```

### Development vs Production Configuration

#### Development Setup
```javascript
// backend/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5, // Smaller pool for development
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
    
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### Production Setup
```javascript
// Enhanced production configuration with monitoring
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Larger pool for production
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Production monitoring
    conn.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Log to Winston
      logger.error('MongoDB connection error', { error: err.message });
    });

    conn.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};
```

## API Reference

### Database Models

#### User Model
```javascript
// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabase_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['restaurant_owner', 'customer', 'admin'],
    default: 'restaurant_owner',
    index: true
  },
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  profile: {
    phone: String,
    address: String,
    preferences: {
      notifications: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    }
  },
  last_sync: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
userSchema.index({ supabase_id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, created_at: -1 });

module.exports = mongoose.model('User', userSchema);
```

#### Restaurant Model
```javascript
// backend/models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text' // For text search
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contact: {
    email: { type: String, lowercase: true },
    phone: String,
    website: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  cuisine_types: [{
    type: String,
    index: true
  }],
  menu_categories: [{
    name: String,
    description: String,
    display_order: Number
  }],
  settings: {
    is_active: { type: Boolean, default: true },
    accepts_orders: { type: Boolean, default: true },
    delivery_radius: { type: Number, default: 5 }, // miles
    min_order_amount: { type: Number, default: 0 }
  },
  images: {
    logo: String,
    cover: String,
    gallery: [String]
  },
  stats: {
    total_orders: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    avg_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for common queries
restaurantSchema.index({ owner: 1, created_at: -1 });
restaurantSchema.index({ 'address.city': 1, 'cuisine_types': 1 });
restaurantSchema.index({ 'settings.is_active': 1, 'stats.avg_rating': -1 });

// Text index for search
restaurantSchema.index({
  name: 'text',
  description: 'text',
  'cuisine_types': 'text'
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
```

#### Menu Item Model
```javascript
// backend/models/MenuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [String],
  ingredients: [String],
  allergens: [String],
  nutritional_info: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  options: [{
    name: String,
    type: { type: String, enum: ['single', 'multiple'] },
    required: { type: Boolean, default: false },
    choices: [{
      name: String,
      price_modifier: { type: Number, default: 0 }
    }]
  }],
  availability: {
    is_available: { type: Boolean, default: true },
    available_days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
    available_times: {
      start: String, // "09:00"
      end: String    // "22:00"
    }
  },
  stats: {
    orders_count: { type: Number, default: 0 },
    avg_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 }
  },
  display_order: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes
menuItemSchema.index({ restaurant: 1, category: 1, display_order: 1 });
menuItemSchema.index({ restaurant: 1, 'availability.is_available': 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
```

### Common Database Operations

#### User Operations
```javascript
// backend/services/userService.js
const User = require('../models/User');

class UserService {
  // Create or update user from Supabase data
  static async syncUser(supabaseUser) {
    try {
      const user = await User.findOneAndUpdate(
        { supabase_id: supabaseUser.id },
        {
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name,
          role: supabaseUser.user_metadata?.role || 'restaurant_owner',
          last_sync: new Date()
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      );
      
      return user;
    } catch (error) {
      console.error('User sync error:', error);
      throw error;
    }
  }

  // Get user with populated restaurants
  static async getUserWithRestaurants(supabaseId) {
    try {
      const user = await User.findOne({ supabase_id: supabaseId })
        .populate({
          path: 'restaurants',
          select: 'name description address settings stats images',
          match: { 'settings.is_active': true }
        });
      
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(supabaseId, profileData) {
    try {
      const user = await User.findOneAndUpdate(
        { supabase_id: supabaseId },
        { 
          $set: {
            'profile.phone': profileData.phone,
            'profile.address': profileData.address,
            'profile.preferences': profileData.preferences,
            updated_at: new Date()
          }
        },
        { new: true, runValidators: true }
      );
      
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

module.exports = UserService;
```

#### Restaurant Operations
```javascript
// backend/services/restaurantService.js
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

class RestaurantService {
  // Get restaurants with pagination and filtering
  static async getRestaurants(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search,
        city,
        cuisine_type
      } = options;

      const query = { 'settings.is_active': true };
      
      // Add filters
      if (search) {
        query.$text = { $search: search };
      }
      
      if (city) {
        query['address.city'] = new RegExp(city, 'i');
      }
      
      if (cuisine_type) {
        query.cuisine_types = { $in: [cuisine_type] };
      }

      const restaurants = await Restaurant.find(query)
        .select('name description address cuisine_types images stats')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Restaurant.countDocuments(query);

      return {
        restaurants,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_count: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Get restaurants error:', error);
      throw error;
    }
  }

  // Get restaurant with menu items
  static async getRestaurantWithMenu(restaurantId) {
    try {
      const restaurant = await Restaurant.findById(restaurantId)
        .populate({
          path: 'owner',
          select: 'name email'
        });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      const menuItems = await MenuItem.find({ 
        restaurant: restaurantId,
        'availability.is_available': true
      })
        .sort({ category: 1, display_order: 1 })
        .lean();

      // Group menu items by category
      const menuByCategory = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});

      return {
        ...restaurant.toObject(),
        menu: menuByCategory
      };
    } catch (error) {
      console.error('Get restaurant with menu error:', error);
      throw error;
    }
  }

  // Update restaurant stats (called after orders)
  static async updateStats(restaurantId, orderData) {
    try {
      await Restaurant.findByIdAndUpdate(
        restaurantId,
        {
          $inc: {
            'stats.total_orders': 1,
            'stats.total_revenue': orderData.total_amount
          }
        }
      );
    } catch (error) {
      console.error('Update restaurant stats error:', error);
      throw error;
    }
  }
}

module.exports = RestaurantService;
```

### Error Handling Patterns

```javascript
// backend/middleware/errorHandler.js
const handleMongoError = (error) => {
  console.error('MongoDB error:', error);

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      status: 409,
      message: `${field} already exists`,
      field
    };
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return {
      status: 400,
      message: 'Validation failed',
      errors
    };
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      status: 400,
      message: 'Invalid ID format',
      field: error.path
    };
  }

  // Connection errors
  if (error.name === 'MongoNetworkError') {
    return {
      status: 503,
      message: 'Database connection failed'
    };
  }

  // Default error
  return {
    status: 500,
    message: 'Database operation failed'
  };
};

module.exports = { handleMongoError };
```

## Implementation Examples

### Database Connection with Retry Logic

```javascript
// backend/config/database.js
const mongoose = require('mongoose');
const winston = require('winston');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      if (this.isConnected) {
        return mongoose.connection;
      }

      const options = {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority'
      };

      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      this.retryCount = 0;
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      winston.info('MongoDB connected successfully', {
        host: conn.connection.host,
        database: conn.connection.name
      });

      this.setupEventListeners();
      
      return conn;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      winston.error('MongoDB connection failed', { 
        error: error.message,
        retryCount: this.retryCount
      });
      
      return this.handleConnectionError(error);
    }
  }

  async handleConnectionError(error) {
    this.isConnected = false;
    
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying MongoDB connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.connect();
    } else {
      console.error('Max MongoDB connection retries reached');
      winston.error('MongoDB connection failed permanently', {
        maxRetries: this.maxRetries,
        finalError: error.message
      });
      process.exit(1);
    }
  }

  setupEventListeners() {
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      winston.error('MongoDB connection error', { error: err.message });
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      winston.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      winston.info('MongoDB reconnected');
      this.isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('MongoDB connection closed');
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
}

module.exports = new DatabaseConnection();
```

### Advanced Query Examples

```javascript
// backend/services/analyticsService.js
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

class AnalyticsService {
  // Get restaurant performance metrics
  static async getRestaurantAnalytics(restaurantId, dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      // Aggregation pipeline for complex analytics
      const analytics = await Restaurant.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(restaurantId) } },
        {
          $lookup: {
            from: 'menuitems',
            localField: '_id',
            foreignField: 'restaurant',
            as: 'menu_items'
          }
        },
        {
          $lookup: {
            from: 'orders',
            let: { restaurant_id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$restaurant', '$$restaurant_id'] },
                  created_at: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                  }
                }
              }
            ],
            as: 'orders'
          }
        },
        {
          $project: {
            name: 1,
            total_menu_items: { $size: '$menu_items' },
            total_orders: { $size: '$orders' },
            total_revenue: {
              $sum: '$orders.total_amount'
            },
            avg_order_value: {
              $cond: {
                if: { $gt: [{ $size: '$orders' }, 0] },
                then: {
                  $divide: [
                    { $sum: '$orders.total_amount' },
                    { $size: '$orders' }
                  ]
                },
                else: 0
              }
            },
            popular_items: {
              $slice: [
                {
                  $sortArray: {
                    input: '$menu_items',
                    sortBy: { 'stats.orders_count': -1 }
                  }
                },
                5
              ]
            }
          }
        }
      ]);

      return analytics[0] || null;
    } catch (error) {
      console.error('Get restaurant analytics error:', error);
      throw error;
    }
  }

  // Get trending menu items across all restaurants
  static async getTrendingItems(limit = 10) {
    try {
      const trendingItems = await MenuItem.aggregate([
        {
          $match: {
            'availability.is_available': true,
            'stats.orders_count': { $gt: 0 }
          }
        },
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurant',
            foreignField: '_id',
            as: 'restaurant_info'
          }
        },
        {
          $unwind: '$restaurant_info'
        },
        {
          $project: {
            name: 1,
            description: 1,
            price: 1,
            images: 1,
            category: 1,
            orders_count: '$stats.orders_count',
            avg_rating: '$stats.avg_rating',
            restaurant_name: '$restaurant_info.name',
            restaurant_id: '$restaurant_info._id'
          }
        },
        {
          $sort: { orders_count: -1, avg_rating: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return trendingItems;
    } catch (error) {
      console.error('Get trending items error:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
```

## Integration with Restaurant Developer

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend API
    participant M as MongoDB Atlas
    participant S as Supabase
    participant L as Winston Logger
    
    F->>B: API Request (with JWT)
    B->>S: Validate JWT Token
    S->>B: User Validation
    B->>M: Query/Update Data
    M->>B: Data Response
    B->>L: Log Operation
    B->>F: API Response
    
    Note over M: Indexes optimize queries
    Note over L: All DB operations logged
    Note over B: Connection pooling for performance
```

### Performance Optimization Strategies

#### Indexing Strategy
```javascript
// Create indexes for optimal performance
const createIndexes = async () => {
  try {
    // User indexes
    await User.collection.createIndex({ supabase_id: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1, created_at: -1 });

    // Restaurant indexes
    await Restaurant.collection.createIndex({ owner: 1, created_at: -1 });
    await Restaurant.collection.createIndex({ 'address.city': 1, cuisine_types: 1 });
    await Restaurant.collection.createIndex({ 'settings.is_active': 1, 'stats.avg_rating': -1 });
    await Restaurant.collection.createIndex({
      name: 'text',
      description: 'text',
      cuisine_types: 'text'
    });

    // MenuItem indexes
    await MenuItem.collection.createIndex({ restaurant: 1, category: 1, display_order: 1 });
    await MenuItem.collection.createIndex({ restaurant: 1, 'availability.is_available': 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Index creation error:', error);
  }
};
```

#### Query Optimization
```javascript
// Optimized queries with proper projections and population
class OptimizedQueries {
  // Get restaurants with minimal data for listing
  static async getRestaurantsList(filters = {}) {
    return Restaurant.find(filters)
      .select('name description address.city cuisine_types images.logo stats.avg_rating')
      .lean() // Returns plain JavaScript objects instead of Mongoose documents
      .hint({ 'settings.is_active': 1, 'stats.avg_rating': -1 }); // Use specific index
  }

  // Get menu items with restaurant info efficiently
  static async getMenuItemsWithRestaurant(restaurantId) {
    return MenuItem.find({ restaurant: restaurantId })
      .populate('restaurant', 'name address.city') // Only populate needed fields
      .select('name description price category images availability')
      .lean();
  }

  // Batch operations for better performance
  static async updateMultipleMenuItems(updates) {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: update.data }
      }
    }));

    return MenuItem.bulkWrite(bulkOps);
  }
}
```

#### Caching Layer
```javascript
// Simple in-memory cache for frequently accessed data
class DatabaseCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

const dbCache = new DatabaseCache();

// Use cache in service methods
class CachedRestaurantService {
  static async getRestaurant(id) {
    const cacheKey = `restaurant:${id}`;
    let restaurant = dbCache.get(cacheKey);
    
    if (!restaurant) {
      restaurant = await Restaurant.findById(id).lean();
      if (restaurant) {
        dbCache.set(cacheKey, restaurant);
      }
    }
    
    return restaurant;
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Connection Timeout"
```javascript
// Solution: Implement connection retry logic with exponential backoff
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000 * (i + 1), // Increase timeout with each retry
        connectTimeoutMS: 10000 * (i + 1)
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

#### Issue: "Slow Queries"
```javascript
// Solution: Enable slow query logging and analysis
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now();
  
  // Log slow queries (> 100ms)
  setTimeout(() => {
    const duration = Date.now() - start;
    if (duration > 100) {
      winston.warn('Slow MongoDB query detected', {
        collection: collectionName,
        method,
        query: JSON.stringify(query),
        duration: `${duration}ms`
      });
    }
  }, 0);
});

// Add query performance monitoring
const monitorQuery = (queryPromise, queryName) => {
  const start = Date.now();
  
  return queryPromise
    .then(result => {
      const duration = Date.now() - start;
      winston.info('Query completed', {
        name: queryName,
        duration: `${duration}ms`,
        resultCount: Array.isArray(result) ? result.length : 1
      });
      return result;
    })
    .catch(error => {
      const duration = Date.now() - start;
      winston.error('Query failed', {
        name: queryName,
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    });
};
```

#### Issue: "Memory Leaks"
```javascript
// Solution: Proper connection and cursor management
class DatabaseManager {
  constructor() {
    this.connections = new Map();
  }

  async getConnection(dbName) {
    if (!this.connections.has(dbName)) {
      const connection = await mongoose.createConnection(
        process.env.MONGODB_URI.replace('/restaurant_developer', `/${dbName}`)
      );
      
      this.connections.set(dbName, connection);
    }
    
    return this.connections.get(dbName);
  }

  async closeAllConnections() {
    for (const [dbName, connection] of this.connections) {
      await connection.close();
      console.log(`Closed connection to ${dbName}`);
    }
    this.connections.clear();
  }

  // Handle large result sets with cursors
  async processLargeDataset(query, processor) {
    const cursor = query.cursor();
    
    try {
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        await processor(doc);
      }
    } finally {
      await cursor.close();
    }
  }
}
```

### Monitoring and Alerting

```javascript
// MongoDB health check endpoint
const healthCheck = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (dbStatus === 1) {
      // Test actual database operation
      await mongoose.connection.db.admin().ping();
      
      res.status(200).json({
        status: 'healthy',
        database: {
          status: statusMap[dbStatus],
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          readyState: dbStatus
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: {
          status: statusMap[dbStatus],
          readyState: dbStatus
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    winston.error('Database health check failed', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Resources

### Official Documentation
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Mongoose ODM Documentation](https://mongoosejs.com/docs/)
- [MongoDB Query Optimization](https://docs.mongodb.com/manual/core/query-optimization/)

### Security Best Practices
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Atlas Security Features](https://docs.atlas.mongodb.com/security/)
- [Data Encryption](https://docs.atlas.mongodb.com/security-cluster-encryption/)

### Performance Optimization
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Atlas Performance Advisor](https://docs.atlas.mongodb.com/performance-advisor/)
- [Indexing Strategies](https://docs.mongodb.com/manual/applications/indexes/)

### Community Resources
- [MongoDB Community Forum](https://developer.mongodb.com/community/forums/)
- [Stack Overflow - MongoDB Tag](https://stackoverflow.com/questions/tagged/mongodb)
- [MongoDB University](https://university.mongodb.com/)

### Migration and Scaling
- [Atlas Migration Guide](https://docs.atlas.mongodb.com/import/)
- [Sharding Guide](https://docs.mongodb.com/manual/sharding/)
- [Replica Set Configuration](https://docs.mongodb.com/manual/replication/)

---

*Last Updated: January 2025*
*Version: 1.0.0* 