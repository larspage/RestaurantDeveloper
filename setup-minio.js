const { spawn, execSync } = require('child_process');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== MinIO Setup for Restaurant Developer ===\n${colors.reset}`);

// Check if Docker is running
console.log(`${colors.yellow}Checking if Docker is running...${colors.reset}`);

try {
  execSync('docker info', { stdio: 'ignore' });
  console.log(`${colors.green}✓ Docker is running${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Docker is not running. Please start Docker and try again.${colors.reset}`);
  process.exit(1);
}

// Check if MinIO is already running
console.log(`${colors.yellow}Checking if MinIO is already running...${colors.reset}`);

try {
  const output = execSync('docker ps --filter "name=minio" --format "{{.Names}}"').toString().trim();
  if (output === 'minio') {
    console.log(`${colors.green}✓ MinIO is already running${colors.reset}`);
    console.log(`${colors.cyan}MinIO console: http://localhost:9001${colors.reset}`);
    console.log(`${colors.cyan}MinIO S3 endpoint: http://localhost:9000${colors.reset}`);
    console.log(`${colors.cyan}Default credentials: minioadmin / minioadmin${colors.reset}`);
    process.exit(0);
  }
} catch (error) {
  // Continue if command fails
}

// Start MinIO
console.log(`${colors.yellow}Starting MinIO...${colors.reset}`);

try {
  execSync('docker run -d -p 9000:9000 -p 9001:9001 --name minio minio/minio server /data --console-address ":9001"');
  console.log(`${colors.green}✓ MinIO started successfully${colors.reset}`);
} catch (error) {
  // Check if container exists but is stopped
  try {
    const containerExists = execSync('docker ps -a --filter "name=minio" --format "{{.Names}}"').toString().trim() === 'minio';
    if (containerExists) {
      console.log(`${colors.yellow}MinIO container exists but is not running. Starting it...${colors.reset}`);
      execSync('docker start minio');
      console.log(`${colors.green}✓ MinIO started successfully${colors.reset}`);
    } else {
      console.error(`${colors.red}✗ Failed to start MinIO: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  } catch (innerError) {
    console.error(`${colors.red}✗ Failed to start MinIO: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

console.log(`\n${colors.bright}${colors.cyan}=== MinIO Information ===\n${colors.reset}`);
console.log(`${colors.cyan}MinIO console: http://localhost:9001${colors.reset}`);
console.log(`${colors.cyan}MinIO S3 endpoint: http://localhost:9000${colors.reset}`);
console.log(`${colors.cyan}Default credentials: minioadmin / minioadmin${colors.reset}`);

console.log(`\n${colors.yellow}Please create a bucket named 'restaurant-menu-images' in the MinIO console.${colors.reset}`);
console.log(`${colors.yellow}1. Open http://localhost:9001 in your browser${colors.reset}`);
console.log(`${colors.yellow}2. Login with minioadmin / minioadmin${colors.reset}`);
console.log(`${colors.yellow}3. Click on "Create Bucket" and name it "restaurant-menu-images"${colors.reset}`);
console.log(`${colors.yellow}4. Set the bucket's access policy to "public" for development purposes${colors.reset}`);

console.log(`\n${colors.green}MinIO is now ready for use with the Restaurant Developer application!${colors.reset}`); 