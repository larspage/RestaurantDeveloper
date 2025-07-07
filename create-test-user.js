// Script to create a test user for login testing
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3550';

async function createTestUser() {
  console.log('🔧 Creating test user...\n');
  
  const userData = {
    email: 'test@restaurant.com',
    password: 'password123',
    name: 'Test Restaurant Owner',
    role: 'restaurant_owner'
  };
  
  try {
    console.log('📝 Registering user:', userData.email);
    
    const response = await axios.post(`${BACKEND_URL}/auth/register`, userData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User created successfully!');
    console.log('📋 User Details:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Role: ${userData.role}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open browser to: http://localhost:3560/login');
    console.log(`2. Login with: ${userData.email} / ${userData.password}`);
    console.log('3. Navigate to Dashboard > Restaurants');
    console.log('4. Test the order management functionality');
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed:', error.response.data);
      
      if (error.response.status === 409) {
        console.log('\n✅ User already exists! You can use these credentials:');
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Open browser to: http://localhost:3560/login');
        console.log(`2. Login with: ${userData.email} / ${userData.password}`);
        console.log('3. Navigate to Dashboard > Restaurants');
        console.log('4. Test the order management functionality');
      }
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Test login after creating user
async function testLogin() {
  console.log('\n🔐 Testing login...');
  
  const loginData = {
    email: 'test@restaurant.com',
    password: 'password123'
  };
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, loginData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login test successful!');
    console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');
    console.log('👤 User role:', response.data.user?.role);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
    return null;
  }
}

// Main execution
async function main() {
  try {
    // Check if backend is running
    console.log('🔍 Checking backend server...');
    await axios.get(`${BACKEND_URL}/restaurants`, { timeout: 5000 });
    console.log('✅ Backend server is running\n');
    
    // Create test user
    await createTestUser();
    
    // Test login
    await testLogin();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running!');
      console.log('Please start the backend server first with: node start-dev.js');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

main().catch(console.error); 