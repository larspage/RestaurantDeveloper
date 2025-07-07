// Direct user creation script for testing
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function createUserDirect() {
  console.log('🔧 Creating user directly in MongoDB...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/restaurant_developer', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Check if user already exists
    const existingUser = await User.findOne({ supabase_id: 'dev-user-test-restaurant-com' });
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log('📋 User Details:');
      console.log(`   Supabase ID: ${existingUser.supabase_id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
    } else {
      // Create test user
      const testUser = new User({
        supabase_id: 'dev-user-test-restaurant-com',
        name: 'Test Restaurant Owner',
        role: 'restaurant_owner',
        restaurant_id: null
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully!');
      console.log('📋 User Details:');
      console.log(`   Supabase ID: ${testUser.supabase_id}`);
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   MongoDB ID: ${testUser._id}`);
    }
    
    console.log('\n🎯 Login Credentials:');
    console.log('   Email: test@restaurant.com');
    console.log('   Password: password123');
    console.log('   (These will work with development mode authentication)');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open browser to: http://localhost:3560/login');
    console.log('2. Login with: test@restaurant.com / password123');
    console.log('3. Navigate to Dashboard > Restaurants');
    console.log('4. Test the order management functionality');
    
    await mongoose.disconnect();
    console.log('\n✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUserDirect(); 