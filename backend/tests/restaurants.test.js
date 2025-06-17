const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const { createTestUser, getAuthToken } = require('./testUtils');

describe('Restaurant API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let testRestaurant;
  let testOwner;
  let testCustomer;

  beforeEach(async () => {
    // Create test users for each test
    testOwner = await createTestUser({
      email: 'owner@test.com',
      name: 'Test Owner',
      role: 'owner'
    });
    
    testCustomer = await createTestUser({
      email: 'customer@test.com',
      name: 'Test Customer',
      role: 'customer'
    });

    ownerToken = await getAuthToken(testOwner);
    customerToken = await getAuthToken(testCustomer);

    // Create a test restaurant for each test
    testRestaurant = await Restaurant.create({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      location: 'Test Location',
      cuisine: ['Test Cuisine'],
      owner: testOwner._id,
      status: 'active'
    });
  });

  describe('GET /restaurants', () => {
    it('should return all restaurants', async () => {
      const res = await request(app)
        .get('/restaurants')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Restaurant');
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should return a single restaurant', async () => {
      const res = await request(app)
        .get(`/restaurants/${testRestaurant._id}`)
        .expect(200);

      expect(res.body.name).toBe('Test Restaurant');
      expect(res.body.description).toBe('A test restaurant');
    });

    it('should return 404 for non-existent restaurant', async () => {
      await request(app)
        .get(`/restaurants/${new mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });

  describe('POST /restaurants', () => {
    it('should create a new restaurant when owner is authenticated', async () => {
      const newRestaurant = {
        name: 'New Restaurant',
        description: 'A new test restaurant',
        location: 'New Location',
        cuisine: ['New Cuisine']
      };

      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newRestaurant)
        .expect(201);

      expect(res.body.name).toBe('New Restaurant');
      expect(res.body.description).toBe('A new test restaurant');
    });

    it('should not allow customers to create restaurants', async () => {
      const newRestaurant = {
        name: 'New Restaurant',
        location: 'New Location'
      };

      await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newRestaurant)
        .expect(403);
    });
  });

  describe('PATCH /restaurants/:id', () => {
    it('should update restaurant when owner is authenticated', async () => {
      const update = {
        name: 'Updated Restaurant',
        description: 'Updated description'
      };

      const res = await request(app)
        .patch(`/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(update)
        .expect(200);

      expect(res.body.name).toBe('Updated Restaurant');
      expect(res.body.description).toBe('Updated description');
    });

    it('should not allow customers to update restaurants', async () => {
      const update = {
        name: 'Updated Restaurant'
      };

      await request(app)
        .patch(`/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(update)
        .expect(403);
    });
  });

  describe('DELETE /restaurants/:id', () => {
    it('should delete restaurant when owner is authenticated', async () => {
      await request(app)
        .delete(`/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const deletedRestaurant = await Restaurant.findById(testRestaurant._id);
      expect(deletedRestaurant).toBeNull();
    });

    it('should not allow customers to delete restaurants', async () => {
      await request(app)
        .delete(`/restaurants/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      const restaurant = await Restaurant.findById(testRestaurant._id);
      expect(restaurant).not.toBeNull();
    });
  });
}); 