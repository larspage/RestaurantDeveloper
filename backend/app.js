const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// The dotenv config is now handled by nodemon.json
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const { connect } = require('./db/mongo');

// Initialize logging system
const { main: logger } = require('./utils/logger');
const { createLoggingMiddleware } = require('./middleware/logging');
const PerformanceLogger = require('./utils/performanceLogger');

// Log application startup
const loggingConfig = require('./config/logging');
logger.info('Restaurant Developer Backend starting up', {
  node_version: process.version,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3550,
  session_id: loggingConfig.sessionId,
  log_mode: loggingConfig.useSessionLogs ? 'session-based' : 'daily-rotation'
});

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menus');
const orderRoutes = require('./routes/orders');
const themeRoutes = require('./routes/themes');
const printerRoutes = require('./routes/printers');

const app = express();

// Connect to MongoDB with logging
const connectTimer = PerformanceLogger.startTimer('mongodb_connection');
connect()
  .then(() => {
    connectTimer.end({ success: true });
    logger.info('MongoDB connection established successfully');
  })
  .catch(err => {
    connectTimer.end({ success: false, error: err.message });
    logger.error('Failed to connect to MongoDB', { 
      error: err.message, 
      stack: err.stack 
    });
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Add comprehensive logging middleware
app.use(createLoggingMiddleware());

// Keep morgan for additional HTTP logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/menus', menuRoutes);
app.use('/orders', orderRoutes);
app.use('/themes', themeRoutes);
app.use('/printers', printerRoutes);

// Error handling middleware (logging is handled by middleware)
app.use((err, req, res, next) => {
  // Error is already logged by ErrorLogger middleware
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    error: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3550;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const serverTimer = PerformanceLogger.startTimer('server_startup');
  
  const server = app.listen(PORT, () => {
    serverTimer.end({ success: true });
    
    logger.info('Server started successfully', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      health_check: `http://localhost:${PORT}/health`,
      pid: process.pid
    });
    
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Logs directory: ${require('./config/logging').logDir}`);
    console.log(`🔍 Session ID: ${loggingConfig.sessionId} (${loggingConfig.useSessionLogs ? 'fresh logs' : 'daily rotation'})`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

module.exports = app; 