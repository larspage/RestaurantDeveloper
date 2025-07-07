// Logging configuration for Restaurant Developer
const path = require('path');

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// Generate session ID for this application run
const sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2025-07-07T17-11-14

const loggingConfig = {
  // Global settings
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 7,
  maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
  
  // Session-based logging for development
  sessionId,
  useSessionLogs: isDevelopment || isTest,
  
  // Log directory
  logDir: path.join(__dirname, '..', 'logs'),
  
  // Category-specific settings
  categories: {
    performance: {
      enabled: process.env.LOG_PERFORMANCE !== 'false',
      level: 'info',
      includeStackTrace: false,
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000, // ms
      filename: isDevelopment ? `performance/performance-${sessionId}.log` : 'performance/performance-%DATE%.log'
    },
    
    errors: {
      enabled: true, // Always enabled
      level: 'error',
      verbose: process.env.LOG_ERROR_VERBOSE !== 'false',
      includeStackTrace: true,
      captureUnhandledRejections: true,
      filename: isDevelopment ? `errors/error-${sessionId}.log` : 'errors/error-%DATE%.log'
    },
    
    authentication: {
      enabled: process.env.LOG_AUTH !== 'false',
      level: 'info',
      logFailures: true,
      logSuccesses: isDevelopment, // Only log successes in development
      logTokens: false, // Never log actual tokens
      filename: isDevelopment ? `auth/auth-${sessionId}.log` : 'auth/auth-%DATE%.log'
    },
    
    database: {
      enabled: process.env.LOG_DATABASE !== 'false',
      level: isDevelopment ? 'debug' : 'info',
      logQueries: isDevelopment,
      logConnections: true,
      logSlowQueries: true,
      slowQueryThreshold: 500, // ms
      filename: isDevelopment ? `database/db-${sessionId}.log` : 'database/db-%DATE%.log'
    },
    
    api: {
      enabled: process.env.LOG_API !== 'false',
      level: 'info',
      logRequests: true,
      logResponses: isDevelopment,
      logHeaders: false, // Security consideration
      excludeHealthChecks: true,
      excludePaths: ['/health', '/favicon.ico'],
      filename: isDevelopment ? `api/api-${sessionId}.log` : 'api/api-%DATE%.log'
    },
    
    business: {
      enabled: process.env.LOG_BUSINESS !== 'false',
      level: 'info',
      logOrderCreation: true,
      logMenuUpdates: true,
      logRestaurantActions: true,
      logUserActions: true,
      filename: isDevelopment ? `business/business-${sessionId}.log` : 'business/business-%DATE%.log'
    },
    
    security: {
      enabled: process.env.LOG_SECURITY !== 'false',
      level: 'warn',
      logFailedLogins: true,
      logSuspiciousActivity: true,
      logRateLimiting: true,
      filename: isDevelopment ? `security/security-${sessionId}.log` : 'security/security-%DATE%.log'
    }
  },
  
  // Console logging settings
  console: {
    enabled: isDevelopment || isTest,
    level: isDevelopment ? 'debug' : 'info',
    colorize: true,
    timestamp: true
  },
  
  // Format settings
  format: {
    timestamp: 'YYYY-MM-DD HH:mm:ss',
    timezone: 'local',
    includeMetadata: true,
    prettyPrint: isDevelopment
  }
};

module.exports = loggingConfig; 