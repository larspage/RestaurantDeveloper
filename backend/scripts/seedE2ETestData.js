const mongoose = require('mongoose');
// Make sure we have environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const { v4: uuidv4 } = require('uuid');

const TEST_USER_NAME = 'E2E Test User';

const connect = async (mongoUri) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to test database for seeding.');
    } catch (error) {
      console.error('Error connecting to test database:', error);
      throw error;
    }
  }
};

const disconnect = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from test database.');
    }
};

const cleanup = async () => {
  try {
    // Delete all data from the collections to ensure a clean slate
    await Menu.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    console.log('Cleaned up E2E test data by deleting all documents.');
  } catch (error) {
    console.error('Error during E2E data cleanup:', error);
    throw error;
  }
};

const seed = async () => {
  try {
    await cleanup(); // Clean up before seeding

    const testUser = await User.create({
      supabase_id: uuidv4(),
      name: TEST_USER_NAME,
      role: 'restaurant_owner'
    });

    const testRestaurant = await Restaurant.create({
      name: 'E2E Test Restaurant',
      description: 'A restaurant for E2E testing.',
      owner: testUser._id
    });
    
    await Menu.create({
        restaurant: testRestaurant._id,
        sections: [
            {
                name: 'Appetizers',
                displayOrder: 1,
                items: [
                    { name: 'Test Appetizer 1', price: 5.99 },
                    { name: 'Test Appetizer 2', price: 6.99 },
                ]
            },
            {
                name: 'Main Courses',
                displayOrder: 2,
                items: [
                    { name: 'Test Main 1', price: 15.99 },
                    { name: 'Test Main 2', price: 18.99 },
                ]
            }
        ]
    });

    console.log('Seeded E2E test data.');

    return {
      userId: testUser._id.toString(),
      restaurantId: testRestaurant._id.toString(),
      supabaseId: testUser.supabase_id
    };
  } catch (error) {
    console.error('Error seeding E2E data:', error);
    throw error;
  }
};

const seedDatabase = async (mongoUri) => {
    if (!mongoUri) {
        throw new Error('MongoDB URI was not provided to the seed script.');
    }
    await connect(mongoUri);
    const result = await seed();
    await disconnect();
    return result;
}

// Allow running from command line
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI_TEST;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI_TEST is not defined in the .env file or environment variables.');
    process.exit(1);
  }
  seedDatabase(mongoUri).catch(err => {
      console.error("Seeding failed:", err);
      process.exit(1);
  });
}

module.exports = seedDatabase; 