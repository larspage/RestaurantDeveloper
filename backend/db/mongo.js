// backend/db/mongo.js

const mongoose = require('mongoose');

// Replace 'yourDatabaseName' with the actual name you want to use
const mongoURI = 'mongodb://localhost:27017/RDMongoDB';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = db;