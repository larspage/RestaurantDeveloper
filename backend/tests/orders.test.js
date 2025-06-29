const request = require('supertest');
const app = require('../app');
const { getAuthTokenFor } = require('./testAuthHelper');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Menu = require('../models/Menu');
const connectDB = require('../db/mongo');
const mongoose = require('mongoose');

describe('Order API Endpoints', () => {
  let restaurant;
  let customer;
  let customerToken;
  let menu;

  beforeAll(async () => {
    await connectDB();
    // Get seeded data to use for tests
    restaurant = await Restaurant.findOne({ name: 'Pizza Palace' });
    customer = await User.findOne({ email: 'customer2@example.com' });
    customerToken = await getAuthTokenFor('customer2@example.com');
    menu = await Menu.findOne({ restaurant: restaurant._id });
  });

  afterAll(async () => {
    await mongoose.disconnect();
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
      // The seed script creates orders, so this customer should have some.
      const res = await request(app)
        .get('/orders/history')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Check that all returned orders belong to the correct customer
      res.body.forEach(order => {
        expect(order.customer._id.toString()).toBe(customer._id.toString());
      });
    });
  });
}); 