#!/usr/bin/env node
// mcp/init-supabase.js - Script to initialize MCP Supabase schema

const { testMcpConnection, initializeMcpSupabase } = require('../backend/db/mcp-supabase');

async function initializeMcpSupabaseDatabase() {
  console.log('🚀 Initializing MCP schema in your existing Supabase database...\n');
  
  try {
    // Test connection
    const connected = await testMcpConnection();
    if (!connected) {
      console.error('\n❌ Cannot connect to Supabase database.');
      console.log('📋 Make sure your Supabase connection string is correct in mcp/.env.mcp');
      console.log('📋 Check your Supabase project settings for the connection string.');
      process.exit(1);
    }
    
    // Initialize schema
    await initializeMcpSupabase();
    
    console.log('\n🎉 MCP schema initialization in Supabase complete!');
    console.log('🔧 You can now use MCP servers with your existing Supabase database.');
    console.log('💡 The mind mapping tables are now in your Supabase project alongside your existing data.');
    
  } catch (error) {
    console.error('\n❌ Error during MCP Supabase initialization:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('   - Check your connection string in mcp/.env.mcp');
    console.log('   - Ensure your Supabase service role key has the right permissions');
    console.log('   - Verify your Supabase project is accessible');
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  initializeMcpSupabaseDatabase();
}

module.exports = { initializeMcpSupabaseDatabase };