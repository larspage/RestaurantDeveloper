const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Theme = require('../models/Theme');
const { createTestUser, getAuthToken } = require('./testUtils');

describe('Menu API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let testTheme;
  let testRestaurant;
  let testMenu;
  let owner;
  let customer;

  beforeAll(async () => {
    // Create test users
    owner = await createTestUser({
      email: 'owner@test.com',
      password: 'testpass123',
      name: 'Test Owner',
      role: 'owner'
    });
    
    customer = await createTestUser({
      email: 'customer@test.com',
      password: 'testpass123',
      name: 'Test Customer',
      role: 'customer'
    });

    ownerToken = await getAuthToken(owner);
    customerToken = await getAuthToken(customer);

    // Create a test theme
    testTheme = await Theme.create({
      name: 'test-theme',
      displayName: 'Test Theme',
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#cccccc',
        background: '#f5f5f5',
        text: '#333333'
      },
      fonts: {
        heading: 'Arial',
        body: 'Helvetica'
      }
    });
  });

  beforeEach(async () => {
    // Create a test restaurant and menu before each test
    testRestaurant = await Restaurant.create({
      name: 'Test Restaurant for Menu',
      description: 'A test restaurant',
      theme_id: testTheme._id,
      owner_id: new mongoose.Types.ObjectId().toString()
    });

    testMenu = await Menu.create({
      restaurant_id: testRestaurant.owner_id,
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

  afterEach(async () => {
    // Clean up menus after each test
    await Menu.deleteMany({});
  });

  afterAll(async () => {
    // Clean up restaurants and close connection
    await Restaurant.deleteMany({});
    await Theme.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /menus/:restaurant_id', () => {
    it('should return restaurant menu', async () => {
      const res = await request(app)
        .get(`/menus/${testRestaurant.owner_id}`)
        .expect(200);

      expect(res.body.sections).toBeDefined();
      expect(res.body.sections[0].name).toBe('Test Section');
    });

    it('should return 404 for non-existent restaurant menu', async () => {
      await request(app)
        .get(`/menus/${new mongoose.Types.ObjectId().toString()}`)
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
        .post(`/menus/${testRestaurant.owner_id}`)
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
        .post(`/menus/${testRestaurant.owner_id}`)
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
        .post(`/menus/${testRestaurant.owner_id}/sections`)
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
        .post(`/menus/${testRestaurant.owner_id}/sections`)
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
        .delete(`/menus/${testRestaurant.owner_id}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.menu.sections).toHaveLength(0);
    });

    it('should not allow customers to delete sections', async () => {
      const sectionId = testMenu.sections[0]._id;

      await request(app)
        .delete(`/menus/${testRestaurant.owner_id}/sections/${sectionId}`)
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
        .post(`/menus/${testRestaurant.owner_id}/sections/${sectionId}/items`)
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
        .post(`/menus/${testRestaurant.owner_id}/sections/${sectionId}/items`)
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
        .delete(`/menus/${testRestaurant.owner_id}/sections/${sectionId}/items/${itemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.menu.sections[0].items).toHaveLength(0);
    });

    it('should not allow customers to delete items', async () => {
      const sectionId = testMenu.sections[0]._id;
      const itemId = testMenu.sections[0].items[0]._id;

      await request(app)
        .delete(`/menus/${testRestaurant.owner_id}/sections/${sectionId}/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
}); 