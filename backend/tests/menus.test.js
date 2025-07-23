const request = require('supertest');
const app = require('../app');
const { getAuthToken, clearTestDB } = require('./testUtils');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

describe('Menu API Endpoints', () => {
  let restaurant;
  let testOwner;
  let testMenu;

  beforeEach(async () => {
    // Clear database before each test to avoid duplicate key errors
    await clearTestDB();
    
    // Create test owner with unique ID
    testOwner = await User.create({
      supabase_id: `test-menu-owner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: 'menu-owner@test.com',
      name: 'Test Menu Owner',
      role: 'restaurant_owner'
    });

    // Create test restaurant
    restaurant = await Restaurant.create({
      name: 'Test Restaurant',
      description: 'A test restaurant',
      owner: testOwner._id
    });

    // Create test menu with sections
    testMenu = await Menu.create({
      restaurant: restaurant._id,
      name: 'Test Menu',
      sections: [
        {
          name: 'Starters',
          description: 'Start your meal right',
          items: [
            {
              name: 'Test Appetizer',
              description: 'A delicious test appetizer',
              price: 8.99,
              category: 'Appetizer',
              available: true
            }
          ]
        },
        {
          name: 'Mains',
          description: 'Main courses',
          items: [
            {
              name: 'Test Main',
              description: 'A hearty main course',
              price: 18.99,
              category: 'Main',
              available: true
            },
            {
              name: 'Another Main',
              description: 'Another main course option',
              price: 22.99,
              category: 'Main',
              available: true
            }
          ]
        }
      ]
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await clearTestDB();
  });

  describe('GET /menus/:restaurant_id', () => {
    it('should retrieve the menu for a given restaurant', async () => {
      const res = await request(app).get(`/menus/${restaurant._id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.restaurant).toBe(restaurant._id.toString());
      expect(res.body.sections.length).toBe(2);
      expect(res.body.sections[0].name).toBe('Starters');
      expect(res.body.sections[1].name).toBe('Mains');
    });
  });

  describe('POST /menus/:restaurant_id/sections', () => {
    it('should allow the restaurant owner to add a new section', async () => {
      const ownerToken = await getAuthToken(testOwner);
      const newSection = { name: 'Desserts', description: 'Sweet treats' };

      const res = await request(app)
        .post(`/menus/${restaurant._id}/sections`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ section: newSection });

      expect(res.statusCode).toEqual(200);
      expect(res.body.sections).toHaveLength(3);
      expect(res.body.sections[2].name).toBe('Desserts');
    });
  });

  describe('POST /menus/:restaurant_id/sections/:section_id/items', () => {
    it('should allow the restaurant owner to add a new item to a section', async () => {
      const ownerToken = await getAuthToken(testOwner);
      const newItem = { 
        name: 'Cheesecake', 
        description: 'Delicious cheesecake',
        price: 9.75,
        category: 'Dessert',
        available: true
      };
      
      // Get the Mains section from our test menu
      const mainsSection = testMenu.sections.find(s => s.name === 'Mains');

      const res = await request(app)
        .post(`/menus/${restaurant._id}/sections/${mainsSection._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ item: newItem });

      expect(res.statusCode).toEqual(200);
      const updatedMains = res.body.sections.find(s => s.name === 'Mains');
      expect(updatedMains.items).toHaveLength(3); // Mains had 2 items initially
      expect(updatedMains.items[2].name).toBe('Cheesecake');
    });
  });
}); 