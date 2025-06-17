const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // For server-side operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For client-side operations

// Create Supabase client for server-side operations (admin access)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to verify JWT token
const verifyToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Helper function to get user profile from Supabase
const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('User not found');
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  verifyToken,
  getUserProfile
};
