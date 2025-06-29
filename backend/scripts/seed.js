const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const { connect } = require('../db/mongo');

const usersData = [];
const restaurantsData = [];
const menusData = [];

const seedDatabase = async () => {
  try {
    // Connect to Database
    await connect();

    console.log('--- Clearing Existing Data ---');
    await Order.deleteMany({});
    await Menu.deleteMany({});
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared all previous data.');

    // --- 1. Create Users ---
    console.log('--- Creating Users ---');
    // Create 3 Restaurant Owners
    for (let i = 1; i <= 3; i++) {
      usersData.push({
        _id: new mongoose.Types.ObjectId(),
        supabase_id: `owner-supabase-id-${i}`,
        email: `owner${i}@example.com`,
        name: `Restaurant Owner ${i}`,
        role: 'restaurant_owner',
      });
    }

    // Create 10 Customers
    for (let i = 1; i <= 10; i++) {
      usersData.push({
        _id: new mongoose.Types.ObjectId(),
        supabase_id: `customer-supabase-id-${i}`,
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        role: 'customer',
      });
    }
    const createdUsers = await User.insertMany(usersData);
    console.log(`${createdUsers.length} users created.`);
    const owners = createdUsers.filter(u => u.role === 'restaurant_owner');
    const customers = createdUsers.filter(u => u.role === 'customer');

    // --- 2. Create Restaurants ---
    console.log('--- Creating Restaurants ---');
    const restaurantTemplates = [
      { name: 'The Golden Spoon', description: 'A fine dining experience with a modern twist.' },
      { name: 'Pizza Palace', description: 'The best pizza in town, made with love.' },
      { name: 'Sushi Central', description: 'Fresh and authentic sushi, delivered to your door.' },
    ];

    for (let i = 0; i < owners.length; i++) {
      restaurantsData.push({
        _id: new mongoose.Types.ObjectId(),
        name: restaurantTemplates[i].name,
        description: restaurantTemplates[i].description,
        owner: owners[i]._id,
      });
    }
    const createdRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`${createdRestaurants.length} restaurants created.`);


    // --- 3. Create Menus ---
    console.log('--- Creating Menus ---');
    const menuTemplates = {
        'The Golden Spoon': [
            { name: 'Starters', items: [{ name: 'Truffle Fries', price: 12.50 }, { name: 'Calamari', price: 15.00 }] },
            { name: 'Mains', items: [{ name: 'Filet Mignon', price: 45.00 }, { name: 'Seared Scallops', price: 38.00 }] }
        ],
        'Pizza Palace': [
            { name: 'Pizzas', items: [{ name: 'Margherita', price: 14.00 }, { name: 'Pepperoni', price: 16.00 }] },
            { name: 'Sides', items: [{ name: 'Garlic Bread', price: 6.50 }, { name: 'Garden Salad', price: 8.00 }] }
        ],
        'Sushi Central': [
            { name: 'Rolls', items: [{ name: 'California Roll', price: 8.00 }, { name: 'Spicy Tuna Roll', price: 9.50 }] },
            { name: 'Nigiri', items: [{ name: 'Salmon Nigiri', price: 6.00 }, { name: 'Tuna Nigiri', price: 7.00 }] }
        ]
    };
    
    for (const restaurant of createdRestaurants) {
        const template = menuTemplates[restaurant.name];
        if (template) {
            const sections = template.map(section => ({
                _id: new mongoose.Types.ObjectId(),
                name: section.name,
                items: section.items.map(item => ({ ...item, _id: new mongoose.Types.ObjectId() }))
            }));
            menusData.push({
                restaurant: restaurant._id,
                sections: sections
            });
        }
    }
    const createdMenus = await Menu.insertMany(menusData);
    console.log(`${createdMenus.length} menus created.`);

    // --- 4. Create Orders ---
    console.log('--- Creating Orders ---');
    const ordersData = [];
    for (let i = 0; i < 20; i++) { // Create 20 random orders
        const randomCustomer = customers[i % customers.length];
        const randomRestaurant = createdRestaurants[i % createdRestaurants.length];
        const correspondingMenu = createdMenus.find(m => m.restaurant.toString() === randomRestaurant._id.toString());
        
        if (correspondingMenu && correspondingMenu.sections.length > 0 && correspondingMenu.sections[0].items.length > 0) {
            const randomSection = correspondingMenu.sections[Math.floor(Math.random() * correspondingMenu.sections.length)];
            const randomItem = randomSection.items[Math.floor(Math.random() * randomSection.items.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;

            ordersData.push({
                customer: randomCustomer._id,
                restaurant: randomRestaurant._id,
                items: [{
                    _id: randomItem._id,
                    name: randomItem.name,
                    price: randomItem.price,
                    quantity: quantity
                }],
                total_price: randomItem.price * quantity,
                status: ['received', 'confirmed', 'delivered', 'cancelled'][Math.floor(Math.random() * 4)]
            });
        }
    }
    const createdOrders = await Order.insertMany(ordersData);
    console.log(`${createdOrders.length} orders created.`);

    console.log('--- Database Seeding Complete ---');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seedDatabase(); 