const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User } = require('../models');

// Mock Supabase for testing
jest.mock('../db/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn()
    }
  },
  supabaseAdmin: {},
  verifyToken: jest.fn(),
  getUserProfile: jest.fn()
}));

const { supabase, verifyToken } = require('../db/supabase');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_restaurant_db';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all users before each test
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should create a new customer user successfully', async () => {
      // Mock Supabase signup success
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-uuid-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user_id).toBe('test-uuid-123');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.name).toBe('Test User');
      expect(response.body.role).toBe('customer');

      // Verify user was created in MongoDB
      const mongoUser = await User.findOne({ supabase_id: 'test-uuid-123' });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser.name).toBe('Test User');
      expect(mongoUser.role).toBe('customer');
    });

    it('should create a restaurant owner user successfully', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'owner-uuid-123',
            email: 'owner@restaurant.com'
          }
        },
        error: null
      });

      const userData = {
        email: 'owner@restaurant.com',
        password: 'password123',
        name: 'Restaurant Owner',
        role: 'restaurant_owner',
        restaurant_id: 'restaurant-uuid-123'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.role).toBe('restaurant_owner');

      // Verify restaurant_id was set in MongoDB
      const mongoUser = await User.findOne({ supabase_id: 'owner-uuid-123' });
      expect(mongoUser.restaurant_id).toBe('restaurant-uuid-123');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com'
          // missing password and name
        })
        .expect(400);

      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should return error for invalid role', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'invalid_role'
        })
        .expect(400);

      expect(response.body.error).toBe('Role must be either customer or restaurant_owner');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user in MongoDB
      await User.create({
        supabase_id: 'test-user-123',
        name: 'Test User',
        role: 'customer'
      });
    });

    it('should login user successfully', async () => {
      // Mock Supabase login success
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com'
          },
          session: {
            access_token: 'mock-jwt-token'
          }
        },
        error: null
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('mock-jwt-token');
      expect(response.body.user.user_id).toBe('test-user-123');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('GET /auth/profile/:user_id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        supabase_id: 'test-user-123',
        name: 'Test User',
        role: 'customer'
      });

      // Mock token verification
      verifyToken.mockResolvedValue({
        id: 'test-user-123',
        email: 'test@example.com'
      });
    });

    it('should return user profile successfully', async () => {
      const response = await request(app)
        .get('/auth/profile/test-user-123')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.user_id).toBe('test-user-123');
      expect(response.body.name).toBe('Test User');
      expect(response.body.role).toBe('customer');
    });

    it('should return error without authorization token', async () => {
      const response = await request(app)
        .get('/auth/profile/test-user-123')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
}); 