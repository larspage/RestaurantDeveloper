/// <reference types="jest" />
import '@testing-library/jest-dom';

// Mock axios before importing api
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

import axios from 'axios';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.location
const mockLocation = {
  href: '',
};

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('API Service', () => {
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    
    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Reset location href
    mockLocation.href = '';
    
    // Create mock axios instance
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };
    
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('API Instance Configuration', () => {
    it('should create axios instance with correct default config', () => {
      // Set environment variable
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3550';
      
      // Import api to trigger axios.create
      require('../../services/api');
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3550',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use fallback baseURL when environment variable is not set', () => {
      // Remove environment variable
      delete process.env.NEXT_PUBLIC_API_URL;
      
      // Clear module cache and re-import
      jest.resetModules();
      require('../../services/api');
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3550',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      // Clear modules and re-import to get fresh instance
      jest.resetModules();
      require('../../services/api');
      
      // Get the request interceptor function
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('should add authorization header when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const config = {
        method: 'GET',
        url: '/test',
        headers: {},
        baseURL: 'http://localhost:3550',
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should not add authorization header when token does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const config = {
        method: 'GET',
        url: '/test',
        headers: {},
        baseURL: 'http://localhost:3550',
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should use dev token for dev restaurant URLs in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const config = {
        method: 'GET',
        url: '/restaurants/dev-restaurant-123',
        headers: {},
        baseURL: 'http://localhost:3550',
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer dev-mock-token');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should log request details in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const config = {
        method: 'post',
        url: '/test',
        data: { test: 'data' },
        headers: { 'Content-Type': 'application/json' },
        baseURL: 'http://localhost:3550',
      };

      requestInterceptor(config);

      expect(console.log).toHaveBeenCalledWith('API Request:', {
        method: 'POST',
        url: 'http://localhost:3550/test',
        data: { test: 'data' },
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log request details in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const config = {
        method: 'GET',
        url: '/test',
        headers: {},
        baseURL: 'http://localhost:3550',
      };

      requestInterceptor(config);

      expect(console.log).not.toHaveBeenCalled();
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Response Interceptor', () => {
    let responseInterceptor: any;
    let errorInterceptor: any;

    beforeEach(() => {
      // Clear modules and re-import to get fresh instance
      jest.resetModules();
      require('../../services/api');
      
      // Get the response interceptor functions
      responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('should log successful responses in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const response = {
        status: 200,
        config: { url: '/test' },
        data: { success: true },
      };

      const result = responseInterceptor(response);

      expect(result).toBe(response);
      expect(console.log).toHaveBeenCalledWith('API Response:', {
        status: 200,
        url: '/test',
        data: { success: true },
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log responses in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = {
        status: 200,
        config: { url: '/test' },
        data: { success: true },
      };

      const result = responseInterceptor(response);

      expect(result).toBe(response);
      expect(console.log).not.toHaveBeenCalled();
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle 401 errors by clearing localStorage and redirecting', async () => {
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Token expired' },
          headers: {},
        },
        config: {
          url: '/test',
          method: 'GET',
        },
        message: 'Request failed with status code 401',
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });

    it('should log error details in development mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
          headers: {},
        },
        config: {
          url: '/test',
          method: 'GET',
        },
        message: 'Request failed with status code 500',
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(console.error).toHaveBeenCalledWith('API Error:', {
        message: 'Request failed with status code 500',
        status: 500,
        statusText: 'Internal Server Error',
        url: '/test',
        method: 'GET',
        data: { message: 'Server error' },
        headers: {},
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log error details in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
          headers: {},
        },
        config: {
          url: '/test',
          method: 'GET',
        },
        message: 'Request failed with status code 500',
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(console.error).not.toHaveBeenCalled();
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle errors without response object', async () => {
      const error = {
        message: 'Network Error',
        config: {
          url: '/test',
          method: 'GET',
        },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('');
    });

    it('should handle errors without config object', async () => {
      const error = {
        message: 'Network Error',
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    let errorInterceptor: any;

    beforeEach(() => {
      jest.resetModules();
      require('../../services/api');
      
      errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('should handle 401 errors even when localStorage is empty', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const error = {
        response: { status: 401 },
        config: { url: '/test', method: 'GET' },
        message: 'Unauthorized',
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });

    it('should handle multiple 401 errors gracefully', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/test', method: 'GET' },
        message: 'Unauthorized',
      };

      await expect(errorInterceptor(error)).rejects.toEqual(error);
      await expect(errorInterceptor(error)).rejects.toEqual(error);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(4); // 2 calls × 2 errors
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('Integration Tests', () => {
    it('should export the configured axios instance', () => {
      jest.resetModules();
      const apiInstance = require('../../services/api').default;
      expect(apiInstance).toBeDefined();
    });

    it('should have interceptors properly configured', () => {
      jest.resetModules();
      require('../../services/api');
      
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
      
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
}); 