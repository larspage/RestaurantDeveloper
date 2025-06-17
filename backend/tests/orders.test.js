const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Theme = require('../models/Theme');
const { createTestUser, getAuthToken } = require('./testUtils');

describe('Order API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let testTheme;
  let testRestaurant;
  let testMenu;
  let testOrder;
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
      name: 'Test Restaurant for Orders',
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

    testOrder = await Order.create({
      restaurant_id: testRestaurant.owner_id,
      customer_id: customer.supabase_id,
      items: [{
        name: 'Test Item',
        price: 9.99,
        quantity: 2
      }],
      total_price: 19.98,
      status: 'received'
    });
  });

  afterEach(async () => {
    // Clean up orders after each test
    await Order.deleteMany({});
  });

  afterAll(async () => {
    // Clean up restaurants and close connection
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});
    await Theme.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /orders/new', () => {
    it('should create a new order for authenticated user', async () => {
      const newOrder = {
        restaurant_id: testRestaurant._id,
        items: [{
          name: 'New Item',
          price: 12.99,
          quantity: 1,
          modifications: ['No onions']
        }]
      };

      const res = await request(app)
        .post('/orders/new')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newOrder)
        .expect(201);

      expect(res.body.items[0].name).toBe('New Item');
      expect(res.body.total_price).toBe(12.99);
      expect(res.body.status).toBe('received');
    });

    it('should create a new order for guest user', async () => {
      const newOrder = {
        restaurant_id: testRestaurant._id,
        items: [{
          name: 'Guest Item',
          price: 15.99,
          quantity: 1
        }],
        guest_info: {
          name: 'Guest User',
          email: 'guest@test.com',
          phone: '123-456-7890'
        }
      };

      const res = await request(app)
        .post('/orders/new')
        .send(newOrder)
        .expect(201);

      expect(res.body.items[0].name).toBe('Guest Item');
      expect(res.body.guest_info.name).toBe('Guest User');
    });
  });

  describe('GET /orders/history', () => {
    it('should return order history for authenticated user', async () => {
      const res = await request(app)
        .get('/orders/history')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should not allow access without authentication', async () => {
      await request(app)
        .get('/orders/history')
        .expect(401);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order details for authenticated customer', async () => {
      const order = await Order.create({
        restaurant_id: testRestaurant._id,
        customer_id: 'test-customer-id',
        items: [{ name: 'Test Item', price: 9.99, quantity: 1 }],
        total_price: 9.99,
        status: 'received'
      });

      const res = await request(app)
        .get(`/orders/${order._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body._id).toBe(order._id.toString());
    });

    it('should return order details for guest with correct info', async () => {
      const order = await Order.create({
        restaurant_id: testRestaurant._id,
        items: [{ name: 'Guest Item', price: 9.99, quantity: 1 }],
        total_price: 9.99,
        status: 'received',
        guest_info: {
          email: 'guest@test.com',
          phone: '123-456-7890'
        }
      });

      const res = await request(app)
        .get(`/orders/${order._id}`)
        .query({ email: 'guest@test.com', phone: '123-456-7890' })
        .expect(200);

      expect(res.body._id).toBe(order._id.toString());
    });
  });

  describe('POST /orders/reorder/:id', () => {
    it('should create new order based on previous order', async () => {
      const res = await request(app)
        .post(`/orders/reorder/${testOrder._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(201);

      expect(res.body.items).toHaveLength(testOrder.items.length);
      expect(res.body.total_price).toBe(testOrder.total_price);
      expect(res.body.status).toBe('received');
    });
  });

  describe('GET /orders/restaurant/:restaurant_id/active', () => {
    it('should return active orders for restaurant owner', async () => {
      const res = await request(app)
        .get(`/orders/restaurant/${testRestaurant._id}/active`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should not allow non-owners to view active orders', async () => {
      await request(app)
        .get(`/orders/restaurant/${testRestaurant._id}/active`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status when owner is authenticated', async () => {
      const update = {
        status: 'confirmed',
        estimated_ready_time: new Date(Date.now() + 30 * 60000) // 30 minutes from now
      };

      const res = await request(app)
        .patch(`/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(update)
        .expect(200);

      expect(res.body.status).toBe('confirmed');
      expect(new Date(res.body.estimated_ready_time)).toBeDefined();
    });

    it('should not allow customers to update order status', async () => {
      const update = {
        status: 'confirmed'
      };

      await request(app)
        .patch(`/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(update)
        .expect(403);
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('should allow customer to cancel their order', async () => {
      const order = await Order.create({
        restaurant_id: testRestaurant._id,
        customer_id: 'test-customer-id',
        items: [{ name: 'Test Item', price: 9.99, quantity: 1 }],
        total_price: 9.99,
        status: 'received'
      });

      const res = await request(app)
        .post(`/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.status).toBe('cancelled');
    });

    it('should allow guest to cancel their order with correct info', async () => {
      const order = await Order.create({
        restaurant_id: testRestaurant._id,
        items: [{ name: 'Guest Item', price: 9.99, quantity: 1 }],
        total_price: 9.99,
        status: 'received',
        guest_info: {
          email: 'guest@test.com',
          phone: '123-456-7890'
        }
      });

      const res = await request(app)
        .post(`/orders/${order._id}/cancel`)
        .send({
          email: 'guest@test.com',
          phone: '123-456-7890'
        })
        .expect(200);

      expect(res.body.status).toBe('cancelled');
    });

    it('should not allow cancellation of orders in progress', async () => {
      const order = await Order.create({
        restaurant_id: testRestaurant._id,
        customer_id: 'test-customer-id',
        items: [{ name: 'Test Item', price: 9.99, quantity: 1 }],
        total_price: 9.99,
        status: 'in_kitchen'
      });

      await request(app)
        .post(`/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });
}); 