const request = require('supertest');
const app = require('../app');
const { setupTestDB, closeTestDB, clearTestDB } = require('./testUtils');
const { createMockToken } = require('./testAuthHelper');
const User = require('../models/User');

// Get the mocked functions from testMocks.js
const { verifyToken, createUser, signInWithPassword } = require('../db/supabase');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should create a new customer user successfully', async () => {
      // Mock Supabase createUser function
      createUser.mockResolvedValue({
        id: 'test-uuid-123',
        email: 'test@example.com'
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.user_id).toBe('test-uuid-123');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('customer');

      // Verify user was created in MongoDB with email field
      const mongoUser = await User.findOne({ supabase_id: 'test-uuid-123' });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser.name).toBe('Test User');
      expect(mongoUser.email).toBe('test@example.com'); // Email now stored in MongoDB
      expect(mongoUser.role).toBe('customer');
    });

    it('should create a restaurant owner user successfully', async () => {
      createUser.mockResolvedValue({
        id: 'owner-uuid-123',
        email: 'owner@restaurant.com'
      });

      const userData = {
        email: 'owner@restaurant.com',
        password: 'password123',
        name: 'Restaurant Owner',
        role: 'restaurant_owner',
        restaurant_id: 'restaurant-uuid-123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('restaurant_owner');

      // Verify restaurant_id and email were set in MongoDB
      const mongoUser = await User.findOne({ supabase_id: 'owner-uuid-123' });
      expect(mongoUser.restaurant_id).toBe('restaurant-uuid-123');
      expect(mongoUser.email).toBe('owner@restaurant.com'); // Email now stored in MongoDB
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
          // missing password and name
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return error for invalid role', async () => {
      const response = await request(app)
        .post('/auth/register')
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

  describe('POST /auth/signup', () => {
    it('should create a new user successfully via signup endpoint', async () => {
      // Mock Supabase createUser function
      createUser.mockResolvedValue({
        id: 'signup-uuid-123',
        email: 'signup@example.com'
      });

      const userData = {
        email: 'signup@example.com',
        password: 'password123',
        name: 'Signup User',
        role: 'restaurant_owner'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.user_id).toBe('signup-uuid-123');
      expect(response.body.user.email).toBe('signup@example.com');
      expect(response.body.user.name).toBe('Signup User');
      expect(response.body.user.role).toBe('restaurant_owner');

      // Verify user was created in MongoDB with email field
      const mongoUser = await User.findOne({ supabase_id: 'signup-uuid-123' });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser.name).toBe('Signup User');
      expect(mongoUser.email).toBe('signup@example.com'); // Email now stored in MongoDB
      expect(mongoUser.role).toBe('restaurant_owner');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user in MongoDB with email field
      await User.create({
        supabase_id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer'
      });
    });

    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('mock.jwt.token.test-user-123');
      expect(response.body.user.user_id).toBe('test-user-123');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('test@example.com'); // Email returned from MongoDB
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

    it('should return error when user profile not found in MongoDB', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(404);

      expect(response.body.error).toBe('User profile not found - please complete registration');
    });
  });

  describe('GET /auth/me', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        supabase_id: 'test-user-123',
        email: 'test@example.com',
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
        .get('/auth/me')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.user.user_id).toBe('test-user-123');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('test@example.com'); // Email returned from MongoDB
      expect(response.body.user.role).toBe('customer');
    });

    it('should return error without authorization token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
}); 