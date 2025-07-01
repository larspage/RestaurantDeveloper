const request = require('supertest');
const app = require('../app');
const { getAuthToken } = require('./testUtils');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Menu = require('../models/Menu');

describe('Order API Endpoints', () => {
  let restaurant;
  let customer;
  let customerToken;
  let menu;
  let testOwner;

  beforeEach(async () => {
    // Create test owner
    testOwner = await User.create({
      supabase_id: 'test-owner-123',
      email: 'owner@test.com',
      name: 'Test Owner',
      role: 'restaurant_owner'
    });

    // Create test customer
    customer = await User.create({
      supabase_id: 'test-customer-123',
      email: 'customer@test.com',
      name: 'Test Customer',
      role: 'customer'
    });

    // Create test restaurant
    restaurant = await Restaurant.create({
      name: 'Test Pizza Place',
      description: 'A test pizza restaurant',
      owner: testOwner._id
    });

    // Create test menu
    menu = await Menu.create({
      restaurant: restaurant._id,
      name: 'Test Menu',
      sections: [
        {
          name: 'Pizzas',
          description: 'Delicious pizzas',
          items: [
            {
              name: 'Margherita',
              description: 'Classic tomato and mozzarella',
              price: 14.00,
              category: 'Pizza',
              available: true
            }
          ]
        },
        {
          name: 'Sides',
          description: 'Side dishes',
          items: [
            {
              name: 'Garlic Bread',
              description: 'Crispy garlic bread',
              price: 6.50,
              category: 'Side',
              available: true
            }
          ]
        }
      ]
    });

    customerToken = await getAuthToken(customer);
  });

  describe('POST /orders/new', () => {
    it('should allow a logged-in customer to place a new order', async () => {
      const pizzaItem = menu.sections.find(s => s.name === 'Pizzas').items[0]; // Margherita
      const newOrder = {
        restaurant_id: restaurant._id,
        items: [{
          _id: pizzaItem._id,
          name: pizzaItem.name,
          price: pizzaItem.price,
          quantity: 2,
        }],
        total_price: pizzaItem.price * 2,
      };

      const res = await request(app)
        .post('/orders/new')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newOrder);

      expect(res.statusCode).toEqual(201);
      expect(res.body.customer.toString()).toBe(customer._id.toString());
      expect(res.body.restaurant.toString()).toBe(restaurant._id.toString());
      expect(res.body.total_price).toBe(28); // 14.00 * 2
    });

    it('should allow a guest to place an order', async () => {
      const sideItem = menu.sections.find(s => s.name === 'Sides').items[0]; // Garlic Bread
      const guestOrder = {
        restaurant_id: restaurant._id,
        items: [{
          _id: sideItem._id,
          name: sideItem.name,
          price: sideItem.price,
          quantity: 1,
        }],
        total_price: sideItem.price,
        guest_info: {
          name: "John Doe",
          email: "john@example.com",
          phone: "555-123-4567"
        }
      };

      const res = await request(app)
        .post('/orders/new')
        .send(guestOrder);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.customer).toBeNull();
      expect(res.body.guest_info.name).toBe("John Doe");
    });
  });

  describe('GET /orders/history', () => {
    it("should retrieve the order history for the logged-in customer", async () => {
      // First create an order for this customer
      const pizzaItem = menu.sections.find(s => s.name === 'Pizzas').items[0];
      await Order.create({
        customer: customer._id,
        restaurant: restaurant._id,
        items: [{
          _id: pizzaItem._id,
          name: pizzaItem.name,
          price: pizzaItem.price,
          quantity: 1,
        }],
        total_price: pizzaItem.price,
        status: 'confirmed'
      });

      const res = await request(app)
        .get('/orders/history')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      // Check that all returned orders belong to the correct customer
      res.body.forEach(order => {
        expect(order.customer.toString()).toBe(customer._id.toString());
      });
    });
  });
}); 