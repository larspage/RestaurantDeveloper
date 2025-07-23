#!/usr/bin/env node
// mcp/init-mongo.js - Script to initialize MCP MongoDB

const { testMcpMongoConnection, initializeMcpMongo } = require('../backend/db/mcp-mongo');

async function initializeMcpMongoDB() {
  console.log('🚀 Initializing MCP MongoDB database...\n');
  
  try {
    const connected = await testMcpMongoConnection();
    if (!connected) {
      console.error('\n❌ Cannot connect to MCP MongoDB database.');
      console.log('📋 Make sure MongoDB is running.');
      process.exit(1);
    }
    
    await initializeMcpMongo();
    
    console.log('\n🎉 MCP MongoDB initialization complete!');
    console.log('🔧 You can now use MongoDB MCP servers with this database.');
    
  } catch (error) {
    console.error('\n❌ Error during MCP MongoDB initialization:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

if (require.main === module) {
  initializeMcpMongoDB();
}

module.exports = { initializeMcpMongoDB };