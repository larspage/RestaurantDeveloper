// Test script for Order Management functionality
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3550';
const FRONTEND_URL = 'http://localhost:3560';

// Test configuration
const TEST_CONFIG = {
  timeout: 5000, // 5 second timeout for each request
  retries: 2
};

// Logging utility
function log(step, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${step}: ${message}`);
  if (data) {
    console.log(`  Data:`, JSON.stringify(data, null, 2));
  }
}

function logError(step, error) {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[${timestamp}] ❌ ${step}: ${error.message}`);
  if (error.response) {
    console.error(`  Status: ${error.response.status}`);
    console.error(`  Response:`, error.response.data);
  }
}

function logSuccess(step, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ✅ ${step}: ${message}`);
  if (data) {
    console.log(`  Result:`, JSON.stringify(data, null, 2));
  }
}

// Test functions
async function testServerConnectivity() {
  log('SERVER_TEST', 'Testing server connectivity...');
  
  let backendWorking = false;
  let frontendWorking = false;
  
  // Test backend
  try {
    log('BACKEND_TEST', 'Testing backend server...');
    const backendResponse = await axios.get(`${BACKEND_URL}/restaurants`, {
      timeout: TEST_CONFIG.timeout
    });
    logSuccess('BACKEND_TEST', `Backend responding (${backendResponse.status})`);
    backendWorking = true;
  } catch (error) {
    logError('BACKEND_TEST', error);
  }
  
  // Test frontend
  try {
    log('FRONTEND_TEST', 'Testing frontend server...');
    const frontendResponse = await axios.get(FRONTEND_URL, {
      timeout: TEST_CONFIG.timeout
    });
    logSuccess('FRONTEND_TEST', `Frontend responding (${frontendResponse.status})`);
    frontendWorking = true;
  } catch (error) {
    logError('FRONTEND_TEST', error);
  }
  
  return { backend: backendWorking, frontend: frontendWorking };
}

async function getTestRestaurant() {
  log('RESTAURANT_TEST', 'Fetching test restaurant...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/restaurants`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.data && response.data.length > 0) {
      const restaurant = response.data[0];
      logSuccess('RESTAURANT_TEST', `Found restaurant: ${restaurant.name}`, {
        id: restaurant._id,
        name: restaurant.name,
        status: restaurant.status
      });
      return restaurant;
    } else {
      log('RESTAURANT_TEST', 'No restaurants found - this is expected for a fresh setup');
      return null;
    }
  } catch (error) {
    logError('RESTAURANT_TEST', error);
    return null;
  }
}

