/// <reference types="jest" />
import '@testing-library/jest-dom';
import restaurantService, { Restaurant, RestaurantFormData } from '../../services/restaurantService';

// Mock the api module
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

// Import the mocked api
import api from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

describe('restaurantService', () => {
  const mockRestaurantId = 'restaurant-123';
  
  const mockRestaurant: Restaurant = {
    _id: mockRestaurantId,
    name: 'Test Restaurant',
    description: 'A test restaurant',
    location: '123 Main St, Test City, CA, 12345, USA',
    cuisine: 'Italian',
    status: 'active',
    owner: 'owner-123',
    theme: 'modern',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockRestaurantFormData: RestaurantFormData = {
    name: 'Test Restaurant',
    description: 'A test restaurant with contact info\n\nPhone: 555-123-4567\nFax: 555-123-4568',
    location: '123 Main St, Test City, CA, 12345, USA',
    cuisine: 'Italian',
    theme: 'modern',
  };

  // Store original console.error to restore after tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error during error handling tests
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  describe('getUserRestaurants', () => {
    it('should fetch user restaurants successfully', async () => {
      const mockRestaurants = [mockRestaurant];
      mockApi.get.mockResolvedValue({ data: mockRestaurants });
      
      const result = await restaurantService.getUserRestaurants();
      
      expect(mockApi.get).toHaveBeenCalledWith('/restaurants/user');
      expect(result).toEqual(mockRestaurants);
    });
    
    it('should handle API errors when fetching user restaurants', async () => {
      const mockError = new Error('Failed to fetch restaurants');
      mockApi.get.mockRejectedValue(mockError);
      
      await expect(restaurantService.getUserRestaurants()).rejects.toThrow('Failed to fetch restaurants');
      expect(mockApi.get).toHaveBeenCalledWith('/restaurants/user');
    });

    it('should handle empty restaurant list', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      
      const result = await restaurantService.getUserRestaurants();
      
      expect(mockApi.get).toHaveBeenCalledWith('/restaurants/user');
      expect(result).toEqual([]);
    });
  });
  
  describe('getRestaurant', () => {
    it('should fetch a single restaurant successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockRestaurant });
      
      const result = await restaurantService.getRestaurant(mockRestaurantId);
      
      expect(mockApi.get).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`);
      expect(result).toEqual(mockRestaurant);
    });
    
    it('should handle API errors when fetching a single restaurant', async () => {
      const mockError = new Error('Restaurant not found');
      mockApi.get.mockRejectedValue(mockError);
      
      await expect(restaurantService.getRestaurant(mockRestaurantId)).rejects.toThrow('Restaurant not found');
      expect(mockApi.get).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`);
    });

    it('should handle 404 errors for non-existent restaurants', async () => {
      const mockError = { response: { status: 404 } };
      mockApi.get.mockRejectedValue(mockError);
      
      await expect(restaurantService.getRestaurant('non-existent-id')).rejects.toEqual(mockError);
      expect(mockApi.get).toHaveBeenCalledWith('/restaurants/non-existent-id');
    });
  });
  
  describe('createRestaurant', () => {
    it('should create a new restaurant successfully with structured address', async () => {
      const mockCreatedRestaurant = { ...mockRestaurant, _id: 'new-restaurant-id' };
      mockApi.post.mockResolvedValue({ data: mockCreatedRestaurant });
      
      const result = await restaurantService.createRestaurant(mockRestaurantFormData);
      
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', mockRestaurantFormData);
      expect(result).toEqual(mockCreatedRestaurant);
    });
    
    it('should handle API errors when creating a restaurant', async () => {
      const mockError = new Error('Failed to create restaurant');
      mockApi.post.mockRejectedValue(mockError);
      
      await expect(restaurantService.createRestaurant(mockRestaurantFormData)).rejects.toThrow('Failed to create restaurant');
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', mockRestaurantFormData);
    });

    it('should handle validation errors during restaurant creation', async () => {
      const mockError = { 
        response: { 
          status: 400, 
          data: { message: 'Name is required' } 
        } 
      };
      mockApi.post.mockRejectedValue(mockError);
      
      const invalidData = { ...mockRestaurantFormData, name: '' };
      
      await expect(restaurantService.createRestaurant(invalidData)).rejects.toEqual(mockError);
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', invalidData);
    });

    it('should handle minimum required fields for restaurant creation', async () => {
      const minimalData: RestaurantFormData = {
        name: 'Minimal Restaurant',
        description: 'Minimal description',
        location: '123 Simple St, Simple City, CA, 12345, USA',
        cuisine: 'American',
      };
      
      const mockCreatedRestaurant = { ...mockRestaurant, ...minimalData };
      mockApi.post.mockResolvedValue({ data: mockCreatedRestaurant });
      
      const result = await restaurantService.createRestaurant(minimalData);
      
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', minimalData);
      expect(result).toEqual(mockCreatedRestaurant);
    });

    it('should handle restaurant creation with contact information in description', async () => {
      const dataWithContact: RestaurantFormData = {
        name: 'Contact Restaurant',
        description: 'A restaurant with contact info\n\nPhone: 555-123-4567\nFax: 555-123-4568',
        location: '456 Contact Ave, Contact City, NY, 54321, USA',
        cuisine: 'Mexican',
        theme: 'vibrant',
      };
      
      const mockCreatedRestaurant = { ...mockRestaurant, ...dataWithContact };
      mockApi.post.mockResolvedValue({ data: mockCreatedRestaurant });
      
      const result = await restaurantService.createRestaurant(dataWithContact);
      
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', dataWithContact);
      expect(result).toEqual(mockCreatedRestaurant);
      expect(result.description).toContain('Phone: 555-123-4567');
      expect(result.description).toContain('Fax: 555-123-4568');
    });

    it('should handle custom cuisine type', async () => {
      const customCuisineData: RestaurantFormData = {
        name: 'Custom Cuisine Restaurant',
        description: 'A restaurant with custom cuisine',
        location: '789 Custom St, Custom City, TX, 67890, USA',
        cuisine: 'Fusion-Mediterranean',
        theme: 'elegant',
      };
      
      const mockCreatedRestaurant = { ...mockRestaurant, ...customCuisineData };
      mockApi.post.mockResolvedValue({ data: mockCreatedRestaurant });
      
      const result = await restaurantService.createRestaurant(customCuisineData);
      
      expect(mockApi.post).toHaveBeenCalledWith('/restaurants', customCuisineData);
      expect(result).toEqual(mockCreatedRestaurant);
      expect(result.cuisine).toBe('Fusion-Mediterranean');
    });
  });
  
  describe('updateRestaurant', () => {
    it('should update an existing restaurant successfully', async () => {
      const updateData = { name: 'Updated Restaurant Name' };
      const mockUpdatedRestaurant = { ...mockRestaurant, ...updateData };
      mockApi.put.mockResolvedValue({ data: mockUpdatedRestaurant });
      
      const result = await restaurantService.updateRestaurant(mockRestaurantId, updateData);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`, updateData);
      expect(result).toEqual(mockUpdatedRestaurant);
    });
    
    it('should handle API errors when updating a restaurant', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('Failed to update restaurant');
      mockApi.put.mockRejectedValue(mockError);
      
      await expect(restaurantService.updateRestaurant(mockRestaurantId, updateData)).rejects.toThrow('Failed to update restaurant');
      expect(mockApi.put).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`, updateData);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { description: 'Updated description only' };
      const mockUpdatedRestaurant = { ...mockRestaurant, ...partialUpdate };
      mockApi.put.mockResolvedValue({ data: mockUpdatedRestaurant });
      
      const result = await restaurantService.updateRestaurant(mockRestaurantId, partialUpdate);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`, partialUpdate);
      expect(result).toEqual(mockUpdatedRestaurant);
    });

    it('should handle location updates with structured address', async () => {
      const locationUpdate = { location: '999 New St, New City, FL, 99999, USA' };
      const mockUpdatedRestaurant = { ...mockRestaurant, ...locationUpdate };
      mockApi.put.mockResolvedValue({ data: mockUpdatedRestaurant });
      
      const result = await restaurantService.updateRestaurant(mockRestaurantId, locationUpdate);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`, locationUpdate);
      expect(result).toEqual(mockUpdatedRestaurant);
      expect(result.location).toBe('999 New St, New City, FL, 99999, USA');
    });

    it('should handle empty update data', async () => {
      const emptyUpdate = {};
      mockApi.put.mockResolvedValue({ data: mockRestaurant });
      
      const result = await restaurantService.updateRestaurant(mockRestaurantId, emptyUpdate);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`, emptyUpdate);
      expect(result).toEqual(mockRestaurant);
    });

    it('should handle 404 errors for non-existent restaurants during update', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = { response: { status: 404 } };
      mockApi.put.mockRejectedValue(mockError);
      
      await expect(restaurantService.updateRestaurant('non-existent-id', updateData)).rejects.toEqual(mockError);
      expect(mockApi.put).toHaveBeenCalledWith('/restaurants/non-existent-id', updateData);
    });
  });
  
  describe('deleteRestaurant', () => {
    it('should delete a restaurant successfully', async () => {
      const mockDeleteResponse = { message: 'Restaurant deleted successfully' };
      mockApi.delete.mockResolvedValue({ data: mockDeleteResponse });
      
      const result = await restaurantService.deleteRestaurant(mockRestaurantId);
      
      expect(mockApi.delete).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`);
      expect(result).toEqual(mockDeleteResponse);
    });
    
    it('should handle API errors when deleting a restaurant', async () => {
      const mockError = new Error('Failed to delete restaurant');
      mockApi.delete.mockRejectedValue(mockError);
      
      await expect(restaurantService.deleteRestaurant(mockRestaurantId)).rejects.toThrow('Failed to delete restaurant');
      expect(mockApi.delete).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`);
    });

    it('should handle 404 errors for non-existent restaurants during deletion', async () => {
      const mockError = { response: { status: 404 } };
      mockApi.delete.mockRejectedValue(mockError);
      
      await expect(restaurantService.deleteRestaurant('non-existent-id')).rejects.toEqual(mockError);
      expect(mockApi.delete).toHaveBeenCalledWith('/restaurants/non-existent-id');
    });

    it('should handle 403 errors for unauthorized deletion attempts', async () => {
      const mockError = { response: { status: 403 } };
      mockApi.delete.mockRejectedValue(mockError);
      
      await expect(restaurantService.deleteRestaurant(mockRestaurantId)).rejects.toEqual(mockError);
      expect(mockApi.delete).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}`);
    });
  });

  describe('updateRestaurantSettings', () => {
    it('should update restaurant settings successfully', async () => {
      const mockSettings = { theme: 'dark', notifications: true };
      const mockResponse = { message: 'Settings updated successfully', settings: mockSettings };
      mockApi.patch.mockResolvedValue({ data: mockResponse });
      
      const result = await restaurantService.updateRestaurantSettings(mockRestaurantId, mockSettings);
      
      expect(mockApi.patch).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}/settings`, { settings: mockSettings });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors when updating restaurant settings', async () => {
      const mockSettings = { theme: 'dark' };
      const mockError = new Error('Failed to update settings');
      mockApi.patch.mockRejectedValue(mockError);
      
      await expect(restaurantService.updateRestaurantSettings(mockRestaurantId, mockSettings)).rejects.toThrow('Failed to update restaurant settings');
      expect(mockApi.patch).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}/settings`, { settings: mockSettings });
    });

    it('should handle 404 errors for non-existent restaurants during settings update', async () => {
      const mockSettings = { theme: 'light' };
      const mockError = { response: { status: 404, data: { message: 'Restaurant not found' } } };
      mockApi.patch.mockRejectedValue(mockError);
      
      await expect(restaurantService.updateRestaurantSettings('non-existent-id', mockSettings)).rejects.toThrow('Restaurant not found');
      expect(mockApi.patch).toHaveBeenCalledWith('/restaurants/non-existent-id/settings', { settings: mockSettings });
    });

    it('should handle empty settings update', async () => {
      const mockSettings = {};
      const mockResponse = { message: 'Settings updated successfully', settings: mockSettings };
      mockApi.patch.mockResolvedValue({ data: mockResponse });
      
      const result = await restaurantService.updateRestaurantSettings(mockRestaurantId, mockSettings);
      
      expect(mockApi.patch).toHaveBeenCalledWith(`/restaurants/${mockRestaurantId}/settings`, { settings: mockSettings });
      expect(result).toEqual(mockResponse);
    });
  });
}); 