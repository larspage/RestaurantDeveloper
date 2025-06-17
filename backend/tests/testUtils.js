const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// Mock JWT module with simple token handling
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    return `mock.jwt.token.${payload.sub}`;
  }),
  verify: jest.fn((token, secret) => {
    if (token.startsWith('mock.jwt.token.')) {
      const userId = token.replace('mock.jwt.token.', '');
      return { sub: userId, email: 'test@example.com', role: 'customer' };
    }
    throw new Error('Invalid token');
  })
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  };

  return {
    createClient: jest.fn(() => mockClient),
    mockClient // Export for test access
  };
});

// Mock Supabase module
jest.mock('../db/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn()
      }
    },
    verifyToken: jest.fn((token) => {
      if (token.startsWith('mock.jwt.token.')) {
        const userId = token.replace('mock.jwt.token.', '');
        return Promise.resolve({ id: userId, email: 'test@example.com' });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
    getUserProfile: jest.fn()
  };
});

// Create a test user and return a JWT token
const createTestUser = async (userData = {}) => {
  const defaultData = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer'
  };

  const mergedData = { ...defaultData, ...userData };
  const supabaseId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const user = await User.create({
    supabase_id: supabaseId,
    email: mergedData.email,
    name: mergedData.name,
    role: mergedData.role === 'owner' ? 'restaurant_owner' : 'customer'
  });

  return user;
};

// Generate a JWT token for testing
const getAuthToken = async (user) => {
  return `mock.jwt.token.${user.supabase_id}`;
};

// Setup test database connection
const setupTestDB = async () => {
  try {
    // Clear any existing connections
    await mongoose.disconnect();
    
    // Set Mongoose options for testing
    mongoose.set('strictQuery', true);
    
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_developer_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    // Clear all collections before tests
    await clearTestDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear test database
const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await setupTestDB();
  }
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// Close test database connection
const closeTestDB = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

// Create test data helper
const createTestData = async () => {
  const owner = await createTestUser({
    email: 'owner@example.com',
    name: 'Restaurant Owner',
    role: 'owner'
  });

  const customer = await createTestUser({
    email: 'customer@example.com',
    name: 'Test Customer',
    role: 'customer'
  });

  const restaurant = await Restaurant.create({
    name: 'Test Restaurant',
    owner: owner._id,
    description: 'Test restaurant description',
    location: 'Test location',
    cuisine: ['Test cuisine'],
    status: 'active'
  });

  const menu = await Menu.create({
    restaurant: restaurant._id,
    name: 'Test Menu',
    description: 'Test menu description',
    items: [{
      name: 'Test Item',
      description: 'Test item description',
      price: 9.99,
      category: 'Test category'
    }]
  });

  return {
    owner,
    customer,
    restaurant,
    menu
  };
};

module.exports = {
  createTestUser,
  getAuthToken,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  createTestData
}; 