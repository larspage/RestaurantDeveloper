const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all printers for a restaurant
router.get('/restaurants/:id/printers', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const printers = restaurant.printer_settings?.printers || [];
    res.json(printers);
  } catch (error) {
    logger.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// Add/Update printer configuration
router.post('/restaurants/:id/printers', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { name, type, connection_type, ip_address, port, usb_device, auto_print_orders, enabled } = req.body;

    // Validate required fields
    if (!name || !type || !connection_type) {
      return res.status(400).json({ error: 'Name, type, and connection type are required' });
    }

    // Validate connection details
    if (connection_type === 'network' && (!ip_address || !port)) {
      return res.status(400).json({ error: 'IP address and port are required for network printers' });
    }

    if (connection_type === 'usb' && !usb_device) {
      return res.status(400).json({ error: 'USB device path is required for USB printers' });
    }

    // Initialize printer settings if not exists
    if (!restaurant.printer_settings) {
      restaurant.printer_settings = { printers: [] };
    }

    const newPrinter = {
      id: Date.now().toString(), // Simple ID generation
      name,
      type, // 'kitchen', 'receipt', 'label'
      connection_type, // 'network', 'usb', 'bluetooth'
      ip_address: connection_type === 'network' ? ip_address : null,
      port: connection_type === 'network' ? port : null,
      usb_device: connection_type === 'usb' ? usb_device : null,
      auto_print_orders: auto_print_orders || false,
      enabled: enabled !== undefined ? enabled : true,
      status: 'offline', // 'online', 'offline', 'error'
      last_checked: new Date(),
      created_at: new Date()
    };

    restaurant.printer_settings.printers.push(newPrinter);
    await restaurant.save();

    logger.info('Printer added:', { restaurantId: req.params.id, printerId: newPrinter.id });
    res.json(newPrinter);
  } catch (error) {
    logger.error('Error adding printer:', error);
    res.status(500).json({ error: 'Failed to add printer' });
  }
});

// Update printer configuration
router.put('/restaurants/:id/printers/:printerId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const printerIndex = restaurant.printer_settings?.printers?.findIndex(
      p => p.id === req.params.printerId
    );

    if (printerIndex === -1) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    const { name, type, connection_type, ip_address, port, usb_device, auto_print_orders, enabled } = req.body;

    // Update printer settings
    const printer = restaurant.printer_settings.printers[printerIndex];
    if (name) printer.name = name;
    if (type) printer.type = type;
    if (connection_type) printer.connection_type = connection_type;
    if (ip_address) printer.ip_address = ip_address;
    if (port) printer.port = port;
    if (usb_device) printer.usb_device = usb_device;
    if (auto_print_orders !== undefined) printer.auto_print_orders = auto_print_orders;
    if (enabled !== undefined) printer.enabled = enabled;
    printer.updated_at = new Date();

    await restaurant.save();

    logger.info('Printer updated:', { restaurantId: req.params.id, printerId: req.params.printerId });
    res.json(printer);
  } catch (error) {
    logger.error('Error updating printer:', error);
    res.status(500).json({ error: 'Failed to update printer' });
  }
});

// Delete printer
router.delete('/restaurants/:id/printers/:printerId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const printerIndex = restaurant.printer_settings?.printers?.findIndex(
      p => p.id === req.params.printerId
    );

    if (printerIndex === -1) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    restaurant.printer_settings.printers.splice(printerIndex, 1);
    await restaurant.save();

    logger.info('Printer deleted:', { restaurantId: req.params.id, printerId: req.params.printerId });
    res.json({ message: 'Printer deleted successfully' });
  } catch (error) {
    logger.error('Error deleting printer:', error);
    res.status(500).json({ error: 'Failed to delete printer' });
  }
});

