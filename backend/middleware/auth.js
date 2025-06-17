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
  requireOwner,
  requireRestaurantOwner
}; 