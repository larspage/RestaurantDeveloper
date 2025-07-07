// Debug script to check backend configuration
const axios = require('axios');
const mongoose = require('mongoose');

const BACKEND_URL = 'http://localhost:3550';

async function checkBackendHealth() {
  console.log('🔍 Debugging Backend Configuration...\n');
  
  // 1. Check if backend server is responding
  try {
    console.log('1️⃣ Testing backend health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend health check:', response.data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return;
  }
  
  // 2. Check MongoDB connection
  try {
    console.log('\n2️⃣ Testing MongoDB connection...');
    const mongoURI = 'mongodb://localhost:27017/restaurant_developer';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('💡 MongoDB might not be running. Try starting it with: mongod');
  }
  
  // 3. Test a simple GET endpoint
  try {
    console.log('\n3️⃣ Testing restaurants endpoint...');
    const response = await axios.get(`${BACKEND_URL}/restaurants`, { timeout: 5000 });
    console.log('✅ Restaurants endpoint working, found', response.data.length, 'restaurants');
  } catch (error) {
    console.log('❌ Restaurants endpoint failed:', error.response?.data || error.message);
  }
  
  // 4. Test auth endpoint with minimal data
  try {
    console.log('\n4️⃣ Testing auth registration with minimal data...');
    const testData = {
      email: 'debug@test.com',
      password: 'test123',
      name: 'Debug User',
      role: 'restaurant_owner'
    };
    
    const response = await axios.post(`${BACKEND_URL}/auth/register`, testData, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Network Error:', error.message);
    }
    
    // If it's a 500 error, let's try to get more details
    if (error.response?.status === 500) {
      console.log('\n🔍 500 Error Details:');
      console.log('This usually means:');
      console.log('- MongoDB is not running');
      console.log('- Database connection failed');
      console.log('- Missing environment variables');
      console.log('- Code error in the auth route');
    }
  }
  
  // 5. Environment check
  console.log('\n5️⃣ Environment Information:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('MONGODB_URI:', process.env.MONGODB_URI || 'undefined (using default)');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'undefined (using development mode)');
  
  console.log('\n📋 Summary:');
  console.log('- If MongoDB connection failed: Start MongoDB service');
  console.log('- If 500 errors persist: Check backend console logs');
  console.log('- Development mode should work without Supabase configuration');
}

checkBackendHealth().catch(console.error); 