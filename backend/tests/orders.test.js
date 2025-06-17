const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const { createTestUser, getAuthToken } = require('./testUtils');

describe('Order API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let testRestaurant;
  let testMenu;
  let testOrder;
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
      name: 'Test Restaurant for Orders',
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

    // Create a test order for each test
    testOrder = await Order.create({
      restaurant: testRestaurant._id,
      customer: testCustomer._id,
      items: [{
        name: 'Test Item',
        price: 9.99,
        quantity: 2
      }],
      total_price: 19.98,
      status: 'received'
    });
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
        restaurant: testRestaurant._id,
        customer: testCustomer._id,
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
        restaurant: testRestaurant._id,
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
        restaurant: testRestaurant._id,
        customer: testCustomer._id,
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
        restaurant: testRestaurant._id,
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
        restaurant: testRestaurant._id,
        customer: testCustomer._id,
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