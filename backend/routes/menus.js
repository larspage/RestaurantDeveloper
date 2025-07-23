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

// Check if MinIO is available (for development)
const checkMinioAvailability = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Checking MinIO availability...');
      // Attempt a simple operation to check if MinIO is accessible
      const bucketName = process.env.S3_BUCKET || 'restaurant-menu-images';
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'health-check.txt',
        Body: Buffer.from('Health check'),
      }));
      console.log('✅ MinIO is available and working correctly');
      return true;
    } catch (error) {
      console.error('❌ MinIO is not available:', error.message);
      console.error('⚠️ Image uploads will fail. Make sure MinIO is running:');
      console.error('   1. Check if Docker is running');
      console.error('   2. Run: docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"');
      return false;
    }
  }
  return true;
};

// Run the check when the server starts
checkMinioAvailability();

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
    
    if (mimetype) {
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
    console.log('=== ADD/UPDATE MENU ITEM DEBUG ===');
    console.log('Method: POST /menus/:restaurant_id/sections/:section_id/items');
    console.log('Parameters:', {
      restaurant_id: req.params.restaurant_id,
      section_id: req.params.section_id
    });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.id || 'No user');
    
    // Special handling for development mode
    const isDevelopmentMode = process.env.NODE_ENV !== 'production';
    const isDevRestaurant = req.params.restaurant_id.startsWith('dev-');
    
    if (isDevelopmentMode && isDevRestaurant) {
      console.log('Using development mode for menu item update');
      
      // For development, just return a success response with mock data
      const item = req.body.item || req.body;
      
      console.log('Development mode item data:', JSON.stringify(item, null, 2));
      
      // If it's a new item, generate a mock ID
      if (!item._id) {
        item._id = `dev-item-${Date.now()}`;
        console.log('Generated new item ID:', item._id);
      } else {
        console.log('Updating existing item with ID:', item._id);
      }
      
      // Return a mock response with the updated item
      return res.status(200).json({
        success: true,
        item: {
          ...item,
          _id: item._id
        }
      });
    }
    
    // Regular production flow
    console.log('Using production flow for menu item update');
    
    // Check if restaurant exists and user is owner
    console.log('Looking for restaurant with ID:', req.params.restaurant_id);
    const restaurant = await Restaurant.findById(req.params.restaurant_id);
    if (!restaurant) {
      console.log('Restaurant not found');
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    console.log('Restaurant found:', restaurant.name);
    
    if (restaurant.owner.toString() !== req.user.id) {
      console.log('Owner mismatch. Restaurant owner:', restaurant.owner.toString(), 'User ID:', req.user.id);
      return res.status(403).json({ message: 'Only the restaurant owner can modify menu items' });
    }
    console.log('Owner verification passed');

    const { item } = req.body;
    console.log('Extracted item from request body:', JSON.stringify(item, null, 2));
    
    if (!item || !item.name || item.price === null || item.price === undefined) {
      console.log('Validation failed. Item:', !!item, 'Name:', !!item?.name, 'Price:', item?.price);
      return res.status(400).json({ message: 'Item name and price are required' });
    }
    console.log('Item validation passed');

    console.log('Looking for menu for restaurant:', req.params.restaurant_id);
    const menu = await Menu.findOne({ restaurant: req.params.restaurant_id });
    if (!menu) {
      console.log('Menu not found');
      return res.status(404).json({ message: 'Menu not found' });
    }
    console.log('Menu found with', menu.sections.length, 'sections');

    console.log('Looking for section with ID:', req.params.section_id);
    const section = menu.sections.find(s => s._id.toString() === req.params.section_id);
    if (!section) {
      console.log('Section not found. Available sections:', menu.sections.map(s => ({ id: s._id.toString(), name: s.name })));
      return res.status(404).json({ message: 'Section not found' });
    }
    console.log('Section found:', section.name, 'with', section.items.length, 'items');

    // If item has _id, update existing item, otherwise add new item
    if (item._id) {
      console.log('Updating existing item with ID:', item._id);
      console.log('ID type:', typeof item._id);
      console.log('Available item IDs in section:', section.items.map(i => ({ id: i._id.toString(), type: typeof i._id })));
      
      const itemIndex = section.items.findIndex(i => i._id.toString() === item._id.toString());
      if (itemIndex === -1) {
        console.log('Item not found in section. Looking for ID:', item._id.toString());
        console.log('Comparison details:');
        section.items.forEach((sectionItem, idx) => {
          console.log(`  Item ${idx}: ${sectionItem._id.toString()} === ${item._id.toString()} ? ${sectionItem._id.toString() === item._id.toString()}`);
        });
        return res.status(404).json({ message: 'Item not found' });
      }
      console.log('Found item at index:', itemIndex);
      section.items[itemIndex] = { ...section.items[itemIndex].toObject(), ...item };
      console.log('Item updated');
    } else {
      console.log('Adding new item to section');
      section.items.push(item);
      console.log('New item added');
    }

    await menu.save();
    console.log('Menu saved successfully');
    res.json(menu);
  } catch (error) {
    console.error('=== ERROR IN ADD/UPDATE MENU ITEM ===');
    console.error('Method: POST /menus/:restaurant_id/sections/:section_id/items');
    console.error('Parameters:', {
      restaurant_id: req.params.restaurant_id,
      section_id: req.params.section_id
    });
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Full error object:', error);
    console.error('=== END ERROR DEBUG ===');
    
    res.status(500).json({ 
      message: 'Error managing menu item', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete menu item from section (owner only)
router.delete('/:restaurant_id/sections/:section_id/items/:item_id', authenticateToken, async (req, res) => {
  try {
    // Special handling for development mode
    const isDevelopmentMode = process.env.NODE_ENV !== 'production';
    const isDevRestaurant = req.params.restaurant_id.startsWith('dev-');
    
    if (isDevelopmentMode && isDevRestaurant) {
      console.log('Using development mode for menu item deletion');
      
      // For development, just return a success response
      return res.json({ 
        message: 'Item deleted successfully', 
        menu: {
          _id: 'dev-menu-123',
          restaurant: req.params.restaurant_id,
          sections: [
            {
              _id: req.params.section_id,
              name: 'Development Section',
              items: [] // Empty items array to simulate deletion
            }
          ]
        }
      });
    }
    
    // Regular production flow
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
      // Special handling for development mode
      const isDevelopmentMode = process.env.NODE_ENV !== 'production';
      const isDevRestaurant = req.params.restaurant_id.startsWith('dev-');
      
      if (isDevelopmentMode && isDevRestaurant) {
        console.log('Using development mode for image upload');
        
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: 'No image file provided' });
        }
        
        // Generate unique filename for development mode with timestamp to prevent caching
        const fileExtension = path.extname(req.file.originalname);
        const timestamp = Date.now();
        const fileName = `dev/${req.params.restaurant_id}/${req.params.section_id}/${req.params.item_id}_${timestamp}${fileExtension}`;
        
        // Upload to MinIO in development mode
        const bucketName = process.env.S3_BUCKET || 'restaurant-menu-images';
        
        try {
          console.log('Attempting to upload to MinIO:', {
            bucket: bucketName,
            fileName,
            contentType: req.file.mimetype,
            endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000'
          });
          
          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            CacheControl: 'no-cache, no-store, must-revalidate'
          });

          await s3Client.send(command);
          console.log('Successfully uploaded to MinIO');
        } catch (uploadError) {
          console.error('MinIO upload error:', uploadError);
          console.error('To fix this issue:');
          console.error('1. Make sure Docker is running');
          console.error('2. Run: docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"');
          console.error('3. Create a bucket named "restaurant-menu-images" in the MinIO console at http://localhost:9001');
          
          return res.status(500).json({ 
            message: 'Error uploading image: MinIO storage is not available', 
            error: uploadError.message,
            details: 'MinIO storage is not running or not properly configured. See server logs for details.'
          });
        }

        // Generate the URL for the uploaded image
        // In development mode, use a direct URL that will work with Next.js Image component
        const imageUrl = `http://localhost:9000/${bucketName}/${fileName}`;
        
        // Log detailed information for debugging
        console.log('===== IMAGE UPLOAD DEBUG INFO =====');
        console.log('File name:', fileName);
        console.log('Bucket name:', bucketName);
        console.log('Image URL:', imageUrl);
        console.log('Direct browser access URL:', `http://localhost:9000/${bucketName}/${fileName}`);
        console.log('MinIO console URL:', 'http://localhost:9001');
        console.log('MinIO credentials: minioadmin / minioadmin');
        console.log('To verify file exists, check:', `http://localhost:9001/browser/${bucketName}`);
        console.log('================================');
        
        // Return the image URL with debug info
        return res.json({ 
          imageUrl,
          debug: {
            fileName,
            bucketName,
            fullPath: `${bucketName}/${fileName}`,
            directUrl: `http://localhost:9000/${bucketName}/${fileName}`
          }
        });
      }
      
      // Regular production flow
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

      // Generate unique filename with timestamp to prevent caching
      const fileExtension = path.extname(req.file.originalname);
      const timestamp = Date.now();
      const fileName = `${req.params.restaurant_id}/${req.params.section_id}/${req.params.item_id}_${timestamp}${fileExtension}`;
      
      // Upload to S3 (MinIO in dev, DigitalOcean Spaces in prod)
      const bucketName = process.env.S3_BUCKET || 'restaurant-menu-images';
      
      try {
        console.log('Attempting to upload to storage:', {
          bucket: bucketName,
          fileName,
          contentType: req.file.mimetype,
          endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000'
        });
        
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          CacheControl: 'no-cache, no-store, must-revalidate'
        });

        await s3Client.send(command);
        console.log('Successfully uploaded to storage');
      } catch (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        if (process.env.NODE_ENV !== 'production') {
          console.error('To fix this issue:');
          console.error('1. Make sure Docker is running');
          console.error('2. Run: docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"');
          console.error('3. Create a bucket named "restaurant-menu-images" in the MinIO console at http://localhost:9001');
        }
        
        return res.status(500).json({ 
          message: 'Error uploading image: Storage service is not available', 
          error: uploadError.message,
          details: 'Storage service is not running or not properly configured. See server logs for details.'
        });
      }

      // Generate the URL for the uploaded image
      const imageUrl = `http://localhost:9000/${bucketName}/${fileName}`;
      
      // Log detailed information for debugging
      console.log('===== IMAGE UPLOAD DEBUG INFO =====');
      console.log('File name:', fileName);
      console.log('Bucket name:', bucketName);
      console.log('Image URL:', imageUrl);
      console.log('Direct browser access URL:', `http://localhost:9000/${bucketName}/${fileName}`);
      console.log('MinIO console URL:', 'http://localhost:9001');
      console.log('MinIO credentials: minioadmin / minioadmin');
      console.log('To verify file exists, check:', `http://localhost:9001/browser/${bucketName}`);
      console.log('================================');

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