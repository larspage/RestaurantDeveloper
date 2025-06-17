const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const { createTestUser, getAuthToken } = require('./testUtils');

describe('Menu API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let testRestaurant;
  let testMenu;
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
      name: 'Test Restaurant for Menu',
      description: 'A test restaurant',
      location: 'Test Location',
      cuisine: ['Test Cuisine'],
      owner: testOwner._id,
      status: 'active'
    });

    // Create a test menu for each test
    testMenu = await Menu.create({
      restaurant: testRestaurant._id,
      sections: [{
        name: 'Test Section',
        description: 'A test section',
        displayOrder: 0,
        items: [{
          name: 'Test Item',
          description: 'A test item',
          price: 9.99,
          available: true
        }]
      }]
    });
  });

  describe('GET /menus/:restaurant_id', () => {
    it('should return restaurant menu', async () => {
      const res = await request(app)
        .get(`/menus/${testRestaurant._id}`)
        .expect(200);

      expect(res.body.sections).toBeDefined();
      expect(res.body.sections[0].name).toBe('Test Section');
    });

    it('should return 404 for non-existent restaurant menu', async () => {
      await request(app)
        .get(`/menus/${new mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });

  describe('POST /menus/:restaurant_id', () => {
    it('should create a new menu when owner is authenticated', async () => {
      const newMenu = {
        sections: [{
          name: 'New Section',
          description: 'A new section',
          displayOrder: 1,
          items: [{
            name: 'New Item',
            price: 12.99,
            description: 'A new item'
          }]
        }]
      };

      const res = await request(app)
        .post(`/menus/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newMenu)
        .expect(200);

      expect(res.body.sections[0].name).toBe('New Section');
      expect(res.body.sections[0].items[0].name).toBe('New Item');
    });

    it('should not allow customers to create menus', async () => {
      const newMenu = {
        sections: [{
          name: 'New Section',
          items: []
        }]
      };

      await request(app)
        .post(`/menus/${testRestaurant._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newMenu)
        .expect(403);
    });
  });

  describe('POST /menus/:restaurant_id/sections', () => {
    it('should add a new section when owner is authenticated', async () => {
      const newSection = {
        section: {
          name: 'New Section',
          description: 'A new section',
          displayOrder: 2
        }
      };

      const res = await request(app)
        .post(`/menus/${testRestaurant._id}/sections`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newSection)
        .expect(200);

      expect(res.body.sections).toHaveLength(2);
      expect(res.body.sections[1].name).toBe('New Section');
    });

    it('should update existing section when owner is authenticated', async () => {
      const existingSection = testMenu.sections[0];
      const updatedSection = {
        section: {
          _id: existingSection._id,
          name: 'Updated Section',
          description: 'Updated description'
        }
      };

      const res = await request(app)
        .post(`/menus/${testRestaurant._id}/sections`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updatedSection)
        .expect(200);

      expect(res.body.sections[0].name).toBe('Updated Section');
      expect(res.body.sections[0].description).toBe('Updated description');
    });
  });

  describe('DELETE /menus/:restaurant_id/sections/:section_id', () => {
    it('should delete section when owner is authenticated', async () => {
      const sectionId = testMenu.sections[0]._id;

      const res = await request(app)
        .delete(`/menus/${testRestaurant._id}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.menu.sections).toHaveLength(0);
    });

    it('should not allow customers to delete sections', async () => {
      const sectionId = testMenu.sections[0]._id;

      await request(app)
        .delete(`/menus/${testRestaurant._id}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /menus/:restaurant_id/sections/:section_id/items', () => {
    it('should add a new item to section when owner is authenticated', async () => {
      const sectionId = testMenu.sections[0]._id;
      const newItem = {
        item: {
          name: 'New Item',
          price: 14.99,
          description: 'A new item',
          customizations: ['Extra cheese']
        }
      };

      const res = await request(app)
        .post(`/menus/${testRestaurant._id}/sections/${sectionId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(newItem)
        .expect(200);

      expect(res.body.sections[0].items).toHaveLength(2);
      expect(res.body.sections[0].items[1].name).toBe('New Item');
    });

    it('should update existing item when owner is authenticated', async () => {
      const sectionId = testMenu.sections[0]._id;
      const existingItem = testMenu.sections[0].items[0];
      const updatedItem = {
        item: {
          _id: existingItem._id,
          name: 'Updated Item',
          price: 19.99
        }
      };

      const res = await request(app)
        .post(`/menus/${testRestaurant._id}/sections/${sectionId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updatedItem)
        .expect(200);

      expect(res.body.sections[0].items[0].name).toBe('Updated Item');
      expect(res.body.sections[0].items[0].price).toBe(19.99);
    });
  });

  describe('DELETE /menus/:restaurant_id/sections/:section_id/items/:item_id', () => {
    it('should delete item when owner is authenticated', async () => {
      const sectionId = testMenu.sections[0]._id;
      const itemId = testMenu.sections[0].items[0]._id;

      const res = await request(app)
        .delete(`/menus/${testRestaurant._id}/sections/${sectionId}/items/${itemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.menu.sections[0].items).toHaveLength(0);
    });

    it('should not allow customers to delete items', async () => {
      const sectionId = testMenu.sections[0]._id;
      const itemId = testMenu.sections[0].items[0]._id;

      await request(app)
        .delete(`/menus/${testRestaurant._id}/sections/${sectionId}/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
}); 