// Express middleware for API logging
const { api, auth, security } = require('../utils/logger');
const PerformanceLogger = require('../utils/performanceLogger');
const ErrorLogger = require('../utils/errorLogger');
const config = require('../config/logging');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
  return uuidv4().split('-')[0]; // Short ID for logs
}

/**
 * API request/response logging middleware
 */
function apiLoggingMiddleware(req, res, next) {
  // Skip if API logging is disabled
  if (!config.categories.api.enabled) {
    return next();
  }
  
  // Skip excluded paths
  const excludePaths = config.categories.api.excludePaths || [];
  if (excludePaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  // Skip health checks if configured
  if (config.categories.api.excludeHealthChecks && req.path === '/health') {
    return next();
  }
  
  // Generate request ID for tracing
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.id = requestId;
  
  // Start performance timer
  const timer = PerformanceLogger.startTimer(`api_${req.method.toLowerCase()}`, {
    method: req.method,
    path: req.path,
    requestId,
    ip: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent')
  });
  
  // Log incoming request
  if (config.categories.api.logRequests) {
    const requestData = {
      requestId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      body: req.body && Object.keys(req.body).length > 0 ? 
        (config.categories.api.logHeaders ? req.body : '[hidden]') : undefined,
      headers: config.categories.api.logHeaders ? req.headers : '[hidden]',
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      content_length: req.get('Content-Length'),
      content_type: req.get('Content-Type')
    };
    
    api.info('Incoming API request', requestData);
  }
  
  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody = null;
  
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Log response when finished
  res.on('finish', () => {
    const duration = timer.end({
      status_code: res.statusCode,
      success: res.statusCode < 400
    });
    
    if (config.categories.api.logResponses) {
      const responseData = {
        requestId,
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        duration_ms: duration,
        response_size: res.get('Content-Length'),
        response_body: config.categories.api.logResponses && responseBody ? 
          (typeof responseBody === 'string' ? responseBody.substring(0, 1000) : JSON.stringify(responseBody).substring(0, 1000)) : 
          '[hidden]'
      };
      
      if (res.statusCode >= 400) {
        api.warn('API request failed', responseData);
      } else {
        api.info('API request completed', responseData);
      }
    }
  });
  
  next();
}

/**
 * Authentication logging middleware
 */
function authLoggingMiddleware(req, res, next) {
  // Skip if auth logging is disabled
  if (!config.categories.authentication.enabled) {
    return next();
  }
  
  // Only log auth-related routes
  if (!req.path.startsWith('/auth')) {
    return next();
  }
  
  const authData = {
    requestId: req.id,
    auth_operation: req.path.split('/')[2] || 'unknown', // /auth/login -> login
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
    email: req.body?.email || 'unknown'
  };
  
  // Log auth attempt
  auth.info('Authentication attempt', authData);
  
  // Monitor response for success/failure
  res.on('finish', () => {
    const success = res.statusCode < 400;
    
    if (success && config.categories.authentication.logSuccesses) {
      auth.info('Authentication successful', {
        ...authData,
        status_code: res.statusCode,
        success: true
      });
    } else if (!success && config.categories.authentication.logFailures) {
      auth.warn('Authentication failed', {
        ...authData,
        status_code: res.statusCode,
        success: false
      });
      
      // Also log to security logger for failed attempts
      security.warn('Authentication failure detected', {
        ...authData,
        failure_type: res.statusCode === 401 ? 'invalid_credentials' : 'other',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
}

/**
 * Security monitoring middleware
 */
function securityLoggingMiddleware(req, res, next) {
  if (!config.categories.security.enabled) {
    return next();
  }
  
  const securityChecks = [];
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /eval\(/i,  // Code injection
  ];
  
  const checkString = `${req.path} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}`;
  
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(checkString)) {
      securityChecks.push(`suspicious_pattern_${index}`);
    }
  });
  
  // Check for unusual request characteristics
  if (req.get('Content-Length') && parseInt(req.get('Content-Length')) > 10000000) {
    securityChecks.push('large_payload');
  }
  
  if (req.path.length > 1000) {
    securityChecks.push('long_path');
  }
  
  // Log security concerns
  if (securityChecks.length > 0) {
    security.warn('Security concern detected', {
      requestId: req.id,
      concerns: securityChecks,
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

/**
 * Rate limiting logging middleware
 */
function rateLimitLoggingMiddleware(req, res, next) {
  // This would integrate with rate limiting middleware
  // For now, just set up the structure
  
  res.on('finish', () => {
    if (res.statusCode === 429) { // Too Many Requests
      security.warn('Rate limit exceeded', {
        requestId: req.id,
        ip: req.ip || req.connection.remoteAddress,
        path: req.path,
        method: req.method,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
}

/**
 * Combined logging middleware that applies all logging
 */
function createLoggingMiddleware() {
  return [
    apiLoggingMiddleware,
    authLoggingMiddleware,
    securityLoggingMiddleware,
    rateLimitLoggingMiddleware,
    ErrorLogger.createExpressMiddleware()
  ];
}

module.exports = {
  apiLoggingMiddleware,
  authLoggingMiddleware,
  securityLoggingMiddleware,
  rateLimitLoggingMiddleware,
  createLoggingMiddleware
}; 