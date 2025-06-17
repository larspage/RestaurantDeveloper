// backend/db/mongo.js

const mongoose = require('mongoose');

// Get MongoDB URI based on environment
const mongoURI = process.env.NODE_ENV === 'test'
  ? 'mongodb://localhost:27017/restaurant_developer_test'
  : process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_developer';

// Create connection
const connect = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Export both the connection and connect function
module.exports = {
  connection: mongoose.connection,
  connect
};