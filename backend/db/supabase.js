const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV === 'test';

// Get Supabase configuration with fallbacks for development
const supabaseUrl = isTestMode 
  ? 'http://localhost:54321' 
  : (process.env.SUPABASE_URL || 'https://mock.supabase.co');

const supabaseServiceKey = isTestMode 
  ? 'test-service-key' 
  : (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key');

const supabaseAnonKey = isTestMode 
  ? 'test-anon-key' 
  : (process.env.SUPABASE_ANON_KEY || 'mock-anon-key');

// Log configuration status
console.log(`Supabase initialized in ${isTestMode ? 'TEST' : 'DEVELOPMENT'} mode`);

// Create Supabase client for server-side operations (admin access)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for client-side operations (anonymous access)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify JWT token
const verifyToken = async (token) => {
  if (isTestMode) {
    // In test mode, we'll use the mock token verification from tests
    return { id: token.replace('mock.jwt.token.', ''), email: 'test@example.com' };
  }
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Get user profile from Supabase
const getUserProfile = async (userId) => {
  if (isTestMode) {
    // Return mock profile in test mode
    return { id: userId, name: 'Test User', role: 'customer' };
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('Error fetching user profile');
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  verifyToken,
  getUserProfile
};
