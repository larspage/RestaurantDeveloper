const { verifyToken } = require('../db/supabase');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Special handling for development mode and dev restaurant
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isDevRestaurant = req.params.restaurant_id && req.params.restaurant_id.startsWith('dev-');
    
    if (isDevelopment && isDevRestaurant && token === 'dev-mock-token') {
      // For development mode with dev restaurant, use mock user
      req.user = {
        id: 'dev-user-123',
        supabase_id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'restaurant_owner',
        restaurant_id: req.params.restaurant_id
      };
      return next();
    }

    // Regular authentication flow
    // Verify token with Supabase
    const supabaseUser = await verifyToken(token);
    
    // Get user data from MongoDB (cached profile)
    const mongoUser = await User.findOne({ supabase_id: supabaseUser.id });
    
    if (!mongoUser) {
      return res.status(401).json({ error: 'User profile not found - please complete registration' });
    }

    // Attach user info to request
    req.user = {
      id: mongoUser._id.toString(),
      supabase_id: supabaseUser.id,
      email: supabaseUser.email,
      name: mongoUser.name,
      role: mongoUser.role,
      restaurant_id: mongoUser.restaurant_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(422).json({ error: 'Authentication failed - invalid token format' });
  }
};

// Optional authentication middleware - sets req.user if token is provided, but doesn't fail if no token
const optionalAuthenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided, continue without setting req.user
      return next();
    }

    // Verify token with Supabase
    const supabaseUser = await verifyToken(token);
    
    // Get user data from MongoDB (cached profile)
    const mongoUser = await User.findOne({ supabase_id: supabaseUser.id });
    
    if (!mongoUser) {
      // User not found but don't fail - continue without setting req.user
      return next();
    }

    // Attach user info to request
    req.user = {
      id: mongoUser._id.toString(),
      supabase_id: supabaseUser.id,
      email: supabaseUser.email,
      name: mongoUser.name,
      role: mongoUser.role,
      restaurant_id: mongoUser.restaurant_id
    };

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // For optional auth, continue without setting req.user on error
    next();
  }
};

// Middleware to check if user is restaurant owner
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'restaurant_owner') {
    return res.status(403).json({ error: 'Restaurant owner access required' });
  }
  next();
};

// Middleware to check if user owns the specific restaurant
const requireRestaurantOwner = (req, res, next) => {
  const restaurantId = req.params.restaurant_id || req.body.restaurant_id;
  
  if (req.user.role !== 'restaurant_owner' || req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: 'Access denied: not restaurant owner' });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireOwner,
  requireRestaurantOwner
}; 