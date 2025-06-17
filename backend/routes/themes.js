const express = require('express');
const router = express.Router();
const Theme = require('../models/Theme');
const { authenticateToken } = require('../middleware/auth');

// Get all themes (public endpoint)
router.get('/', async (req, res) => {
  try {
    // Support filtering by tags if provided
    const filter = {};
    if (req.query.tags) {
      filter.tags = { $in: req.query.tags.split(',') };
    }
    
    const themes = await Theme.find(filter);
    res.json(themes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching themes', error: error.message });
  }
});

// Get single theme by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    res.json(theme);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theme', error: error.message });
  }
});

module.exports = router; 