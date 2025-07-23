const request = require('supertest');
const app = require('../app');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');
const { getAuthToken, clearTestDB } = require('./testUtils');

describe('Printer Routes', () => {
  let authToken;
  let userId;
  let restaurantId;
  let orderId;
  let printerId;
  let testUser;

  beforeEach(async () => {
    // Clear database before each test to avoid conflicts
    await clearTestDB();
    
    // Create test user with valid role and required fields
    testUser = await User.create({
      supabase_id: `test-printer-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Printer User',
      email: 'printer-test@example.com',
      role: 'restaurant_owner'
    });
    userId = testUser._id;
    authToken = await getAuthToken(testUser);

    // Create test restaurant
    const restaurant = await Restaurant.create({
      name: 'Test Restaurant',
      description: 'Test Description',
      location: 'Test Location',
      cuisine: ['Italian'],
      owner: userId
    });
    restaurantId = restaurant._id;

    // Create test order
    const order = await Order.create({
      restaurant: restaurantId,
      items: [
        { name: 'Pizza', price: 15.99, quantity: 1 }
      ],
      total_price: 15.99,
      status: 'received',
      guest_info: {
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com'
      }
    });
    orderId = order._id;
  });

  afterEach(async () => {
    // Clean up after each test
    await clearTestDB();
  });

  describe('GET /printers/restaurants/:id/printers', () => {
    it('should return empty array when no printers configured', async () => {
      const response = await request(app)
        .get(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/printers/restaurants/${restaurantId}/printers`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/printers/restaurants/507f1f77bcf86cd799439011/printers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /printers/restaurants/:id/printers', () => {
    it('should create a new network printer', async () => {
      const printerData = {
        name: 'Kitchen Printer 1',
        type: 'kitchen',
        connection_type: 'network',
        ip_address: '192.168.1.100',
        port: 9100,
        auto_print_orders: true,
        enabled: true
      };

      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printerData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(printerData.name);
      expect(response.body.type).toBe(printerData.type);
      expect(response.body.connection_type).toBe(printerData.connection_type);
      expect(response.body.ip_address).toBe(printerData.ip_address);
      expect(response.body.port).toBe(printerData.port);
      expect(response.body.id).toBeDefined();
      
      printerId = response.body.id;
    });

    it('should create a new USB printer', async () => {
      const printerData = {
        name: 'Receipt Printer 1',
        type: 'receipt',
        connection_type: 'usb',
        usb_device: '/dev/usb/lp0',
        auto_print_orders: false,
        enabled: true
      };

      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printerData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(printerData.name);
      expect(response.body.type).toBe(printerData.type);
      expect(response.body.connection_type).toBe(printerData.connection_type);
      expect(response.body.usb_device).toBe(printerData.usb_device);
    });

    it('should return 400 for missing required fields', async () => {
      const printerData = {
        name: 'Incomplete Printer'
        // Missing type and connection_type
      };

      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for network printer without IP', async () => {
      const printerData = {
        name: 'Network Printer',
        type: 'kitchen',
        connection_type: 'network'
        // Missing ip_address and port
      };

      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('IP address');
    });

    it('should return 400 for USB printer without device path', async () => {
      const printerData = {
        name: 'USB Printer',
        type: 'receipt',
        connection_type: 'usb'
        // Missing usb_device
      };

      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printerData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('USB device');
    });
  });

  describe('PUT /printers/restaurants/:id/printers/:printerId', () => {
    it('should update printer configuration', async () => {
      const updateData = {
        name: 'Updated Kitchen Printer',
        enabled: false
      };

      const response = await request(app)
        .put(`/printers/restaurants/${restaurantId}/printers/${printerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.enabled).toBe(updateData.enabled);
    });

    it('should return 404 for non-existent printer', async () => {
      const response = await request(app)
        .put(`/printers/restaurants/${restaurantId}/printers/507f1f77bcf86cd799439011`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /printers/restaurants/:id/printers/:printerId/test', () => {
    it('should test printer connection', async () => {
      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers/${printerId}/test`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent printer', async () => {
      const response = await request(app)
        .post(`/printers/restaurants/${restaurantId}/printers/507f1f77bcf86cd799439011/test`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /printers/orders/:id/print', () => {
    it('should create print job for order', async () => {
      const printData = {
        printer_id: printerId,
        print_type: 'kitchen_ticket'
      };

      const response = await request(app)
        .post(`/printers/orders/${orderId}/print`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing print data', async () => {
      const response = await request(app)
        .post(`/printers/orders/${orderId}/print`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 for non-existent order', async () => {
      const printData = {
        printer_id: printerId,
        print_type: 'kitchen_ticket'
      };

      const response = await request(app)
        .post('/printers/orders/507f1f77bcf86cd799439011/print')
        .set('Authorization', `Bearer ${authToken}`)
        .send(printData);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent printer', async () => {
      const printData = {
        printer_id: '507f1f77bcf86cd799439011',
        print_type: 'kitchen_ticket'
      };

      const response = await request(app)
        .post(`/printers/orders/${orderId}/print`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(printData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /printers/print-queue/:restaurant_id', () => {
    it('should return print queue for restaurant', async () => {
      const response = await request(app)
        .get(`/printers/print-queue/${restaurantId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/printers/print-queue/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /printers/restaurants/:id/printers/:printerId', () => {
    it('should delete printer', async () => {
      const response = await request(app)
        .delete(`/printers/restaurants/${restaurantId}/printers/${printerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent printer', async () => {
      const response = await request(app)
        .delete(`/printers/restaurants/${restaurantId}/printers/507f1f77bcf86cd799439011`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /printers/restaurants/:id/printers after deletion', () => {
    it('should return empty array after printer deletion', async () => {
      const response = await request(app)
        .get(`/printers/restaurants/${restaurantId}/printers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
}); 