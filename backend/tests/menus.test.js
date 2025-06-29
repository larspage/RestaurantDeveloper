const request = require('supertest');
const app = require('../app');
const { getAuthTokenFor } = require('./testAuthHelper');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const connectDB = require('../db/mongo');
const mongoose = require('mongoose');

describe('Menu API Endpoints', () => {
  let restaurant;

  beforeAll(async () => {
    await connectDB();
    // Get a seeded restaurant to use for tests
    restaurant = await Restaurant.findOne({ name: 'The Golden Spoon' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /menus/:restaurant_id', () => {
    it('should retrieve the menu for a given restaurant', async () => {
      const res = await request(app).get(`/menus/${restaurant._id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.restaurant).toBe(restaurant._id.toString());
      // The seed script creates 2 sections for The Golden Spoon
      expect(res.body.sections.length).toBe(2);
      expect(res.body.sections[0].name).toBe('Starters');
    });
  });

  describe('POST /menus/:restaurant_id/sections', () => {
    it('should allow the restaurant owner to add a new section', async () => {
      const ownerToken = await getAuthTokenFor('owner1@example.com');
      const newSection = { name: 'Desserts' };

      const res = await request(app)
        .post(`/menus/${restaurant._id}/sections`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newSection);

      expect(res.statusCode).toEqual(200);
      expect(res.body.sections).toHaveLength(3);
      expect(res.body.sections[2].name).toBe('Desserts');
    });
  });

  describe('POST /menus/:restaurant_id/sections/:section_id/items', () => {
    it('should allow the restaurant owner to add a new item to a section', async () => {
      const ownerToken = await getAuthTokenFor('owner1@example.com');
      const newItem = { name: 'Cheesecake', price: 9.75 };
      
      // Find the ID of the 'Mains' section from the seeded menu
      const menu = await Menu.findOne({ restaurant: restaurant._id });
      const mainsSection = menu.sections.find(s => s.name === 'Mains');

      const res = await request(app)
        .post(`/menus/${restaurant._id}/sections/${mainsSection._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newItem);

      expect(res.statusCode).toEqual(200);
      const updatedMains = res.body.sections.find(s => s.name === 'Mains');
      expect(updatedMains.items).toHaveLength(3); // Mains had 2 items initially
      expect(updatedMains.items[2].name).toBe('Cheesecake');
    });
  });
}); 