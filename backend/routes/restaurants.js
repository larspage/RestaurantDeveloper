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
    // Check if user is authorized to create a restaurant
    if (req.user.role !== 'restaurant_owner') {
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