const { createClient } = require('@supabase/supabase-js');
// The dotenv config is now handled by nodemon.json

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV === 'test';
// Check if we're in development mode
const isDevelopmentMode = process.env.NODE_ENV !== 'production';

// Get Supabase configuration with fallbacks for development
const supabaseUrl = isTestMode 
  ? 'http://localhost:54321' 
  : (process.env.SUPABASE_URL || 'http://localhost:54321');

const supabaseServiceKey = isTestMode 
  ? 'test-service-key' 
  : (process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

const supabaseAnonKey = isTestMode 
  ? 'test-anon-key' 
  : (process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

// Log configuration status
console.log(`Supabase initialized in ${isTestMode ? 'TEST' : isDevelopmentMode ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

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
  
  // Handle development mode token
  if (isDevelopmentMode && token === 'dev-mock-token') {
    console.log('Using development token for authentication');
    return { 
      id: 'dev-user-123', 
      email: 'dev@example.com',
      user_metadata: {
        name: 'Development User'
      }
    };
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
  
  // Handle development user
  if (isDevelopmentMode && userId === 'dev-user-123') {
    return { 
      id: userId, 
      name: 'Development User', 
      role: 'restaurant_owner',
      restaurant_id: 'dev-restaurant-123'
    };
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
