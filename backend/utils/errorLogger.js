// Error logging utility with context and classification
const { errors, security } = require('./logger');
const config = require('../config/logging');

class ErrorLogger {
  /**
   * Log an error with full context
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   * @param {string} requestId - Optional request ID for tracing
   */
  static logError(error, context = {}, requestId = null) {
    const severity = this.determineSeverity(error);
    const errorCode = this.extractErrorCode(error);
    
    const errorInfo = {
      message: error.message,
      name: error.name,
      code: errorCode,
      severity,
      timestamp: new Date().toISOString(),
      ...(config.categories.errors.includeStackTrace && { stack: error.stack }),
      ...(requestId && { requestId }),
      context,
      
      // Additional error properties
      ...(error.status && { httpStatus: error.status }),
      ...(error.statusCode && { httpStatus: error.statusCode }),
      ...(error.errno && { errno: error.errno }),
      ...(error.syscall && { syscall: error.syscall }),
      ...(error.path && { path: error.path })
    };
    
    // Log based on severity
    switch (severity) {
      case 'critical':
        errors.error('Critical error occurred', errorInfo);
        // Also log to console for immediate visibility
        console.error('🚨 CRITICAL ERROR:', errorInfo);
        break;
      case 'high':
        errors.error('High severity error', errorInfo);
        break;
      case 'medium':
        errors.warn('Medium severity error', errorInfo);
        break;
      case 'low':
        errors.info('Low severity error', errorInfo);
        break;
      default:
        errors.error('Unknown severity error', errorInfo);
    }
    
    // Log security-related errors separately
    if (this.isSecurityError(error)) {
      security.warn('Security-related error detected', {
        error_type: 'security_incident',
        ...errorInfo
      });
    }
    
    return errorInfo;
  }
  
  /**
   * Determine error severity based on error characteristics
   * @param {Error} error - The error object
   * @returns {string} Severity level (critical, high, medium, low)
   */
  static determineSeverity(error) {
    // Critical errors - system failures
    if (error.name === 'MongoNetworkError' || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('MongoDB') ||
        error.code === 'ENOTFOUND' ||
        error.syscall === 'connect') {
      return 'critical';
    }
    
    // High severity - significant functionality impact
    if (error.name === 'ValidationError' ||
        error.status === 500 ||
        error.statusCode === 500 ||
        error.message.includes('timeout') ||
        error.code === 'ENOENT') {
      return 'high';
    }
    
    // Medium severity - user-facing errors
    if (error.status >= 400 && error.status < 500 ||
        error.statusCode >= 400 && error.statusCode < 500 ||
        error.name === 'CastError') {
      return 'medium';
    }
    
    // Low severity - validation and user input errors
    if (error.name === 'ValidationError' ||
        error.status === 400 ||
        error.statusCode === 400) {
      return 'low';
    }
    
    return 'medium'; // Default
  }
  
  /**
   * Extract error code from various error types
   * @param {Error} error - The error object
   * @returns {string} Error code
   */
  static extractErrorCode(error) {
    return error.code || 
           error.errno || 
           error.status || 
           error.statusCode || 
           error.name || 
           'UNKNOWN_ERROR';
  }
  
  /**
   * Check if error is security-related
   * @param {Error} error - The error object
   * @returns {boolean} True if security-related
   */
  static isSecurityError(error) {
    const securityKeywords = [
      'unauthorized', 'forbidden', 'authentication', 'authorization',
      'token', 'jwt', 'permission', 'access denied', 'invalid credentials'
    ];
    
    const errorText = (error.message + ' ' + error.name).toLowerCase();
    return securityKeywords.some(keyword => errorText.includes(keyword)) ||
           error.status === 401 || error.status === 403 ||
           error.statusCode === 401 || error.statusCode === 403;
  }
  
  /**
   * Log a validation error with field details
   * @param {Error} error - Validation error
   * @param {Object} inputData - The data that failed validation
   * @param {string} operation - The operation being performed
   */
  static logValidationError(error, inputData, operation) {
    const context = {
      operation,
      validation_failed: true,
      input_data: config.categories.errors.verbose ? inputData : '[hidden]',
      field_errors: this.extractValidationFields(error)
    };
    
    this.logError(error, context);
  }
  
  /**
   * Extract field-specific validation errors
   * @param {Error} error - Validation error
   * @returns {Array} Array of field errors
   */
  static extractValidationFields(error) {
    if (error.name === 'ValidationError' && error.errors) {
      return Object.entries(error.errors).map(([field, fieldError]) => ({
        field,
        message: fieldError.message,
        value: fieldError.value,
        kind: fieldError.kind
      }));
    }
    return [];
  }
  
  /**
   * Log a database error with query context
   * @param {Error} error - Database error
   * @param {string} operation - Database operation (find, save, update, etc.)
   * @param {string} collection - Collection name
   * @param {Object} query - Query parameters
   */
  static logDatabaseError(error, operation, collection, query = {}) {
    const context = {
      database_operation: operation,
      collection,
      query: config.categories.database.logQueries ? query : '[hidden]',
      error_type: 'database_error'
    };
    
    this.logError(error, context);
  }
  
  /**
   * Log an authentication error
   * @param {Error} error - Authentication error
   * @param {Object} authContext - Authentication context (email, IP, etc.)
   */
  static logAuthError(error, authContext = {}) {
    const context = {
      auth_operation: authContext.operation || 'unknown',
      user_email: authContext.email || 'unknown',
      ip_address: authContext.ip || 'unknown',
      user_agent: authContext.userAgent || 'unknown',
      error_type: 'authentication_error'
    };
    
    this.logError(error, context);
    
    // Also log to security logger
    security.warn('Authentication failure', {
      ...context,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Create Express error middleware
   * @returns {Function} Express middleware function
   */
  static createExpressMiddleware() {
    return (error, req, res, next) => {
      const context = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: config.categories.errors.verbose ? req.body : '[hidden]',
        headers: config.categories.api.logHeaders ? req.headers : '[hidden]',
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        request_id: req.id || req.headers['x-request-id']
      };
      
      this.logError(error, context, context.request_id);
      
      // Continue with normal error handling
      next(error);
    };
  }
  
  /**
   * Wrap async functions to automatically log errors
   * @param {Function} asyncFunction - Async function to wrap
   * @param {string} operationName - Name of the operation for logging
   * @returns {Function} Wrapped function
   */
  static wrapAsync(asyncFunction, operationName) {
    return async (...args) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        this.logError(error, { 
          operation: operationName,
          args_count: args.length 
        });
        throw error;
      }
    };
  }
}

module.exports = ErrorLogger; 