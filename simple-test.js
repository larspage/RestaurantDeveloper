// Simple test script to verify logging and identify issues
const axios = require('axios');

async function simpleTest() {
  console.log('🔍 Simple Server Test...\n');
  
  try {
    // Test 1: Backend health check
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await axios.get('http://localhost:3550/health', { timeout: 5000 });
    console.log('✅ Backend health:', healthResponse.data);
    
    // Test 2: Frontend health check  
    console.log('\n2️⃣ Testing frontend...');
    const frontendResponse = await axios.get('http://localhost:3560', { timeout: 5000 });
    console.log('✅ Frontend responding:', frontendResponse.status);
    
    // Test 3: Test login with existing user
    console.log('\n3️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:3550/auth/login', {
      email: 'test@restaurant.com',
      password: 'password123'
    }, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('🔑 Token received:', !!loginResponse.data.token);
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    console.log('\n📋 Check the logs for detailed information:');
    console.log('- Error logs: backend/logs/errors/error-2025-07-07.log');
    console.log('- Auth logs: backend/logs/auth/auth-2025-07-07.log');
    console.log('- API logs: backend/logs/api/api-2025-07-07.log');
  }
}

simpleTest(); 