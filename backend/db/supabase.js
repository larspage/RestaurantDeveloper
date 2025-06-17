const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Get Supabase configuration
const supabaseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:54321' : process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.NODE_ENV === 'test' ? 'test-service-key' : process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NODE_ENV === 'test' ? 'test-anon-key' : process.env.SUPABASE_ANON_KEY;

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
