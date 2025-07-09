const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth');

// Place a new order (public endpoint - supports both guest and authenticated users)
router.post('/new', optionalAuthenticateToken, async (req, res) => {
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
      restaurant: restaurant_id,
      items,
      total_price,
      notes,
      status: 'received'
    };

    // Add customer info based on authentication status
    if (req.user) {
      orderData.customer = req.user.id;
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
    const orders = await Order.find({ customer: req.user.id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order history', error: error.message });
  }
});

// Get single order by ID (authenticated users or matching guest info)
router.get('/:id', optionalAuthenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user) {
      // Authenticated user must be the customer or restaurant owner
      const restaurant = await Restaurant.findById(order.restaurant);
      if (order.customer && order.customer.toString() !== req.user.id && restaurant.owner.toString() !== req.user.id) {
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
    if (previousOrder.customer && previousOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reorder this order' });
    }

    // Create new order with same items
    const newOrder = new Order({
      restaurant: previousOrder.restaurant,
      customer: req.user.id,
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
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    // Get active orders (all except delivered and cancelled)
    const orders = await Order.find({
      restaurant: req.params.restaurant_id,
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
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
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
router.post('/:id/cancel', optionalAuthenticateToken, async (req, res) => {
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
      if (order.customer && order.customer.toString() !== req.user.id) {
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

// Get order statistics for a restaurant (authenticated owner only)
router.get('/restaurant/:restaurant_id/stats', authenticateToken, async (req, res) => {
  try {
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these statistics' });
    }

    // Get all orders for the restaurant
    const orders = await Order.find({ restaurant: req.params.restaurant_id });

    // Calculate basic statistics
    const total = orders.length;
    const by_status = {
      received: 0,
      confirmed: 0,
      in_kitchen: 0,
      ready_for_pickup: 0,
      delivered: 0,
      cancelled: 0
    };

    // Count orders by status
    orders.forEach(order => {
      if (by_status.hasOwnProperty(order.status)) {
        by_status[order.status]++;
      }
    });

    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const today_total = todayOrders.length;
    const today_revenue = todayOrders.reduce((sum, order) => sum + order.total_price, 0);

    res.json({
      total,
      by_status,
      today_total,
      today_revenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order statistics', error: error.message });
  }
});

// Get analytics data for a restaurant (authenticated owner only)
router.get('/restaurant/:restaurant_id/analytics', authenticateToken, async (req, res) => {
  try {
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these analytics' });
    }

    // Get query parameters for date range
    const { startDate, endDate, period = 'daily' } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Build query
    const query = { restaurant: req.params.restaurant_id };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    // Get orders within date range
    const orders = await Order.find(query).sort({ createdAt: 1 });

    // Calculate revenue trends
    const revenueTrends = calculateRevenueTrends(orders, period);
    
    // Calculate popular items
    const popularItems = calculatePopularItems(orders);
    
    // Calculate customer analytics
    const customerAnalytics = calculateCustomerAnalytics(orders);
    
    // Calculate peak hours
    const peakHours = calculatePeakHours(orders);

    res.json({
      revenue_trends: revenueTrends,
      popular_items: popularItems,
      customer_analytics: customerAnalytics,
      peak_hours: peakHours,
      summary: {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + order.total_price, 0),
        average_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length : 0,
        completed_orders: orders.filter(order => order.status === 'delivered').length,
        cancelled_orders: orders.filter(order => order.status === 'cancelled').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics data', error: error.message });
  }
});

// Helper functions for analytics calculations
function calculateRevenueTrends(orders, period) {
  const trends = {};
  
  orders.forEach(order => {
    const date = new Date(order.createdAt);
    let key;
    
    switch (period) {
      case 'hourly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'daily':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    if (!trends[key]) {
      trends[key] = { revenue: 0, orders: 0 };
    }
    
    trends[key].revenue += order.total_price;
    trends[key].orders += 1;
  });
  
  return Object.entries(trends)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculatePopularItems(orders) {
  const itemStats = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemStats[item.name]) {
        itemStats[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      
      itemStats[item.name].quantity += item.quantity;
      itemStats[item.name].revenue += item.price * item.quantity;
      itemStats[item.name].orders += 1;
    });
  });
  
  return Object.values(itemStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10); // Top 10 items
}

function calculateCustomerAnalytics(orders) {
  const customerStats = {};
  let guestOrders = 0;
  
  orders.forEach(order => {
    if (order.customer) {
      if (!customerStats[order.customer]) {
        customerStats[order.customer] = {
          orders: 0,
          revenue: 0,
          first_order: order.createdAt,
          last_order: order.createdAt
        };
      }
      
      customerStats[order.customer].orders += 1;
      customerStats[order.customer].revenue += order.total_price;
      
      if (new Date(order.createdAt) < new Date(customerStats[order.customer].first_order)) {
        customerStats[order.customer].first_order = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(customerStats[order.customer].last_order)) {
        customerStats[order.customer].last_order = order.createdAt;
      }
    } else {
      guestOrders += 1;
    }
  });
  
  const registeredCustomers = Object.keys(customerStats).length;
  const returningCustomers = Object.values(customerStats).filter(customer => customer.orders > 1).length;
  
  return {
    total_customers: registeredCustomers,
    returning_customers: returningCustomers,
    guest_orders: guestOrders,
    customer_retention_rate: registeredCustomers > 0 ? (returningCustomers / registeredCustomers) * 100 : 0,
    average_orders_per_customer: registeredCustomers > 0 ? orders.filter(o => o.customer).length / registeredCustomers : 0,
    average_customer_value: registeredCustomers > 0 ? Object.values(customerStats).reduce((sum, customer) => sum + customer.revenue, 0) / registeredCustomers : 0
  };
}

function calculatePeakHours(orders) {
  const hourlyStats = {};
  
  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats[hour] = { orders: 0, revenue: 0 };
  }
  
  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    hourlyStats[hour].orders += 1;
    hourlyStats[hour].revenue += order.total_price;
  });
  
  return Object.entries(hourlyStats)
    .map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
    .sort((a, b) => b.orders - a.orders);
}

module.exports = router; 