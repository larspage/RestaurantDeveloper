const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const { authenticateToken } = require('../middleware/auth');

// Configure S3 client (MinIO in development, DigitalOcean Spaces in production)
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin'
  }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

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

// Upload image for menu item (owner only)
router.post('/:restaurant_id/sections/:section_id/items/:item_id/image', 
  authenticateToken, 
  upload.single('image'), 
  async (req, res) => {
    try {
      // Check if restaurant exists and user is owner
      const restaurant = await Restaurant.findById(req.params.restaurant_id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      if (restaurant.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Only the restaurant owner can upload item images' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }

      const section = menu.sections.find(s => s._id.toString() === req.params.section_id);
      if (!section) {
        return res.status(404).json({ message: 'Section not found' });
      }

      const item = section.items.find(i => i._id.toString() === req.params.item_id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${req.params.restaurant_id}/${req.params.section_id}/${req.params.item_id}${fileExtension}`;
      
      // Upload to S3 (MinIO in dev, DigitalOcean Spaces in prod)
      const bucketName = process.env.S3_BUCKET || 'restaurant-menu-images';
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      });

      await s3Client.send(command);

      // Generate the URL for the uploaded image
      const imageUrl = `${process.env.S3_PUBLIC_URL || 'http://localhost:9000'}/${bucketName}/${fileName}`;

      // Update the item with the image URL
      item.imageUrl = imageUrl;
      await menu.save();

      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
  }
);

module.exports = router; 