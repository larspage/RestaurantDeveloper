const express = require('express');
const router = express.Router();
const { createUser, verifyToken, signInWithPassword } = require('../db/supabase');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Import logging utilities
const { auth: authLogger, business: businessLogger } = require('../utils/logger');
const PerformanceLogger = require('../utils/performanceLogger');
const ErrorLogger = require('../utils/errorLogger');

// POST /auth/register - User registration
router.post('/register', async (req, res) => {
  const timer = PerformanceLogger.startTimer('user_registration');
  
  try {
    const { email, password, role = 'customer', name, restaurant_id = null } = req.body;

    authLogger.info('Registration attempt started', { 
      email, 
      role, 
      name,
      requestId: req.id,
      ip: req.ip 
    });

    // Validate required fields
    if (!email || !password || !name) {
      timer.end({ success: false, error: 'validation_failed' });
      authLogger.warn('Registration validation failed: Missing required fields', {
        email: !!email,
        password: !!password,
        name: !!name,
        requestId: req.id
      });
      
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

    authLogger.info('All validations passed, creating Supabase user', { 
      email, 
      requestId: req.id 
    });

    // Create user in Supabase
    const supabaseUser = await createUser(email, password);
    authLogger.info('Supabase user created successfully', { 
      supabase_id: supabaseUser.id, 
      email,
      requestId: req.id 
    });

    // Create user profile in MongoDB
    const userData = {
      supabase_id: supabaseUser.id,
      name,
      role,
      restaurant_id: role === 'restaurant_owner' ? restaurant_id : null
    };
    
    authLogger.debug('Creating MongoDB user profile', { 
      userData, 
      requestId: req.id 
    });
    
    const mongoUser = new User(userData);

    authLogger.debug('Saving MongoDB user profile', { requestId: req.id });
    await mongoUser.save();
    authLogger.info('MongoDB user profile created successfully', { 
      mongo_id: mongoUser._id,
      supabase_id: supabaseUser.id,
      requestId: req.id 
    });

    // Return success response
    timer.end({ success: true });
    
    const responseData = {
      message: 'User registered successfully',
      user: {
        user_id: supabaseUser.id,
        email,
        name,
        role
      }
    };
    
    authLogger.info('User registration completed successfully', {
      user_id: supabaseUser.id,
      email,
      role,
      requestId: req.id
    });
    
    businessLogger.info('New user registered', {
      user_id: supabaseUser.id,
      email,
      role,
      requestId: req.id
    });
    
    res.status(201).json(responseData);

  } catch (error) {
    timer.end({ success: false, error: error.message });
    
    ErrorLogger.logAuthError(error, {
      operation: 'registration',
      email: req.body?.email || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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
  const timer = PerformanceLogger.startTimer('user_login');
  
  try {
    const { email, password } = req.body;

    authLogger.info('Login attempt started', { 
      email, 
      requestId: req.id,
      ip: req.ip 
    });

    if (!email || !password) {
      timer.end({ success: false, error: 'validation_failed' });
      authLogger.warn('Login validation failed: Missing credentials', {
        email: !!email,
        password: !!password,
        requestId: req.id
      });
      
      return res.status(400).json({ 
        error: 'Email and password are required',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    authLogger.debug('Attempting Supabase authentication', { 
      email, 
      requestId: req.id 
    });

    // Authenticate with Supabase
    const { user: supabaseUser, token } = await signInWithPassword(email, password);
    authLogger.info('Supabase authentication successful', { 
      user_id: supabaseUser.id,
      email,
      requestId: req.id 
    });

    // Get user profile from MongoDB
    authLogger.debug('Fetching user profile from MongoDB', { 
      user_id: supabaseUser.id,
      requestId: req.id 
    });
    
    const mongoUser = await User.findOne({ supabase_id: supabaseUser.id });
    
    if (!mongoUser) {
      timer.end({ success: false, error: 'user_profile_not_found' });
      authLogger.warn('MongoDB user profile not found', { 
        user_id: supabaseUser.id,
        email,
        requestId: req.id 
      });
      return res.status(404).json({ error: 'User profile not found - please complete registration' });
    }

    timer.end({ success: true });
    
    const responseData = {
      message: 'Login successful',
      token,
      user: {
        user_id: supabaseUser.id,
        email: supabaseUser.email,
        name: mongoUser.name,
        role: mongoUser.role
      }
    };
    
    authLogger.info('Login completed successfully', { 
      user_id: supabaseUser.id,
      email: mongoUser.email,
      role: mongoUser.role,
      requestId: req.id 
    });
    
    businessLogger.info('User logged in', {
      user_id: supabaseUser.id,
      email: mongoUser.email,
      role: mongoUser.role,
      requestId: req.id
    });

    // Return success response
    res.json(responseData);

  } catch (error) {
    timer.end({ success: false, error: error.message });
    
    ErrorLogger.logAuthError(error, {
      operation: 'login',
      email: req.body?.email || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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