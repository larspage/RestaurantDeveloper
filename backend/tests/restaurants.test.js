const request = require('supertest');
const app = require('../app');
const { createTestUser, getAuthToken } = require('./testUtils');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

describe('Restaurant API Endpoints', () => {
  let testOwner;
  let testCustomer;
  let testRestaurant;

  beforeEach(async () => {
    // Create test users for each test
    testOwner = await User.create({
      supabase_id: 'test-owner-123',
      email: 'owner@test.com',
      name: 'Test Owner',
      role: 'restaurant_owner'
    });

    testCustomer = await User.create({
      supabase_id: 'test-customer-123',
      email: 'customer@test.com',
      name: 'Test Customer',
      role: 'customer'
    });

    // Create test restaurants for GET tests
    testRestaurant = await Restaurant.create({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      owner: testOwner._id
    });
  });

  describe('POST /restaurants', () => {
    it('should allow a restaurant owner to create a new restaurant', async () => {
      // Get auth token for test owner
      const ownerToken = await getAuthToken(testOwner);
      
      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'The Test Kitchen', description: 'A restaurant created by a test.' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe('The Test Kitchen');
      
      // Verify it was saved to the DB
      const newRestaurant = await Restaurant.findById(res.body._id);
      expect(newRestaurant).not.toBeNull();
    });

    it('should NOT allow a customer to create a restaurant', async () => {
      // Get auth token for test customer
      const customerToken = await getAuthToken(testCustomer);
      
      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'The Forbidden Restaurant', description: 'This should not be created.' });

      expect(res.statusCode).toEqual(403); // Forbidden
    });
  });

  describe('GET /restaurants', () => {
    it('should return a list of all restaurants', async () => {
      const res = await request(app).get('/restaurants');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should have at least the test restaurant we created
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some(r => r.name === 'Test Restaurant')).toBe(true);
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should return a single restaurant by its ID', async () => {
      const res = await request(app).get(`/restaurants/${testRestaurant._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Test Restaurant');
      expect(res.body.description).toBe('A test restaurant');
    });
  });
}); 