// backend/db/mcp-mongo.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../mcp/.env.mcp') });

// MCP MongoDB configuration - completely separate from your main app
const mcpMongoURI = process.env.MCP_MONGODB_URI || 'mongodb://localhost:27017/mcp_mindmap';

// Create separate mongoose connection for MCP
const mcpConnection = mongoose.createConnection();

// Connect to MCP MongoDB
const connectMcpMongo = async () => {
  try {
    if (mcpConnection.readyState === 0) {
      await mcpConnection.openUri(mcpMongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ MCP MongoDB connected successfully');
    }
    return mcpConnection;
  } catch (error) {
    console.error('❌ MCP MongoDB connection failed:', error.message);
    throw error;
  }
};

// Test MCP MongoDB connection
const testMcpMongoConnection = async () => {
  try {
    await connectMcpMongo();
    console.log('✅ MCP MongoDB connection test passed');
    return true;
  } catch (error) {
    console.error('❌ MCP MongoDB connection test failed:', error.message);
    return false;
  }
};

// MCP MongoDB Schemas
const mcpUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const mcpBrainSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'McpUser', required: true },
  name: { type: String, required: true },
  description: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const mcpThoughtSchema = new mongoose.Schema({
  brainId: { type: mongoose.Schema.Types.ObjectId, ref: 'McpBrain', required: true },
  title: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  positionX: { type: Number, default: 0 },
  positionY: { type: Number, default: 0 },
  color: { type: String, default: '#ffffff' },
  size: { type: String, default: 'medium' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const mcpSynapseSchema = new mongoose.Schema({
  brainId: { type: mongoose.Schema.Types.ObjectId, ref: 'McpBrain', required: true },
  sourceThoughtId: { type: mongoose.Schema.Types.ObjectId, ref: 'McpThought', required: true },
  targetThoughtId: { type: mongoose.Schema.Types.ObjectId, ref: 'McpThought', required: true },
  relationshipType: { type: String, default: 'connected_to' },
  strength: { type: Number, default: 1.0, min: 0, max: 1 },
  label: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Create MCP models using the separate connection
const McpUser = mcpConnection.model('McpUser', mcpUserSchema);
const McpBrain = mcpConnection.model('McpBrain', mcpBrainSchema);
const McpThought = mcpConnection.model('McpThought', mcpThoughtSchema);
const McpSynapse = mcpConnection.model('McpSynapse', mcpSynapseSchema);

// Initialize MCP MongoDB with sample data
const initializeMcpMongo = async () => {
  try {
    await connectMcpMongo();
    
    // Check if data already exists
    const userCount = await McpUser.countDocuments();
    
    if (userCount === 0) {
      console.log('🔄 Initializing MCP MongoDB with sample data...');
      
      // Create sample user
      const sampleUser = new McpUser({
        name: 'MCP Demo User',
        email: 'mcp@example.com'
      });
      await sampleUser.save();
      
      // Create sample brain
      const sampleBrain = new McpBrain({
        userId: sampleUser._id,
        name: 'Demo Mind Map',
        description: 'A sample mind map for MCP testing'
      });
      await sampleBrain.save();
      
      // Create sample thoughts
      const thought1 = new McpThought({
        brainId: sampleBrain._id,
        title: 'Central Idea',
        content: { text: 'This is the main concept' },
        positionX: 0,
        positionY: 0
      });
      
      const thought2 = new McpThought({
        brainId: sampleBrain._id,
        title: 'Branch 1',
        content: { text: 'First related concept' },
        positionX: 100,
        positionY: 50
      });
      
      const thought3 = new McpThought({
        brainId: sampleBrain._id,
        title: 'Branch 2',
        content: { text: 'Second related concept' },
        positionX: -100,
        positionY: -50
      });
      
      await Promise.all([thought1.save(), thought2.save(), thought3.save()]);
      
      // Create synapses (connections)
      const synapse1 = new McpSynapse({
        brainId: sampleBrain._id,
        sourceThoughtId: thought1._id,
        targetThoughtId: thought2._id,
        relationshipType: 'leads_to'
      });
      
      const synapse2 = new McpSynapse({
        brainId: sampleBrain._id,
        sourceThoughtId: thought1._id,
        targetThoughtId: thought3._id,
        relationshipType: 'relates_to'
      });
      
      await Promise.all([synapse1.save(), synapse2.save()]);
      
      console.log('✅ MCP MongoDB initialized with sample data');
    } else {
      console.log('✅ MCP MongoDB already has data');
    }
    
  } catch (error) {
    console.error('❌ Error initializing MCP MongoDB:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mcpConnection.close();
    console.log('MCP MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MCP MongoDB connection:', err);
  }
});

module.exports = {
  mcpConnection,
  connectMcpMongo,
  testMcpMongoConnection,
  initializeMcpMongo,
  McpUser,
  McpBrain,
  McpThought,
  McpSynapse,
  mcpMongoURI
};