// Test printer connection
router.post('/restaurants/:id/printers/:printerId/test', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const printer = restaurant.printer_settings?.printers?.find(
      p => p.id === req.params.printerId
    );

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    // Simulate printer test (in real implementation, this would test actual connection)
    const testResult = {
      success: Math.random() > 0.2, // 80% success rate for demo
      message: Math.random() > 0.2 ? 'Test print successful' : 'Connection failed',
      timestamp: new Date()
    };

    // Update printer status
    const printerIndex = restaurant.printer_settings.printers.findIndex(
      p => p.id === req.params.printerId
    );
    restaurant.printer_settings.printers[printerIndex].status = testResult.success ? 'online' : 'error';
    restaurant.printer_settings.printers[printerIndex].last_checked = new Date();
    await restaurant.save();

    logger.info('Printer test:', { restaurantId: req.params.id, printerId: req.params.printerId, result: testResult });
    res.json(testResult);
  } catch (error) {
    logger.error('Error testing printer:', error);
    res.status(500).json({ error: 'Failed to test printer' });
  }
});

// Print order
router.post('/orders/:id/print', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurant');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns the restaurant
    if (order.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { printer_id, print_type } = req.body;

    if (!printer_id || !print_type) {
      return res.status(400).json({ error: 'Printer ID and print type are required' });
    }

    const restaurant = await Restaurant.findById(order.restaurant._id);
    const printer = restaurant.printer_settings?.printers?.find(p => p.id === printer_id);

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    if (!printer.enabled) {
      return res.status(400).json({ error: 'Printer is disabled' });
    }

    // Create print job
    const printJob = {
      id: Date.now().toString(),
      order_id: order._id,
      printer_id,
      print_type, // 'kitchen', 'receipt', 'label'
      status: 'queued', // 'queued', 'printing', 'completed', 'failed'
      created_at: new Date(),
      attempts: 0,
      max_attempts: 3
    };

    // Initialize print queue if not exists
    if (!restaurant.print_queue) {
      restaurant.print_queue = [];
    }

    restaurant.print_queue.push(printJob);
    await restaurant.save();

    // Simulate print processing (in real implementation, this would send to actual printer)
    setTimeout(async () => {
      try {
        const updatedRestaurant = await Restaurant.findById(order.restaurant._id);
        const jobIndex = updatedRestaurant.print_queue.findIndex(job => job.id === printJob.id);
        
        if (jobIndex !== -1) {
          const success = Math.random() > 0.1; // 90% success rate for demo
          updatedRestaurant.print_queue[jobIndex].status = success ? 'completed' : 'failed';
          updatedRestaurant.print_queue[jobIndex].completed_at = new Date();
          updatedRestaurant.print_queue[jobIndex].attempts = 1;
          
          if (!success) {
            updatedRestaurant.print_queue[jobIndex].error = 'Printer communication error';
          }
          
          await updatedRestaurant.save();
        }
      } catch (error) {
        logger.error('Error processing print job:', error);
      }
    }, 2000);

    logger.info('Print job queued:', { orderId: order._id, printerId: printer_id, printType: print_type });
    res.json(printJob);
  } catch (error) {
    logger.error('Error creating print job:', error);
    res.status(500).json({ error: 'Failed to create print job' });
  }
});

// Get print queue for restaurant
router.get('/print-queue/:restaurant_id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurant_id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const printQueue = restaurant.print_queue || [];
    
    // Sort by created_at descending (newest first)
    printQueue.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(printQueue);
  } catch (error) {
    logger.error('Error fetching print queue:', error);
    res.status(500).json({ error: 'Failed to fetch print queue' });
  }
});

// Retry failed print job
router.post('/print-queue/:restaurant_id/:job_id/retry', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurant_id,
      owner: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const jobIndex = restaurant.print_queue?.findIndex(job => job.id === req.params.job_id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    const job = restaurant.print_queue[jobIndex];

    if (job.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed jobs can be retried' });
    }

    if (job.attempts >= job.max_attempts) {
      return res.status(400).json({ error: 'Maximum retry attempts reached' });
    }

    // Reset job status
    job.status = 'queued';
    job.attempts += 1;
    job.retry_at = new Date();
    delete job.error;

    await restaurant.save();

    logger.info('Print job retried:', { restaurantId: req.params.restaurant_id, jobId: req.params.job_id });
    res.json(job);
  } catch (error) {
    logger.error('Error retrying print job:', error);
    res.status(500).json({ error: 'Failed to retry print job' });
  }
});

module.exports = router; 