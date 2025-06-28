const { spawn, execSync } = require('child_process');
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

// Check if Docker is running
let dockerRunning = false;
try {
  execSync('docker info', { stdio: 'ignore' });
  dockerRunning = true;
  console.log(`${colors.green}✓ Docker is running${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}⚠️ Docker is not running. Image uploads will not work.${colors.reset}`);
}

// Check if MinIO is running and start it if needed
if (dockerRunning) {
  try {
    const output = execSync('docker ps --filter "name=minio" --format "{{.Names}}"').toString().trim();
    if (output === 'minio') {
      console.log(`${colors.green}✓ MinIO is already running${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Starting MinIO...${colors.reset}`);
      try {
        // Check if container exists but is stopped
        const containerExists = execSync('docker ps -a --filter "name=minio" --format "{{.Names}}"').toString().trim() === 'minio';
        if (containerExists) {
          execSync('docker start minio');
        } else {
          execSync('docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"');
        }
        console.log(`${colors.green}✓ MinIO started successfully${colors.reset}`);
        console.log(`${colors.cyan}MinIO console: http://localhost:9001 (credentials: minioadmin/minioadmin)${colors.reset}`);
        
        // Check if bucket exists and create it if it doesn't
        setTimeout(() => {
          try {
            // Initialize MinIO client
            try {
              execSync('docker exec minio mc alias set local http://localhost:9000 minioadmin minioadmin');
            } catch (error) {
              // Ignore errors, just trying to ensure the alias is set
            }
            
            // Check if bucket exists
            try {
              const bucketExists = execSync('docker exec minio mc ls local | grep restaurant-menu-images').toString().trim() !== '';
              if (!bucketExists) {
                console.log(`${colors.yellow}Creating 'restaurant-menu-images' bucket in MinIO...${colors.reset}`);
                try {
                  // Create the bucket
                  execSync('docker exec minio mc mb local/restaurant-menu-images');
                  // Set the bucket policy to public
                  execSync('docker exec minio mc policy set public local/restaurant-menu-images');
                  
                  // Configure CORS for the bucket
                  try {
                    // Create a temporary CORS configuration file
                    const corsConfig = JSON.stringify({
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": {"AWS": ["*"]},
                          "Action": ["s3:GetObject"],
                          "Resource": ["arn:aws:s3:::restaurant-menu-images/*"]
                        }
                      ]
                    });
                    
                    // Write the CORS config to a file in the container
                    execSync(`docker exec minio sh -c 'echo \\'${corsConfig}\\' > /tmp/cors.json'`);
                    
                    // Apply the CORS configuration
                    execSync('docker exec minio mc anonymous set-json /tmp/cors.json local/restaurant-menu-images');
                    console.log(`${colors.green}✓ Configured CORS for bucket 'restaurant-menu-images'${colors.reset}`);
                  } catch (corsError) {
                    console.log(`${colors.yellow}⚠️ Could not configure CORS for bucket: ${corsError.message}${colors.reset}`);
                  }
                  
                  console.log(`${colors.green}✓ Created bucket 'restaurant-menu-images' with public access${colors.reset}`);
                } catch (createError) {
                  console.log(`${colors.yellow}⚠️ Failed to create bucket: ${createError.message}${colors.reset}`);
                  console.log(`${colors.yellow}⚠️ Please create a bucket named 'restaurant-menu-images' manually in the MinIO console (http://localhost:9001)${colors.reset}`);
                }
              } else {
                console.log(`${colors.green}✓ Bucket 'restaurant-menu-images' exists${colors.reset}`);
              }
            } catch (error) {
              console.log(`${colors.yellow}⚠️ Could not check if bucket exists. Please ensure 'restaurant-menu-images' bucket is created in MinIO console.${colors.reset}`);
            }
          } catch (error) {
            console.log(`${colors.yellow}⚠️ Could not check if bucket exists. Please ensure 'restaurant-menu-images' bucket is created in MinIO console.${colors.reset}`);
          }
        }, 3000);
      } catch (error) {
        console.log(`${colors.yellow}⚠️ Failed to start MinIO: ${error.message}. Image uploads will not work.${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Could not check MinIO status: ${error.message}. Image uploads may not work.${colors.reset}`);
  }
}

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