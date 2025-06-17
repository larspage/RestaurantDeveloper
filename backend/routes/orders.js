const express = require('express');
const router = express.Router();
const { Order } = require('../models/Order');
const { Restaurant } = require('../models/Restaurant');
const { authenticateToken } = require('../middleware/auth');

// Place a new order (public endpoint - supports both guest and authenticated users)
router.post('/new', async (req, res) => {
  try {
    const { restaurant_id, items, guest_info, notes } = req.body;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Calculate total price
    const total_price = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order object
    const orderData = {
      restaurant_id,
      items,
      total_price,
      notes,
      status: 'received'
    };

    // Add customer info based on authentication status
    if (req.user) {
      orderData.customer_id = req.user.id;
    } else if (guest_info) {
      orderData.guest_info = guest_info;
    } else {
      return res.status(400).json({ message: 'Guest information is required for non-authenticated users' });
    }

    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get order history for a customer (authenticated users only)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.user.id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order history', error: error.message });
  }
});

// Get single order by ID (authenticated users or matching guest info)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user) {
      // Authenticated user must be the customer or restaurant owner
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (order.customer_id !== req.user.id && restaurant.owner_id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
    } else {
      // Guest must provide matching contact info
      const { email, phone } = req.query;
      if (!email || !phone || !order.guest_info ||
          order.guest_info.email !== email ||
          order.guest_info.phone !== phone) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Reorder previous order (authenticated users only)
router.post('/reorder/:id', authenticateToken, async (req, res) => {
  try {
    const previousOrder = await Order.findById(req.params.id);
    if (!previousOrder) {
      return res.status(404).json({ message: 'Previous order not found' });
    }

    // Verify ownership of previous order
    if (previousOrder.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reorder this order' });
    }

    // Create new order with same items
    const newOrder = new Order({
      restaurant_id: previousOrder.restaurant_id,
      customer_id: req.user.id,
      items: previousOrder.items,
      total_price: previousOrder.total_price,
      status: 'received'
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error creating reorder', error: error.message });
  }
});

// Get active orders for a restaurant (authenticated owner only)
router.get('/restaurant/:restaurant_id/active', authenticateToken, async (req, res) => {
  try {
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    // Get active orders (all except delivered and cancelled)
    const orders = await Order.find({
      restaurant_id: req.params.restaurant_id,
      status: { $nin: ['delivered', 'cancelled'] }
    }).sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active orders', error: error.message });
  }
});

// Update order status (authenticated owner only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, estimated_ready_time } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(order.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Validate status transition
    const validStatuses = ['received', 'confirmed', 'in_kitchen', 'ready_for_pickup', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update order
    order.status = status;
    if (estimated_ready_time) {
      order.estimated_ready_time = estimated_ready_time;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Cancel order (authenticated user or matching guest info)
router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation of orders that aren't in_kitchen or later
    if (!['received', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Verify authorization
    if (req.user) {
      // Authenticated user must be the customer
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }
    } else {
      // Guest must provide matching contact info
      const { email, phone } = req.body;
      if (!email || !phone || !order.guest_info ||
          order.guest_info.email !== email ||
          order.guest_info.phone !== phone) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }
    }

    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
});

module.exports = router; 