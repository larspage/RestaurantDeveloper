# Restaurant Developer - Development Scripts

This document explains how to use the development scripts to run both the frontend and backend servers with custom port numbers.

## Prerequisites

Make sure you have all the required dependencies installed:

```bash
# Install project dependencies
npm install

# Install react-query (required for the frontend)
npm install react-query

# Install cross-env in the backend directory (for Windows compatibility)
cd backend && npm install --save-dev cross-env && cd ..
```

## Available Scripts

### `npm run dev:all` or `node start-dev.js` or `start-dev.bat`

Starts both the frontend and backend development servers with the following configurations:
- **Backend:** Running on port `3550`
- **Frontend:** Running on port `3560`

This script automatically:
1. Creates/updates the necessary `.env` files with the correct port numbers
2. Starts both servers in development mode
3. Displays colored console output to distinguish between frontend and backend logs
4. Stores process IDs for easy shutdown later

### `npm run stop` or `node stop-dev.js` or `stop-dev.bat`

Stops both the frontend and backend development servers. This script:
1. Attempts to stop the servers using stored process IDs
2. Falls back to stopping processes by port number if needed
3. Cleans up temporary files
4. Works on both Windows and Unix-based systems

### `npm run urls` or `node dev-urls.js`

Displays a list of all available URLs for testing:
- Frontend URLs (main page, login, dashboard, etc.)
- Backend API endpoints
- Current server status
- Testing instructions

## Testing in Browser

### Frontend URLs
- Main URL: http://localhost:3560
- Login: http://localhost:3560/login
- Dashboard: http://localhost:3560/dashboard
- Restaurant Management: http://localhost:3560/dashboard/restaurants/new
- Menu Management: http://localhost:3560/dashboard/menus/[restaurantId]

### Backend API Endpoints
- Base URL: http://localhost:3550
- Authentication: http://localhost:3550/auth/login
- Restaurants: http://localhost:3550/restaurants
- Menus: http://localhost:3550/menus/:restaurant_id
- Orders: http://localhost:3550/orders
- Themes: http://localhost:3550/themes

## Quick Start

### For Windows Users:
1. Start the development environment:
   ```
   start-dev.bat
   ```

2. Open the frontend in your browser:
   ```
   http://localhost:3560
   ```

3. When finished, stop all servers:
   ```
   stop-dev.bat
   ```

### For Unix/Mac Users:
1. Start the development environment:
   ```
   npm run dev:all
   ```

2. Open the frontend in your browser:
   ```
   http://localhost:3560
   ```

3. When finished, stop all servers:
   ```
   npm run stop
   ```

## Troubleshooting

If you encounter issues with the servers not starting or stopping:

1. Check if any processes are already using ports 3550 or 3560
2. Try stopping the servers manually using the Task Manager (Windows) or `kill` command (Unix)
3. Delete the `.dev-pids` file if it exists and try starting the servers again
4. Make sure all dependencies are installed (especially `react-query` for the frontend and `cross-env` for the backend) 