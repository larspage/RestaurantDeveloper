const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.yellow}=== Stopping Restaurant Developer Servers ===\n${colors.reset}`);

// Try to read the process IDs from the file
const pidsPath = path.join(__dirname, '.dev-pids');
let pids = null;

try {
  if (fs.existsSync(pidsPath)) {
    pids = JSON.parse(fs.readFileSync(pidsPath, 'utf8'));
    console.log(`${colors.green}Found stored process IDs${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error reading process IDs: ${error.message}${colors.reset}`);
}

// Define port numbers
const BACKEND_PORT = 3550;
const FRONTEND_PORT = 3560;

// Function to kill processes by port number
const killProcessByPort = (port, name) => {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Attempting to stop ${name} server on port ${port}...${colors.reset}`);
    
    // Windows command to find and kill process by port
    let command;
    if (process.platform === 'win32') {
      // For Windows, we need to use a batch file or PowerShell
      command = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"`;
    } else {
      // For Unix-based systems
      command = `lsof -i :${port} -t | xargs kill -9`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log(`${colors.yellow}No active process found on port ${port} or unable to kill it.${colors.reset}`);
      } else {
        console.log(`${colors.green}Successfully stopped ${name} server on port ${port}.${colors.reset}`);
      }
      resolve();
    });
  });
};

// Function to kill a process by PID
const killProcessByPid = (pid, name) => {
  return new Promise((resolve) => {
    if (!pid) {
      console.log(`${colors.yellow}No ${name} process ID found.${colors.reset}`);
      resolve();
      return;
    }

    console.log(`${colors.yellow}Attempting to stop ${name} process (PID: ${pid})...${colors.reset}`);
    
    const command = process.platform === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    exec(command, (error) => {
      if (error) {
        console.log(`${colors.yellow}${name} process (PID: ${pid}) not found or already stopped.${colors.reset}`);
      } else {
        console.log(`${colors.green}Successfully stopped ${name} process (PID: ${pid}).${colors.reset}`);
      }
      resolve();
    });
  });
};

// Main function to stop all servers
async function stopServers() {
  // Try to stop by PID first if available
  if (pids) {
    await killProcessByPid(pids.backend, 'Backend');
    await killProcessByPid(pids.frontend, 'Frontend');
  }
  
  // Also try to stop by port to be sure
  await killProcessByPort(BACKEND_PORT, 'Backend');
  await killProcessByPort(FRONTEND_PORT, 'Frontend');
  
  // Clean up PID file
  try {
    if (fs.existsSync(pidsPath)) {
      fs.unlinkSync(pidsPath);
      console.log(`${colors.green}Removed temporary PID file${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error removing PID file: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.green}All development servers have been stopped.${colors.reset}`);
}

// Run the stop function
stopServers(); 