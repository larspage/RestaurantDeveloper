const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== Restaurant Developer - Development Environment ===\n${colors.reset}`);
console.log(`${colors.yellow}Starting backend and frontend servers...${colors.reset}\n`);

// Define port numbers
const BACKEND_PORT = 3550;
const FRONTEND_PORT = 3560;

// Create a temporary .env file for the backend with the updated port
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnvContent = `PORT=${BACKEND_PORT}\nNODE_ENV=development\n`;

// Check if backend/.env already exists
if (!fs.existsSync(path.dirname(backendEnvPath))) {
  console.log(`${colors.red}Backend directory not found. Please make sure you're running this script from the project root.${colors.reset}`);
  process.exit(1);
}

// Write or update the backend .env file
fs.writeFileSync(backendEnvPath, backendEnvContent);
console.log(`${colors.green}Backend .env file updated with PORT=${BACKEND_PORT}${colors.reset}`);

// Create a temporary .env file for the frontend with the updated port and API URL
const frontendEnvPath = path.join(__dirname, '.env.local');
const frontendEnvContent = `NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}\n`;

// Write or update the frontend .env file
fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log(`${colors.green}Frontend .env.local file updated with API URL${colors.reset}`);

// Start backend server
const backend = spawn('npm', ['run', 'dev:custom'], { 
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'pipe'
});

// Start frontend server with custom port
const frontend = spawn('npm', ['run', 'dev:custom'], {
  cwd: __dirname,
  shell: true,
  stdio: 'pipe'
});

// Store process IDs for the shutdown script
const pidsPath = path.join(__dirname, '.dev-pids');
fs.writeFileSync(pidsPath, JSON.stringify({
  backend: backend.pid,
  frontend: frontend.pid
}));

// Handle backend output
backend.stdout.on('data', (data) => {
  console.log(`${colors.green}[Backend] ${colors.reset}${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
  console.error(`${colors.red}[Backend Error] ${colors.reset}${data.toString().trim()}`);
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  console.log(`${colors.cyan}[Frontend] ${colors.reset}${data.toString().trim()}`);
});

frontend.stderr.on('data', (data) => {
  console.error(`${colors.red}[Frontend Error] ${colors.reset}${data.toString().trim()}`);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down servers...${colors.reset}`);
  backend.kill();
  frontend.kill();
  process.exit();
});

// Display URLs for testing
console.log(`\n${colors.bright}${colors.yellow}=== Development Servers ===\n${colors.reset}`);
console.log(`${colors.bright}Frontend URL: ${colors.cyan}http://localhost:${FRONTEND_PORT}${colors.reset}`);
console.log(`${colors.bright}Backend API: ${colors.green}http://localhost:${BACKEND_PORT}${colors.reset}\n`);
console.log(`${colors.yellow}Press Ctrl+C to stop both servers${colors.reset}\n`); 