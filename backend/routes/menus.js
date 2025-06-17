const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const { authenticateToken } = require('../middleware/auth');

// Get menu for a restaurant (public endpoint)
router.get('/:restaurant_id', async (req, res) => {
  try {
    const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu', error: error.message });
  }
});

// Create or update entire menu (owner only)
router.post('/:restaurant_id', authenticateToken, async (req, res) => {
  try {
    // Check if restaurant exists and user is owner
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the restaurant owner can modify the menu' });
    }

    const { sections } = req.body;
    
    // Validate sections array
    if (!Array.isArray(sections)) {
      return res.status(400).json({ message: 'Sections must be an array' });
    }

    // Create or update menu
    const menu = await Menu.findOneAndUpdate(
      { restaurant: req.params.restaurant_id },
      { sections },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu', error: error.message });
  }
});

// Add or update a section (owner only)
router.post('/:restaurant_id/sections', authenticateToken, async (req, res) => {
  try {
    // Check if restaurant exists and user is owner
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the restaurant owner can modify menu sections' });
    }

    const { section } = req.body;
    if (!section || !section.name) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    // Find existing menu or create new one
    let menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      menu = new Menu({ restaurant: req.params.restaurant_id, sections: [] });
    }

    // If section has _id, update existing section, otherwise add new section
    if (section._id) {
      const sectionIndex = menu.sections.findIndex(s => s._id.toString() === section._id);
      if (sectionIndex === -1) {
        return res.status(404).json({ message: 'Section not found' });
      }
      menu.sections[sectionIndex] = { ...menu.sections[sectionIndex].toObject(), ...section };
    } else {
      menu.sections.push(section);
    }

    await menu.save();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error managing menu section', error: error.message });
  }
});

// Delete a section (owner only)
router.delete('/:restaurant_id/sections/:section_id', authenticateToken, async (req, res) => {
  try {
    // Check if restaurant exists and user is owner
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the restaurant owner can delete menu sections' });
    }

    const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    // Remove section
    menu.sections = menu.sections.filter(section => 
      section._id.toString() !== req.params.section_id
    );

    await menu.save();
    res.json({ message: 'Section deleted successfully', menu });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu section', error: error.message });
  }
});

// Add or update menu item in a section (owner only)
router.post('/:restaurant_id/sections/:section_id/items', authenticateToken, async (req, res) => {
  try {
    // Check if restaurant exists and user is owner
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the restaurant owner can modify menu items' });
    }

    const { item } = req.body;
    if (!item || !item.name || !item.price) {
      return res.status(400).json({ message: 'Item name and price are required' });
    }

    const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const section = menu.sections.find(s => s._id.toString() === req.params.section_id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // If item has _id, update existing item, otherwise add new item
    if (item._id) {
      const itemIndex = section.items.findIndex(i => i._id.toString() === item._id);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found' });
      }
      section.items[itemIndex] = { ...section.items[itemIndex].toObject(), ...item };
    } else {
      section.items.push(item);
    }

    await menu.save();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error managing menu item', error: error.message });
  }
});

// Delete menu item from section (owner only)
router.delete('/:restaurant_id/sections/:section_id/items/:item_id', authenticateToken, async (req, res) => {
  try {
    // Check if restaurant exists and user is owner
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the restaurant owner can delete menu items' });
    }

    const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    const section = menu.sections.find(s => s._id.toString() === req.params.section_id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Remove item
    section.items = section.items.filter(item => 
      item._id.toString() !== req.params.item_id
    );

    await menu.save();
    res.json({ message: 'Item deleted successfully', menu });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

module.exports = router; 