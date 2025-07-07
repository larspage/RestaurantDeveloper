// Main logger setup using Winston
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const config = require('../config/logging');

// Ensure log directories exist
function ensureLogDirectories() {
  const logDir = config.logDir;
  
  // Create main logs directory
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Create category subdirectories
  Object.values(config.categories).forEach(category => {
    const categoryDir = path.join(logDir, path.dirname(category.filename));
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  });
}

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: config.format.timestamp }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(stack && { stack }),
      ...meta
    };
    
    return config.format.prettyPrint 
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const categoryStr = category ? `[${category.toUpperCase()}]` : '';
    return `${timestamp} ${level}${categoryStr}: ${message}${metaStr}`;
  })
);

// Initialize log directories
ensureLogDirectories();

// Create category-specific loggers
const loggers = {};

Object.entries(config.categories).forEach(([categoryName, categoryConfig]) => {
  if (!categoryConfig.enabled) return;
  
  const transports = [];
  
  // File transport - session-based in development, daily rotation in production
  if (config.useSessionLogs) {
    // Session-based logging for development
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDir, categoryConfig.filename),
        format: customFormat,
        level: categoryConfig.level
      })
    );
  } else {
    // Daily rotation for production
    transports.push(
      new DailyRotateFile({
        filename: path.join(config.logDir, categoryConfig.filename),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.maxFileSize,
        maxFiles: `${config.retentionDays}d`,
        format: customFormat,
        level: categoryConfig.level,
        auditFile: path.join(config.logDir, `${categoryName}-audit.json`)
      })
    );
  }
  
  // Console transport for development
  if (config.console.enabled) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: config.console.level
      })
    );
  }
  
  // Create logger for this category
  loggers[categoryName] = winston.createLogger({
    level: categoryConfig.level,
    transports,
    defaultMeta: { category: categoryName },
    exitOnError: false
  });
});

// Main application logger (combines all categories)
const mainTransports = [];

if (config.useSessionLogs) {
  // Session-based logging for development
  mainTransports.push(
    new winston.transports.File({
      filename: path.join(config.logDir, `app-${config.sessionId}.log`),
      format: customFormat
    })
  );
} else {
  // Daily rotation for production
  mainTransports.push(
    new DailyRotateFile({
      filename: path.join(config.logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.maxFileSize,
      maxFiles: `${config.retentionDays}d`,
      format: customFormat,
      auditFile: path.join(config.logDir, 'app-audit.json')
    })
  );
}

const mainLogger = winston.createLogger({
  level: config.level,
  transports: mainTransports,
  defaultMeta: { category: 'app' },
  exitOnError: false
});

// Add console transport for main logger in development
if (config.console.enabled) {
  mainLogger.add(new winston.transports.Console({
    format: consoleFormat,
    level: config.console.level
  }));
}

// Handle unhandled promise rejections
if (config.categories.errors.captureUnhandledRejections) {
  process.on('unhandledRejection', (reason, promise) => {
    loggers.errors?.error('Unhandled Promise Rejection', {
      reason: reason?.toString() || 'Unknown reason',
      stack: reason?.stack,
      promise: promise?.toString()
    });
  });
  
  process.on('uncaughtException', (error) => {
    loggers.errors?.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Give logger time to write before exiting
    setTimeout(() => process.exit(1), 1000);
  });
}

// Export individual category loggers and main logger
module.exports = {
  // Category loggers
  performance: loggers.performance || mainLogger,
  errors: loggers.errors || mainLogger,
  auth: loggers.authentication || mainLogger,
  database: loggers.database || mainLogger,
  api: loggers.api || mainLogger,
  business: loggers.business || mainLogger,
  security: loggers.security || mainLogger,
  
  // Main logger
  main: mainLogger,
  
  // Configuration access
  config,
  
  // Utility function to create request-specific logger
  createRequestLogger: (requestId) => {
    return {
      performance: loggers.performance?.child({ requestId }),
      errors: loggers.errors?.child({ requestId }),
      auth: loggers.authentication?.child({ requestId }),
      database: loggers.database?.child({ requestId }),
      api: loggers.api?.child({ requestId }),
      business: loggers.business?.child({ requestId }),
      security: loggers.security?.child({ requestId })
    };
  }
}; 