// backend/db/mcp-supabase.js
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../mcp/.env.mcp') });

// Get Supabase connection details from your existing config or MCP env
const supabaseUrl = process.env.MCP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.MCP_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseConnectionString = process.env.MCP_SUPABASE_CONNECTION_STRING || process.env.MCP_POSTGRES_URL;

// Create Supabase client for MCP operations
const mcpSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create direct PostgreSQL connection to Supabase for MCP server
// Parse the connection string to get individual components
const parseConnectionString = (connectionString) => {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.substring(1), // Remove leading slash
    user: url.username,
    password: url.password,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  };
};

const mcpConfig = parseConnectionString(supabaseConnectionString);
const mcpPool = new Pool(mcpConfig);

// Test MCP Supabase connection
const testMcpConnection = async () => {
  try {
    const client = await mcpPool.connect();
    console.log('✅ MCP Supabase PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ MCP Supabase connection failed:', error.message);
    return false;
  }
};

// Initialize MCP schema in your existing Supabase database
const initializeMcpSupabase = async () => {
  try {
    const client = await mcpPool.connect();
    
    // Check if MCP tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'mcp_thoughts'
    `);
    
    if (result.rows.length === 0) {
      console.log('🔄 Initializing MCP schema in Supabase...');
      
      // Create MCP mind mapping tables in your existing Supabase database
      await client.query(`
        -- UUID extension should already be enabled in Supabase
        
        -- MCP Users (you can link these to your existing auth.users if needed)
        CREATE TABLE IF NOT EXISTS mcp_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- MCP Brains (mind map collections)
        CREATE TABLE IF NOT EXISTS mcp_brains (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES mcp_users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          metadata JSONB DEFAULT '{}',
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- MCP Thoughts (nodes in the mind map)
        CREATE TABLE IF NOT EXISTS mcp_thoughts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brain_id UUID REFERENCES mcp_brains(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content JSONB DEFAULT '{}',
          position_x REAL DEFAULT 0,
          position_y REAL DEFAULT 0,
          color VARCHAR(7) DEFAULT '#ffffff',
          size VARCHAR(20) DEFAULT 'medium',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- MCP Synapses (connections between thoughts)
        CREATE TABLE IF NOT EXISTS mcp_synapses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brain_id UUID REFERENCES mcp_brains(id) ON DELETE CASCADE,
          source_thought_id UUID REFERENCES mcp_thoughts(id) ON DELETE CASCADE,
          target_thought_id UUID REFERENCES mcp_thoughts(id) ON DELETE CASCADE,
          relationship_type VARCHAR(100) DEFAULT 'connected_to',
          strength REAL DEFAULT 1.0,
          label VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT no_self_loop CHECK (source_thought_id != target_thought_id),
          CONSTRAINT unique_synapse UNIQUE (source_thought_id, target_thought_id, relationship_type)
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_mcp_users_supabase_id ON mcp_users(supabase_user_id);
        CREATE INDEX IF NOT EXISTS idx_mcp_brains_user_id ON mcp_brains(user_id);
        CREATE INDEX IF NOT EXISTS idx_mcp_thoughts_brain_id ON mcp_thoughts(brain_id);
        CREATE INDEX IF NOT EXISTS idx_mcp_synapses_brain_id ON mcp_synapses(brain_id);
        CREATE INDEX IF NOT EXISTS idx_mcp_synapses_source ON mcp_synapses(source_thought_id);
        CREATE INDEX IF NOT EXISTS idx_mcp_synapses_target ON mcp_synapses(target_thought_id);
        
        -- Create update timestamp triggers
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $ language 'plpgsql';

        CREATE TRIGGER update_mcp_brains_updated_at BEFORE UPDATE ON mcp_brains 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_mcp_thoughts_updated_at BEFORE UPDATE ON mcp_thoughts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Row Level Security (RLS) policies for Supabase
        ALTER TABLE mcp_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE mcp_brains ENABLE ROW LEVEL SECURITY;
        ALTER TABLE mcp_thoughts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE mcp_synapses ENABLE ROW LEVEL SECURITY;
        
        -- Basic RLS policies (you can customize these)
        CREATE POLICY "Users can view their own MCP data" ON mcp_users
          FOR ALL USING (auth.uid() = supabase_user_id);
          
        CREATE POLICY "Users can manage their own brains" ON mcp_brains
          FOR ALL USING (user_id IN (SELECT id FROM mcp_users WHERE supabase_user_id = auth.uid()));
          
        CREATE POLICY "Users can manage thoughts in their brains" ON mcp_thoughts
          FOR ALL USING (brain_id IN (
            SELECT b.id FROM mcp_brains b 
            JOIN mcp_users u ON b.user_id = u.id 
            WHERE u.supabase_user_id = auth.uid()
          ));
          
        CREATE POLICY "Users can manage synapses in their brains" ON mcp_synapses
          FOR ALL USING (brain_id IN (
            SELECT b.id FROM mcp_brains b 
            JOIN mcp_users u ON b.user_id = u.id 
            WHERE u.supabase_user_id = auth.uid()
          ));
        
        -- Insert sample data
        INSERT INTO mcp_users (name, email) VALUES ('MCP Demo User', 'mcp@example.com') ON CONFLICT DO NOTHING;
      `);
      
      console.log('✅ MCP schema initialized in Supabase');
    } else {
      console.log('✅ MCP schema already exists in Supabase');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error initializing MCP Supabase schema:', error);
    throw error;
  }
};

// Helper functions using Supabase client
const getMcpBrains = async (userId) => {
  const { data, error } = await mcpSupabase
    .from('mcp_brains')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
};

const createMcpThought = async (brainId, thoughtData) => {
  const { data, error } = await mcpSupabase
    .from('mcp_thoughts')
    .insert({
      brain_id: brainId,
      ...thoughtData
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mcpPool.end();
    console.log('MCP Supabase connection closed');
  } catch (err) {
    console.error('Error closing MCP Supabase connection:', err);
  }
});

module.exports = {
  mcpSupabase,
  mcpPool,
  mcpConfig,
  testMcpConnection,
  initializeMcpSupabase,
  getMcpBrains,
  createMcpThought,
  connectionString: supabaseConnectionString
};