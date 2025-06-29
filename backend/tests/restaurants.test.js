const request = require('supertest');
const app = require('../app');
const { getAuthTokenFor } = require('./testAuthHelper');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const connectDB = require('../db/mongo');
const mongoose = require('mongoose');

describe('Restaurant API Endpoints', () => {
  // Connect to the DB before all tests in this file
  beforeAll(async () => {
    await connectDB();
  });

  // Disconnect after all tests in this file
  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /restaurants', () => {
    it('should allow a seeded owner to create a new restaurant', async () => {
      // Get auth token for a seeded owner
      const ownerToken = await getAuthTokenFor('owner1@example.com');
      
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

    it('should NOT allow a seeded customer to create a restaurant', async () => {
      // Get auth token for a seeded customer
      const customerToken = await getAuthTokenFor('customer1@example.com');
      
      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'The Forbidden Restaurant', description: 'This should not be created.' });

      expect(res.statusCode).toEqual(403); // Forbidden
    });
  });

  describe('GET /restaurants', () => {
    it('should return a list of all seeded restaurants', async () => {
      const res = await request(app).get('/restaurants');
      
      expect(res.statusCode).toEqual(200);
      // The seed script creates 3 restaurants
      expect(res.body.length).toBe(3);
      expect(res.body[0].name).toBe('The Golden Spoon');
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should return a single restaurant by its ID', async () => {
      // Find a seeded restaurant in the DB to get a valid ID
      const restaurant = await Restaurant.findOne({ name: 'Pizza Palace' });
      expect(restaurant).not.toBeNull();

      const res = await request(app).get(`/restaurants/${restaurant._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Pizza Palace');
    });
  });
}); 