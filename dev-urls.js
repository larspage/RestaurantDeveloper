const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Define port numbers
const BACKEND_PORT = 3550;
const FRONTEND_PORT = 3560;

console.log(`${colors.bright}${colors.cyan}=== Restaurant Developer - Testing URLs ===\n${colors.reset}`);

// Frontend URLs
console.log(`${colors.bright}${colors.blue}Frontend URLs:${colors.reset}`);
console.log(`${colors.cyan}Main URL:${colors.reset} http://localhost:${FRONTEND_PORT}`);
console.log(`${colors.cyan}Login:${colors.reset} http://localhost:${FRONTEND_PORT}/login`);
console.log(`${colors.cyan}Dashboard:${colors.reset} http://localhost:${FRONTEND_PORT}/dashboard`);
console.log(`${colors.cyan}Restaurant Management:${colors.reset} http://localhost:${FRONTEND_PORT}/dashboard/restaurants/new`);
console.log(`${colors.cyan}Menu Management:${colors.reset} http://localhost:${FRONTEND_PORT}/dashboard/menus/[restaurantId]\n`);

// Backend API Endpoints
console.log(`${colors.bright}${colors.green}Backend API Endpoints:${colors.reset}`);
console.log(`${colors.green}Base URL:${colors.reset} http://localhost:${BACKEND_PORT}`);
console.log(`${colors.green}Authentication:${colors.reset} http://localhost:${BACKEND_PORT}/auth/login`);
console.log(`${colors.green}Restaurants:${colors.reset} http://localhost:${BACKEND_PORT}/restaurants`);
console.log(`${colors.green}Menus:${colors.reset} http://localhost:${BACKEND_PORT}/menus/:restaurant_id`);
console.log(`${colors.green}Orders:${colors.reset} http://localhost:${BACKEND_PORT}/orders`);
console.log(`${colors.green}Themes:${colors.reset} http://localhost:${BACKEND_PORT}/themes\n`);

// Check if servers are running
console.log(`${colors.bright}${colors.yellow}Server Status Check:${colors.reset}`);

// Check for PID file to see if servers are running
const pidsPath = path.join(__dirname, '.dev-pids');
if (fs.existsSync(pidsPath)) {
  console.log(`${colors.green}Development servers appear to be running.${colors.reset}`);
  console.log(`${colors.yellow}Use 'node stop-dev.js' to stop the servers.${colors.reset}`);
} else {
  console.log(`${colors.yellow}Development servers don't appear to be running.${colors.reset}`);
  console.log(`${colors.yellow}Use 'node start-dev.js' to start the servers.${colors.reset}`);
}

// Testing instructions
console.log(`\n${colors.bright}${colors.magenta}Testing Instructions:${colors.reset}`);
console.log(`${colors.magenta}1.${colors.reset} Start the development servers with: ${colors.bright}node start-dev.js${colors.reset}`);
console.log(`${colors.magenta}2.${colors.reset} Open the frontend URL in your browser: ${colors.bright}http://localhost:${FRONTEND_PORT}${colors.reset}`);
console.log(`${colors.magenta}3.${colors.reset} Test API endpoints using tools like Postman or curl`);
console.log(`${colors.magenta}4.${colors.reset} Stop the servers when done with: ${colors.bright}node stop-dev.js${colors.reset}\n`); 