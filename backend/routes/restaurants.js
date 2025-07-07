const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Theme = require('../models/Theme');
const { authenticateToken } = require('../middleware/auth');

// Get all restaurants (public endpoint)
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('owner', '-password');
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurants', error: error.message });
  }
});

// Get restaurants owned by the current user (authenticated endpoint)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching restaurants for user:', req.user.id);
    const restaurants = await Restaurant.find({ owner: req.user.id });
    console.log('Found restaurants:', restaurants.length);
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching user restaurants:', error);
    res.status(500).json({ message: 'Error fetching your restaurants', error: error.message });
  }
});

// Get single restaurant by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner', '-password');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant', error: error.message });
  }
});

// Create new restaurant (authenticated owner only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Create restaurant request from user:', {
      userId: req.user.id,
      role: req.user.role,
      email: req.user.email
    });

    // Check if user is authorized to create a restaurant
    if (req.user.role !== 'restaurant_owner') {
      console.log('Access denied - user role is:', req.user.role, 'but needs restaurant_owner');
      return res.status(403).json({ message: 'Only restaurant owners can create restaurants' });
    }

    const { name, description, location, cuisine } = req.body;

    const restaurant = new Restaurant({
      name,
      description,
      location,
      cuisine,
      owner: req.user.id,
      status: 'active'
    });

    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error creating restaurant', error: error.message });
  }
});

// Update restaurant (authenticated owner only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    // Check if restaurant exists
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is the owner
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can update this restaurant' });
    }

    const { name, description, location, cuisine, status } = req.body;

    // Update fields if provided
    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (location) restaurant.location = location;
    if (cuisine) restaurant.cuisine = cuisine;
    if (status) restaurant.status = status;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating restaurant', error: error.message });
  }
});

// Update restaurant settings (authenticated owner only)
router.patch('/:id/settings', authenticateToken, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    // Check if restaurant exists
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is the owner
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can update this restaurant' });
    }

    const { settings } = req.body;

    // Update settings if provided
    if (settings) {
      // Initialize settings object if it doesn't exist
      if (!restaurant.settings) {
        restaurant.settings = {};
      }

      // Update order management settings
      if (settings.accept_new_orders !== undefined) {
        restaurant.settings.accept_new_orders = settings.accept_new_orders;
      }
      if (settings.auto_confirm_orders !== undefined) {
        restaurant.settings.auto_confirm_orders = settings.auto_confirm_orders;
      }
      if (settings.show_unavailable_items !== undefined) {
        restaurant.settings.show_unavailable_items = settings.show_unavailable_items;
      }

      // Update contact preferences
      if (settings.contact_preferences) {
        if (!restaurant.settings.contact_preferences) {
          restaurant.settings.contact_preferences = {};
        }
        Object.assign(restaurant.settings.contact_preferences, settings.contact_preferences);
      }

      // Update operating hours
      if (settings.operating_hours) {
        if (!restaurant.settings.operating_hours) {
          restaurant.settings.operating_hours = {};
        }
        Object.assign(restaurant.settings.operating_hours, settings.operating_hours);
      }

      // Update basic restaurant info if provided
      if (settings.name) restaurant.name = settings.name;
      if (settings.description) restaurant.description = settings.description;
      if (settings.location) restaurant.location = settings.location;
      if (settings.contact_info) {
        if (!restaurant.contact_info) {
          restaurant.contact_info = {};
        }
        Object.assign(restaurant.contact_info, settings.contact_info);
      }
    }

    await restaurant.save();
    res.json({
      message: 'Restaurant settings updated successfully',
      restaurant: restaurant
    });
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    res.status(500).json({ message: 'Error updating restaurant settings', error: error.message });
  }
});

// Delete restaurant (authenticated owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    // Check if restaurant exists
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is the owner
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete this restaurant' });
    }

    await Restaurant.deleteOne({ _id: restaurant._id });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting restaurant', error: error.message });
  }
});

module.exports = router; 