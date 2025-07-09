/// <reference types="jest" />
import '@testing-library/jest-dom';
import authService, { User, LoginCredentials, RegisterData } from '../../services/authService';

// Mock the api module
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

// Import the mocked api
import api from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe('authService', () => {
  const mockUser: User = {
    _id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockLoginCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisterData: RegisterData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
  };

  const mockToken = 'mock-jwt-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('login', () => {
    it('should login user successfully and store token', async () => {
      const mockResponse = {
        token: mockToken,
        user: mockUser,
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await authService.login(mockLoginCredentials);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', mockLoginCredentials);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(result).toEqual(mockResponse);
    });

    it('should handle login without token in response', async () => {
      const mockResponse = {
        user: mockUser,
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await authService.login(mockLoginCredentials);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle login API errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Invalid credentials');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', mockLoginCredentials);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid email or password' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginCredentials)).rejects.toEqual(mockError);
    });

    it('should handle 422 validation errors', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { message: 'Email is required' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginCredentials)).rejects.toEqual(mockError);
    });

    it('should handle network errors', async () => {
      const mockError = { code: 'ECONNABORTED', message: 'Network Error' };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginCredentials)).rejects.toEqual(mockError);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        message: 'User registered successfully',
        user: mockUser,
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await authService.register(mockRegisterData);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', mockRegisterData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration without role', async () => {
      const registerDataWithoutRole = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        message: 'User registered successfully',
        user: mockUser,
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await authService.register(registerDataWithoutRole);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', registerDataWithoutRole);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration API errors', async () => {
      const mockError = new Error('Registration failed');
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.register(mockRegisterData)).rejects.toThrow('Registration failed');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', mockRegisterData);
    });

    it('should handle email already exists error', async () => {
      const mockError = {
        response: {
          status: 409,
          data: { message: 'Email already exists' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.register(mockRegisterData)).rejects.toEqual(mockError);
    });

    it('should handle validation errors during registration', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Password must be at least 6 characters' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.register(mockRegisterData)).rejects.toEqual(mockError);
    });
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle logout when localStorage is empty', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {});

      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = authService.getCurrentUser();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
      expect(result).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      expect(() => authService.getCurrentUser()).toThrow();
    });

    it('should return null for empty string in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = authService.isLoggedIn();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isLoggedIn();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(false);
    });

    it('should return false for empty token', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = authService.isLoggedIn();

      expect(result).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => authService.isLoggedIn()).toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getUserProfile();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors when fetching profile', async () => {
      const mockError = new Error('Failed to fetch profile');
      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getUserProfile()).rejects.toThrow('Failed to fetch profile');
      expect(mockApi.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should handle 401 unauthorized when fetching profile', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getUserProfile()).rejects.toEqual(mockError);
    });

    it('should handle 404 user not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };
      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getUserProfile()).rejects.toEqual(mockError);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      const mockResponse = { user: updatedUser };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await authService.updateProfile(updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
      expect(result).toEqual(mockResponse);
    });

    it('should handle update profile without user in response', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { message: 'Profile updated' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await authService.updateProfile(updateData);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial profile updates', async () => {
      const updateData = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };
      const mockResponse = { user: updatedUser };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await authService.updateProfile(updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors when updating profile', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('Failed to update profile');
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData)).rejects.toThrow('Failed to update profile');
      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle validation errors during profile update', async () => {
      const updateData = { email: 'invalid-email' };
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid email format' }
        }
      };
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData)).rejects.toEqual(mockError);
    });

    it('should handle empty update data', async () => {
      const updateData = {};
      const mockResponse = { user: mockUser };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await authService.updateProfile(updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const mockResponse = { message: 'Password changed successfully' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await authService.changePassword(oldPassword, newPassword);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/change-password', {
        oldPassword,
        newPassword
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle incorrect old password', async () => {
      const oldPassword = 'wrongpassword';
      const newPassword = 'newpassword123';
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Current password is incorrect' }
        }
      };
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.changePassword(oldPassword, newPassword)).rejects.toEqual(mockError);
    });

    it('should handle weak new password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = '123';
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Password must be at least 6 characters' }
        }
      };
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.changePassword(oldPassword, newPassword)).rejects.toEqual(mockError);
    });

    it('should handle API errors when changing password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const mockError = new Error('Failed to change password');
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.changePassword(oldPassword, newPassword)).rejects.toThrow('Failed to change password');
    });

    it('should handle 401 unauthorized when changing password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.changePassword(oldPassword, newPassword)).rejects.toEqual(mockError);
    });

    it('should handle same old and new password', async () => {
      const password = 'samepassword123';
      const mockError = {
        response: {
          status: 400,
          data: { message: 'New password must be different from current password' }
        }
      };
      mockApi.put.mockRejectedValue(mockError);

      await expect(authService.changePassword(password, password)).rejects.toEqual(mockError);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockError = { code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' };
      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginCredentials)).rejects.toEqual(mockError);
    });

    it('should handle server errors (500)', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getUserProfile()).rejects.toEqual(mockError);
    });

    it('should handle malformed API responses', async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const result = await authService.getUserProfile();

      expect(result).toBeNull();
    });

    it('should handle corrupted user data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('{"corrupted": json}');

      expect(() => authService.getCurrentUser()).toThrow();
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(10000);
      mockLocalStorage.getItem.mockReturnValue(longToken);

      const result = authService.isLoggedIn();

      expect(result).toBe(true);
    });
  });
}); 