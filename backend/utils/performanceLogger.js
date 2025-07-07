// Performance logging utility
const { performance, database } = require('./logger');
const config = require('../config/logging');

class PerformanceLogger {
  /**
   * Start a performance timer for an operation
   * @param {string} operation - Name of the operation being timed
   * @param {Object} metadata - Additional metadata to include
   * @returns {Object} Timer object with end() method
   */
  static startTimer(operation, metadata = {}) {
    const startTime = process.hrtime.bigint();
    const startTimestamp = new Date().toISOString();
    
    // Log operation start in debug mode
    if (config.categories.performance.enabled) {
      performance.debug('Operation started', {
        operation,
        startTimestamp,
        ...metadata
      });
    }
    
    return {
      operation,
      startTime,
      startTimestamp,
      metadata,
      
      /**
       * End the timer and log the results
       * @param {Object} additionalMetadata - Additional metadata to include in the end log
       * @returns {number} Duration in milliseconds
       */
      end: (additionalMetadata = {}) => {
        return this.endTimer(operation, startTime, startTimestamp, {
          ...metadata,
          ...additionalMetadata
        });
      }
    };
  }
  
  /**
   * End a timer and log performance data
   * @param {string} operation - Name of the operation
   * @param {bigint} startTime - Start time from process.hrtime.bigint()
   * @param {string} startTimestamp - ISO timestamp when operation started
   * @param {Object} metadata - Additional metadata
   * @returns {number} Duration in milliseconds
   */
  static endTimer(operation, startTime, startTimestamp, metadata = {}) {
    const endTime = process.hrtime.bigint();
    const endTimestamp = new Date().toISOString();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1000000; // Convert nanoseconds to milliseconds
    
    const logData = {
      operation,
      startTimestamp,
      endTimestamp,
      duration_ms: Math.round(durationMs * 100) / 100, // Round to 2 decimal places
      duration_ns: Number(durationNs),
      ...metadata
    };
    
    // Determine log level based on duration
    const slowThreshold = config.categories.performance.slowQueryThreshold;
    const isSlowOperation = durationMs > slowThreshold;
    
    if (isSlowOperation) {
      performance.warn('Slow operation detected', {
        ...logData,
        threshold_ms: slowThreshold,
        slow_operation: true
      });
    } else {
      performance.info('Operation completed', logData);
    }
    
    return durationMs;
  }
  
  /**
   * Decorator function to automatically time method calls
   * @param {string} operationName - Name for the operation (defaults to method name)
   * @returns {Function} Decorator function
   */
  static timeMethod(operationName) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      const operation = operationName || `${target.constructor.name}.${propertyKey}`;
      
      descriptor.value = async function(...args) {
        const timer = PerformanceLogger.startTimer(operation, {
          method: propertyKey,
          class: target.constructor.name,
          args_count: args.length
        });
        
        try {
          const result = await originalMethod.apply(this, args);
          timer.end({ success: true });
          return result;
        } catch (error) {
          timer.end({ 
            success: false, 
            error: error.message,
            error_name: error.name 
          });
          throw error;
        }
      };
      
      return descriptor;
    };
  }
  
  /**
   * Time a database query
   * @param {string} queryType - Type of query (find, insert, update, delete, etc.)
   * @param {string} collection - Collection name
   * @param {Object} queryData - Query parameters
   * @param {Function} queryFunction - Function that executes the query
   * @returns {Promise} Query result
   */
  static async timeQuery(queryType, collection, queryData, queryFunction) {
    const timer = this.startTimer(`db_${queryType}`, {
      query_type: queryType,
      collection,
      query_data: config.categories.database.logQueries ? queryData : '[hidden]'
    });
    
    try {
      const result = await queryFunction();
      
      // Log additional database metrics
      const endMetadata = {
        success: true,
        result_count: Array.isArray(result) ? result.length : (result ? 1 : 0)
      };
      
      timer.end(endMetadata);
      
      // Also log to database logger
      if (config.categories.database.enabled) {
        database.debug('Database query completed', {
          query_type: queryType,
          collection,
          duration_ms: timer.end(endMetadata),
          ...endMetadata
        });
      }
      
      return result;
    } catch (error) {
      timer.end({ 
        success: false, 
        error: error.message,
        error_code: error.code 
      });
      
      // Log database error
      if (config.categories.database.enabled) {
        database.error('Database query failed', {
          query_type: queryType,
          collection,
          error: error.message,
          error_code: error.code,
          stack: error.stack
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Time an API request
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {Function} requestFunction - Function that handles the request
   * @returns {Promise} Request result
   */
  static async timeRequest(method, path, requestFunction) {
    const timer = this.startTimer(`api_${method.toLowerCase()}`, {
      http_method: method,
      path,
      request_type: 'api'
    });
    
    try {
      const result = await requestFunction();
      timer.end({ 
        success: true,
        status_code: result?.status || 200
      });
      return result;
    } catch (error) {
      timer.end({ 
        success: false, 
        error: error.message,
        status_code: error.status || error.statusCode || 500
      });
      throw error;
    }
  }
  
  /**
   * Get performance statistics for an operation
   * @param {string} operation - Operation name to get stats for
   * @param {number} timeWindowMs - Time window in milliseconds (default 1 hour)
   * @returns {Object} Performance statistics
   */
  static getOperationStats(operation, timeWindowMs = 3600000) {
    // This would typically query log files or a metrics database
    // For now, return a placeholder structure
    return {
      operation,
      timeWindow: timeWindowMs,
      totalCalls: 0,
      averageDuration: 0,
      slowCalls: 0,
      errorRate: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = PerformanceLogger; 