const express = require('express');
const router = express.Router();
const { createUser, verifyToken } = require('../db/supabase');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// POST /auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'customer', name, restaurant_id = null } = req.body;

    console.log('Registration attempt:', { email, role, name });

    // Validate required fields
    if (!email || !password || !name) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          name: !name ? 'Name is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role
    if (!['customer', 'restaurant_owner'].includes(role)) {
      console.log('Validation failed: Invalid role');
      return res.status(400).json({ 
        error: 'Role must be either customer or restaurant_owner'
      });
    }

    console.log('All validations passed, creating Supabase user...');

    // Create user in Supabase
    const supabaseUser = await createUser(email, password);
    console.log('Supabase user created:', supabaseUser.id);

    // Create user profile in MongoDB
    const mongoUser = new User({
      supabase_id: supabaseUser.id,
      email,
      name,
      role,
      restaurant_id: role === 'restaurant_owner' ? restaurant_id : null
    });

    await mongoUser.save();
    console.log('MongoDB user profile created:', mongoUser._id);

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: supabaseUser.id,
        email,
        name,
        role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for duplicate email error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Check for Supabase-specific errors
    if (error.message && error.message.includes('User already registered')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    if (error.message && error.message.includes('Invalid email')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (error.message && error.message.includes('Password')) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      console.log('Login validation failed: Missing credentials');
      return res.status(400).json({ 
        error: 'Email and password are required',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    console.log('Attempting Supabase authentication...');

    // Authenticate with Supabase
    const { user: supabaseUser, token } = await require('../db/supabase').signInWithPassword(email, password);
    console.log('Supabase authentication successful for user:', supabaseUser.id);

    // Get user profile from MongoDB
    const mongoUser = await User.findOne({ supabase_id: supabaseUser.id });
    
    if (!mongoUser) {
      console.log('MongoDB user profile not found for:', supabaseUser.id);
      return res.status(404).json({ error: 'User profile not found - please complete registration' });
    }

    console.log('Login successful for user:', mongoUser.email, 'role:', mongoUser.role);

    // Return success response
    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: supabaseUser.id,
        email: supabaseUser.email,
        name: mongoUser.name,
        role: mongoUser.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Check for authentication errors
    if (error.message && error.message.includes('Invalid credentials')) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (error.message && error.message.includes('Email not confirmed')) {
      return res.status(401).json({ error: 'Please confirm your email address' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get user profile from MongoDB
    const mongoUser = await User.findOne({ supabase_id: req.user.supabase_id });
    
    if (!mongoUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      user: {
        user_id: mongoUser.supabase_id,
        email: mongoUser.email,
        name: mongoUser.name,
        role: mongoUser.role,
        restaurant_id: mongoUser.restaurant_id
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Update user profile in MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { supabase_id: req.user.supabase_id },
      { name },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        user_id: updatedUser.supabase_id,
        email: req.user.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /auth/profile - Delete user account
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    // Security check: only allow users to delete their own account or admin
    if (req.user.supabase_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    // Delete user profile from MongoDB
    await User.findOneAndDelete({ supabase_id: user_id });

    // Note: We don't delete from Supabase as that requires admin privileges
    // The user can delete their Supabase account through the Supabase dashboard

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
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