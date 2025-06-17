const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin, getUserProfile } = require('../db/supabase');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// POST /auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role = 'customer', name, restaurant_id = null } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    // Validate role
    if (!['customer', 'restaurant_owner'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either customer or restaurant_owner' 
      });
    }

    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          restaurant_id
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile in MongoDB
    const mongoUser = new User({
      supabase_id: authData.user.id,
      name,
      role,
      restaurant_id: role === 'restaurant_owner' ? restaurant_id : null
    });

    await mongoUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user_id: authData.user.id,
      email: authData.user.email,
      name,
      role
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    // Get user profile from MongoDB
    const mongoUser = await User.findOne({ supabase_id: authData.user.id });

    if (!mongoUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: {
        user_id: authData.user.id,
        email: authData.user.email,
        name: mongoUser.name,
        role: mongoUser.role,
        restaurant_id: mongoUser.restaurant_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/profile/:user_id - Get user profile
router.get('/profile/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user is accessing their own profile or is admin
    if (req.user.supabase_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user from MongoDB
    const mongoUser = await User.findOne({ supabase_id: user_id });

    if (!mongoUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: mongoUser.supabase_id,
      name: mongoUser.name,
      role: mongoUser.role,
      restaurant_id: mongoUser.restaurant_id,
      preferences: mongoUser.preferences,
      created_at: mongoUser.createdAt,
      updated_at: mongoUser.updatedAt
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Supabase handles token invalidation on client side
    // Server doesn't need to do anything special for logout
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 