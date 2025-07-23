const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

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

// Generate an auth token for a user
const getAuthToken = async (user) => {
  return jwt.sign({ sub: user.supabase_id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

// Setup test database connection
const setupTestDB = async () => {
  const { connect } = require('../db/mongo');
  
  if (mongoose.connection.readyState === 0) {
    await connect();
  }
};

// Clear all test data
const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await setupTestDB();
  }
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
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
    email: 'owner@test.com',
    name: 'Test Owner',
    role: 'restaurant_owner'
  });

  const customer = await createTestUser({
    email: 'customer@test.com',
    name: 'Test Customer',
    role: 'customer'
  });

  const restaurant = await Restaurant.create({
    name: 'Test Restaurant',
    description: 'A test restaurant',
    owner: owner._id
  });

  const menu = await Menu.create({
    restaurant_id: restaurant._id,
    sections: [
      {
        name: 'Appetizers',
        description: 'Start your meal right',
        items: [
          {
            name: 'Bruschetta',
            description: 'Fresh tomatoes on toasted bread',
            price: 8.99,
            category: 'Appetizer',
            available: true
          }
        ]
      }
    ]
  });

  return { owner, customer, restaurant, menu };
};

module.exports = {
  createTestUser,
  getAuthToken,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  createTestData
}; 