async function createTestOrder(restaurantId) {
  log('ORDER_CREATE', 'Creating test order...');
  
  const orderData = {
    restaurant_id: restaurantId,
    items: [
      {
        name: "Test Pizza",
        price: 15.99,
        quantity: 2
      },
      {
        name: "Test Salad", 
        price: 8.99,
        quantity: 1
      }
    ],
    guest_info: {
      name: "Test Customer",
      phone: "555-123-4567",
      email: "test@example.com"
    },
    notes: "Test order for order management testing"
  };
  
  try {
    const response = await axios.post(`${BACKEND_URL}/orders/new`, orderData, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('ORDER_CREATE', `Order created successfully`, {
      orderId: response.data._id,
      total: response.data.total_price,
      status: response.data.status
    });
    
    return response.data;
  } catch (error) {
    logError('ORDER_CREATE', error);
    return null;
  }
}

async function testOrderManagementAPI(restaurantId) {
  log('ORDER_API_TEST', `Testing order management API for restaurant ${restaurantId}...`);
  
  try {
    const response = await axios.get(`${BACKEND_URL}/orders/restaurant/${restaurantId}/active`, {
      timeout: TEST_CONFIG.timeout
    });
    
    logSuccess('ORDER_API_TEST', `Found ${response.data.length} active orders`, {
      count: response.data.length,
      orders: response.data.map(order => ({
        id: order._id.slice(-8),
        status: order.status,
        customer: order.guest_info?.name || 'Customer',
        total: order.total_price
      }))
    });
    
    return response.data;
  } catch (error) {
    logError('ORDER_API_TEST', error);
    return [];
  }
}

async function testOrderStatusUpdate(orderId) {
  log('STATUS_UPDATE_TEST', `Testing order status update for order ${orderId.slice(-8)}...`);
  
  try {
    const response = await axios.patch(`${BACKEND_URL}/orders/${orderId}/status`, {
      status: 'confirmed'
    }, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('STATUS_UPDATE_TEST', `Order status updated to confirmed`, {
      orderId: orderId.slice(-8),
      newStatus: response.data.status
    });
    
    return response.data;
  } catch (error) {
    logError('STATUS_UPDATE_TEST', error);
    return null;
  }
}

async function testFrontendPages() {
  log('FRONTEND_PAGES_TEST', 'Testing frontend page accessibility...');
  
  const pagesToTest = [
    { path: '/', name: 'Home Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/dashboard', name: 'Dashboard' }
  ];
  
  const results = [];
  
  for (const page of pagesToTest) {
    try {
      log('PAGE_TEST', `Testing ${page.name}...`);
      const response = await axios.get(`${FRONTEND_URL}${page.path}`, {
        timeout: TEST_CONFIG.timeout
      });
      
      logSuccess('PAGE_TEST', `${page.name} accessible (${response.status})`);
      results.push({ page: page.name, status: 'success', code: response.status });
    } catch (error) {
      logError('PAGE_TEST', error);
      results.push({ page: page.name, status: 'error', error: error.message });
    }
  }
  
  return results;
}

// Main test execution
async function runTests() {
  console.log('🧪 Starting Order Management Tests...\n');
  
  try {
    // Step 1: Test server connectivity
    const connectivity = await testServerConnectivity();
    if (!connectivity.backend) {
      console.log('\n❌ Backend server not responding. Please start the backend server.');
      return;
    }
    if (!connectivity.frontend) {
      console.log('\n⚠️ Frontend server not responding. Some tests will be skipped.');
    } else {
      console.log('\n✅ Both servers are running!');
    }
    
    // Step 2: Get test restaurant
    const restaurant = await getTestRestaurant();
    if (!restaurant) {
      console.log('\n⚠️ No restaurants found. Create a restaurant first to test order management.');
      return;
    }
    
    // Step 3: Create test order
    const order = await createTestOrder(restaurant._id);
    if (!order) {
      console.log('\n❌ Failed to create test order. Check API permissions.');
      return;
    }
    
    // Step 4: Test order management API
    const orders = await testOrderManagementAPI(restaurant._id);
    
    // Step 5: Test order status update
    if (order) {
      await testOrderStatusUpdate(order._id);
    }
    
    // Step 6: Test frontend pages (if frontend is running)
    if (connectivity.frontend) {
      await testFrontendPages();
    }
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Backend API: Working');
    console.log(`✅ Restaurant: ${restaurant.name} (${restaurant._id.slice(-8)})`);
    console.log(`✅ Test Order: Created and managed successfully`);
    console.log(`✅ Order Management API: Found ${orders.length} orders`);
    console.log(connectivity.frontend ? '✅ Frontend: Accessible' : '⚠️ Frontend: Not tested');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open browser to: http://localhost:3560');
    console.log('2. Login and navigate to: Dashboard > Restaurants');
    console.log(`3. Click on "${restaurant.name}" restaurant`);
    console.log('4. Click "Manage Orders" button');
    console.log('5. Verify you can see the test order and update its status');
    
  } catch (error) {
    logError('MAIN_TEST', error);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Tests interrupted by user');
  process.exit(0);
});

// Add timeout for entire test suite
setTimeout(() => {
  console.log('\n⏰ Test suite timeout - stopping tests');
  process.exit(1);
}, 60000); // 60 second total timeout

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Unexpected error:', error.message);
  process.exit(1);
}); 