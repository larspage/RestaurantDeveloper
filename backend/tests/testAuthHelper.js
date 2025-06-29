const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables. Please check your .env file.');
}

/**
 * Generates a valid JWT for a user with the given email.
 * Assumes the user exists in the database from the seed script.
 * @param {string} email - The email of the seeded user.
 * @returns {Promise<string>} A JWT token.
 */
const getAuthTokenFor = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`Could not find user with email: ${email}. Make sure the database is seeded.`);
  }
  
  const payload = {
    sub: user.supabase_id,
    role: user.role,
    // Add any other claims your application expects
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { getAuthTokenFor }; 