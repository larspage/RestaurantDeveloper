const mongoose = require('mongoose');
const Theme = require('../models/Theme');
const { connect } = require('./mongo');

// Log all themes in the array
const logThemes = (themes) => {
  console.log(`${themes.length} themes seeded successfully:`);
  themes.forEach((theme, index) => {
    console.log(` ${index + 1}. ${theme.displayName} (${theme.name})`);
  });
};

// Default themes to seed
const defaultThemes = [
  {
    name: 'modern-dark',
    displayName: 'Modern Dark',
    description: 'A sleek, dark theme with modern aesthetics',
    colors: {
      primary: '#3498db',
      secondary: '#2ecc71',
      accent: '#e74c3c',
      background: '#121212',
      text: '#ffffff'
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif'
    },
    spacing: {
      unit: 8,
      scale: 1.5
    },
    borderRadius: 4,
    shadows: ['0 2px 4px rgba(0,0,0,0.2)', '0 4px 8px rgba(0,0,0,0.3)'],
    tags: ['dark', 'modern', 'sleek'],
    customizable: true,
    version: '1.0.0'
  },
  {
    name: 'light-minimal',
    displayName: 'Light Minimal',
    description: 'A clean, minimalist light theme',
    colors: {
      primary: '#2980b9',
      secondary: '#27ae60',
      accent: '#e67e22',
      background: '#f5f5f5',
      text: '#333333'
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Lato, sans-serif'
    },
    spacing: {
      unit: 8,
      scale: 1.2
    },
    borderRadius: 2,
    shadows: ['0 1px 3px rgba(0,0,0,0.1)', '0 2px 6px rgba(0,0,0,0.1)'],
    tags: ['light', 'minimal', 'clean'],
    customizable: true,
    version: '1.0.0'
  },
  {
    name: 'vibrant-colorful',
    displayName: 'Vibrant Colorful',
    description: 'A bold, colorful theme with vibrant accents',
    colors: {
      primary: '#9b59b6',
      secondary: '#f1c40f',
      accent: '#1abc9c',
      background: '#ffffff',
      text: '#2c3e50'
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Nunito, sans-serif'
    },
    spacing: {
      unit: 10,
      scale: 1.6
    },
    borderRadius: 8,
    shadows: ['0 3px 6px rgba(0,0,0,0.15)', '0 5px 15px rgba(0,0,0,0.2)'],
    tags: ['colorful', 'vibrant', 'bold'],
    customizable: true,
    version: '1.0.0'
  },
  {
    name: 'rustic-warm',
    displayName: 'Rustic Warm',
    description: 'A warm, earthy theme with rustic elements',
    colors: {
      primary: '#d35400',
      secondary: '#8e44ad',
      accent: '#16a085',
      background: '#f9f3e3',
      text: '#4a4a4a'
    },
    fonts: {
      heading: 'Merriweather, serif',
      body: 'Source Sans Pro, sans-serif'
    },
    spacing: {
      unit: 8,
      scale: 1.4
    },
    borderRadius: 0,
    shadows: ['0 2px 4px rgba(0,0,0,0.1)', '0 4px 8px rgba(0,0,0,0.1)'],
    tags: ['warm', 'rustic', 'earthy'],
    customizable: true,
    version: '1.0.0'
  },
  {
    name: 'elegant-serif',
    displayName: 'Elegant Serif',
    description: 'A sophisticated theme with elegant typography',
    colors: {
      primary: '#34495e',
      secondary: '#7f8c8d',
      accent: '#c0392b',
      background: '#ffffff',
      text: '#2c3e50'
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Libre Baskerville, serif'
    },
    spacing: {
      unit: 12,
      scale: 1.5
    },
    borderRadius: 2,
    shadows: ['0 1px 2px rgba(0,0,0,0.05)', '0 2px 4px rgba(0,0,0,0.1)'],
    tags: ['elegant', 'serif', 'sophisticated'],
    customizable: true,
    version: '1.0.0'
  }
];

// Print the number of themes in the array
console.log(`Prepared ${defaultThemes.length} themes for seeding:`);
defaultThemes.forEach((theme, index) => {
  console.log(` ${index + 1}. ${theme.displayName}`);
});

// Seed function
async function seedThemes() {
  try {
    // Connect to MongoDB
    await connect();
    console.log('Connected to MongoDB');
    
    // Check for FORCE_SEED environment variable
    const forceSeed = process.env.FORCE_SEED === 'true';
    console.log(`FORCE_SEED=${forceSeed ? 'true' : 'false'}`);
    
    // Check if themes already exist
    const existingThemes = await Theme.find({});
    if (existingThemes.length > 0) {
      console.log(`${existingThemes.length} themes already exist in the database.`);
      
      if (forceSeed) {
        console.log('FORCE_SEED=true detected, proceeding with theme deletion and re-seeding...');
        await Theme.deleteMany({});
        console.log('Cleared existing themes');
      } else {
        console.log('Skipping theme seeding to prevent duplicates.');
        console.log('To force re-seeding, run with FORCE_SEED=true');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        return;
      }
    }
    
    // Insert default themes
    const result = await Theme.insertMany(defaultThemes);
    logThemes(result);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding themes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedThemes();
}

// Export the seed function for programmatic use
module.exports = seedThemes; 