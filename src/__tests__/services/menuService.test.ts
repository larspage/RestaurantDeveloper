/// <reference types="jest" />
import menuService from '../../services/menuService';
import api from '../../services/api';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Define types for mocking
type MockResponse<T> = {
  data: T;
};

// Mock the API module
jest.mock('../../services/api');

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => null),
    removeItem: jest.fn(() => null),
  },
  writable: true
});

describe('menuService', () => {
  const mockRestaurantId = 'test-restaurant-id';
  const mockSectionId = 'test-section-id';
  const mockItemId = 'test-item-id';
  
  const mockMenu = {
    _id: 'test-menu-id',
    restaurant: mockRestaurantId,
    name: 'Test Menu',
    sections: [
      {
        _id: mockSectionId,
        name: 'Appetizers',
        description: 'Start your meal right',
        items: [
          {
            _id: mockItemId,
            name: 'Mozzarella Sticks',
            description: 'Crispy outside, gooey inside',
            price: 8.99,
            category: 'Fried',
            available: true,
          },
        ],
      },
    ],
    active: true,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('getRestaurantMenu should fetch menu data', async () => {
    // Mock API response
    jest.spyOn(api, 'get').mockResolvedValue({ data: mockMenu });
    
    // Call the service
    const result = await menuService.getRestaurantMenu(mockRestaurantId);
    
    // Verify API was called correctly
    expect(api.get).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`);
    
    // Verify result
    expect(result).toEqual(mockMenu);
  });
  
  it('getRestaurantMenu should handle API errors', async () => {
    // Mock API error response
    const errorMessage = 'Network error';
    jest.spyOn(api, 'get').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.getRestaurantMenu(mockRestaurantId))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.get).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`);
  });
  
  it('createOrUpdateMenu should update menu data', async () => {
    // Mock API response
    jest.spyOn(api, 'post').mockResolvedValue({ data: mockMenu });
    
    // Call the service
    const result = await menuService.createOrUpdateMenu(mockRestaurantId, mockMenu);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`, mockMenu);
    
    // Verify result
    expect(result).toEqual(mockMenu);
  });
  
  it('createOrUpdateMenu should handle API errors', async () => {
    // Mock API error response
    const errorMessage = 'Failed to update menu';
    jest.spyOn(api, 'post').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.createOrUpdateMenu(mockRestaurantId, mockMenu))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`, mockMenu);
  });
  
  it('addOrUpdateSection should add a section to the menu', async () => {
    const newSection = {
      name: 'Desserts',
      description: 'Sweet treats',
      items: [],
    };
    
    // Mock API response
    const updatedMenu = {
      ...mockMenu,
      sections: [...mockMenu.sections, { _id: 'new-section-id', ...newSection }],
    };
    jest.spyOn(api, 'post').mockResolvedValue({ data: updatedMenu });
    
    // Call the service
    const result = await menuService.addOrUpdateSection(mockRestaurantId, newSection);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, newSection);
    
    // Verify result
    expect(result).toEqual(updatedMenu);
  });
  
  it('addOrUpdateSection should update an existing section', async () => {
    const updatedSection = {
      _id: mockSectionId,
      name: 'Updated Appetizers',
      description: 'Start your meal with these delicious options',
      items: mockMenu.sections[0].items,
    };
    
    // Mock API response
    const updatedMenu = {
      ...mockMenu,
      sections: [updatedSection],
    };
    jest.spyOn(api, 'post').mockResolvedValue({ data: updatedMenu });
    
    // Call the service
    const result = await menuService.addOrUpdateSection(mockRestaurantId, updatedSection);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, updatedSection);
    
    // Verify result
    expect(result).toEqual(updatedMenu);
    expect(result.sections[0].name).toEqual('Updated Appetizers');
  });
  
  it('addOrUpdateSection should handle API errors', async () => {
    const newSection = {
      name: 'Desserts',
      description: 'Sweet treats',
      items: [],
    };
    
    // Mock API error response
    const errorMessage = 'Failed to add section';
    jest.spyOn(api, 'post').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.addOrUpdateSection(mockRestaurantId, newSection))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, newSection);
  });
  
  it('updateSectionOrder should reorder menu sections', async () => {
    // Create a menu with multiple sections
    const multiSectionMenu = {
      ...mockMenu,
      sections: [
        { _id: 'section1', name: 'Appetizers', description: 'Start your meal right', items: [] },
        { _id: 'section2', name: 'Entrees', description: 'Main dishes', items: [] },
        { _id: 'section3', name: 'Desserts', description: 'Sweet treats', items: [] },
      ]
    };
    
    // Define the new order
    const newOrder = ['section2', 'section3', 'section1'];
    
    // Mock API response with reordered sections
    const reorderedMenu = {
      ...multiSectionMenu,
      sections: [
        { _id: 'section2', name: 'Entrees', description: 'Main dishes', items: [], order: 0 },
        { _id: 'section3', name: 'Desserts', description: 'Sweet treats', items: [], order: 1 },
        { _id: 'section1', name: 'Appetizers', description: 'Start your meal right', items: [], order: 2 },
      ]
    };
    
    jest.spyOn(api, 'put').mockResolvedValue({ data: reorderedMenu });
    
    // Call the service
    const result = await menuService.updateSectionOrder(mockRestaurantId, newOrder);
    
    // Verify API was called correctly
    expect(api.put).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/order`, 
      { sectionIds: newOrder }
    );
    
    // Verify result
    expect(result).toEqual(reorderedMenu);
    expect(result.sections[0]._id).toEqual('section2');
    expect(result.sections[1]._id).toEqual('section3');
    expect(result.sections[2]._id).toEqual('section1');
  });
  
  it('updateSectionOrder should handle API errors', async () => {
    const sectionIds = ['section1', 'section2', 'section3'];
    
    // Mock API error response
    const errorMessage = 'Failed to update section order';
    jest.spyOn(api, 'put').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.updateSectionOrder(mockRestaurantId, sectionIds))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.put).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/order`, 
      { sectionIds }
    );
  });
  
  it('updateSectionOrder should validate input parameters', async () => {
    // Test with empty array
    await expect(menuService.updateSectionOrder(mockRestaurantId, []))
      .rejects
      .toThrow('Section IDs array is required');
    
    // Test with null
    await expect(menuService.updateSectionOrder(mockRestaurantId, null as any))
      .rejects
      .toThrow('Section IDs array is required');
    
    // Test with empty restaurant ID
    await expect(menuService.updateSectionOrder('', ['section1']))
      .rejects
      .toThrow('Restaurant ID is required');
  });
  
  it('deleteSection should remove a section from the menu', async () => {
    // Mock API response
    jest.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    
    // Call the service
    await menuService.deleteSection(mockRestaurantId, mockSectionId);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/${mockSectionId}`);
  });
  
  it('deleteSection should handle API errors', async () => {
    // Mock API error response
    const errorMessage = 'Failed to delete section';
    jest.spyOn(api, 'delete').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.deleteSection(mockRestaurantId, mockSectionId))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/${mockSectionId}`);
  });
  
  it('addOrUpdateItem should add an item to a section', async () => {
    const newItem = {
      name: 'Chocolate Cake',
      description: 'Rich and decadent',
      price: 6.99,
      category: 'Dessert',
      available: true,
    };
    
    // Mock API response
    const addedItem = { _id: 'new-item-id', ...newItem };
    jest.spyOn(api, 'post').mockResolvedValue({ data: addedItem });
    
    // Call the service
    const result = await menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, newItem);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
      newItem
    );
    
    // Verify result
    expect(result).toEqual(addedItem);
  });
  
  it('addOrUpdateItem should update an existing item', async () => {
    const updatedItem = {
      _id: mockItemId,
      name: 'Updated Mozzarella Sticks',
      description: 'Even crispier outside, even gooier inside',
      price: 9.99,
      category: 'Fried',
      available: true,
    };
    
    // Mock API response
    jest.spyOn(api, 'post').mockResolvedValue({ data: updatedItem });
    
    // Call the service
    const result = await menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, updatedItem);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
      updatedItem
    );
    
    // Verify result
    expect(result).toEqual(updatedItem);
    expect(result.name).toEqual('Updated Mozzarella Sticks');
    expect(result.price).toEqual(9.99);
  });
  
  it('addOrUpdateItem should handle API errors', async () => {
    const newItem = {
      name: 'Chocolate Cake',
      description: 'Rich and decadent',
      price: 6.99,
      category: 'Dessert',
      available: true,
    };
    
    // Mock API error response
    const errorMessage = 'Failed to add item';
    jest.spyOn(api, 'post').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, newItem))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
      newItem
    );
  });
  
  it('deleteItem should remove an item from a section', async () => {
    // Mock API response
    jest.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    
    // Call the service
    await menuService.deleteItem(mockRestaurantId, mockSectionId, mockItemId);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}`
    );
  });
  
  it('deleteItem should handle API errors', async () => {
    // Mock API error response
    const errorMessage = 'Failed to delete item';
    jest.spyOn(api, 'delete').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.deleteItem(mockRestaurantId, mockSectionId, mockItemId))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}`
    );
  });
  
  it('uploadItemImage should upload an image file and return the image URL', async () => {
    // Mock image file
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Mock API response
    const mockImageUrl = 'https://example.com/images/test-image.jpg';
    jest.spyOn(api, 'post').mockImplementation((url, data, config) => {
      // Manually trigger the progress callback if provided
      if (config && typeof config.onUploadProgress === 'function') {
        // Create a progress event with required properties
        const progressEvent = {
          loaded: 50,
          total: 100,
          bytes: 50,
          lengthComputable: true
        };
        config.onUploadProgress(progressEvent);
      }
      return Promise.resolve({ data: { imageUrl: mockImageUrl } });
    });
    
    // Create a mock progress callback
    const mockProgressCallback = jest.fn();
    
    // Call the service
    const result = await menuService.uploadItemImage(
      mockRestaurantId, 
      mockSectionId, 
      mockItemId, 
      mockFile,
      mockProgressCallback
    );
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}/image`,
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: expect.any(Function)
      })
    );
    
    // Verify result
    expect(result).toEqual(mockImageUrl);
    
    // Verify progress callback was called with correct percentage
    expect(mockProgressCallback).toHaveBeenCalledWith(50);
  });
  
  it('uploadItemImage should handle API errors', async () => {
    // Mock image file
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Mock API error response
    const errorMessage = 'Failed to upload image';
    jest.spyOn(api, 'post').mockRejectedValue(new Error(errorMessage));
    
    // Call the service and expect it to throw
    await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, mockItemId, mockFile))
      .rejects
      .toThrow(errorMessage);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}/image`,
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: expect.any(Function)
      })
    );
  });
  
  it('uploadItemImage should validate input parameters', async () => {
    // Mock image file
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Test with empty restaurant ID
    await expect(menuService.uploadItemImage('', mockSectionId, mockItemId, mockFile))
      .rejects
      .toThrow('Restaurant ID is required');
    
    // Test with empty section ID
    await expect(menuService.uploadItemImage(mockRestaurantId, '', mockItemId, mockFile))
      .rejects
      .toThrow('Section ID is required');
    
    // Test with empty item ID
    await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, '', mockFile))
      .rejects
      .toThrow('Item ID is required');
    
    // Test with null file
    await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, mockItemId, null as any))
      .rejects
      .toThrow('Image file is required');
  });
  
  it('importMenuFromJson should call createOrUpdateMenu', async () => {
    // Create a spy on createOrUpdateMenu
    const spy = jest.spyOn(menuService, 'createOrUpdateMenu');
    spy.mockResolvedValue(mockMenu);
    
    const jsonData = {
      name: 'Imported Menu',
      sections: [
        {
          name: 'Desserts',
          description: 'Sweet treats',
          items: [
            {
              name: 'Chocolate Cake',
              description: 'Rich and decadent',
              price: 6.99,
              category: 'Dessert',
              available: true,
            },
          ],
        },
      ],
    };
    
    // Call the service
    const result = await menuService.importMenuFromJson(mockRestaurantId, jsonData);
    
    // Verify createOrUpdateMenu was called correctly
    expect(spy).toHaveBeenCalledWith(mockRestaurantId, jsonData);
    
    // Verify result
    expect(result).toEqual(mockMenu);
    
    // Restore the original implementation
    spy.mockRestore();
  });
  
  it('importMenuFromJson should handle invalid JSON data', async () => {
    // Create a spy on createOrUpdateMenu that isn't called
    // because validation will fail before it's called
    const spy = jest.spyOn(menuService, 'createOrUpdateMenu');
    
    const invalidJsonData = {
      // Missing required fields
      sections: []
    };
    
    // Call the service and expect it to throw
    await expect(menuService.importMenuFromJson(mockRestaurantId, invalidJsonData))
      .rejects
      .toThrow('Invalid menu format');
    
    // Verify createOrUpdateMenu was NOT called since validation failed
    expect(spy).not.toHaveBeenCalled();
    
    // Restore the original implementation
    spy.mockRestore();
  });
  
  it('should handle empty restaurant ID for all methods', async () => {
    const emptyId = '';
    
    // Test each method with empty ID
    await expect(menuService.getRestaurantMenu(emptyId))
      .rejects
      .toThrow();
      
    await expect(menuService.createOrUpdateMenu(emptyId, mockMenu))
      .rejects
      .toThrow();
      
    await expect(menuService.addOrUpdateSection(emptyId, { name: 'Test', description: '', items: [] }))
      .rejects
      .toThrow();
      
    await expect(menuService.deleteSection(emptyId, mockSectionId))
      .rejects
      .toThrow();
      
    await expect(menuService.addOrUpdateItem(emptyId, mockSectionId, { name: 'Test', description: '', price: 1, category: '', available: true }))
      .rejects
      .toThrow();
      
    await expect(menuService.deleteItem(emptyId, mockSectionId, mockItemId))
      .rejects
      .toThrow();
      
    await expect(menuService.importMenuFromJson(emptyId, { name: 'Test', sections: [] }))
      .rejects
      .toThrow();
      
    await expect(menuService.updateSectionOrder(emptyId, ['section1']))
      .rejects
      .toThrow();
      
    // Test new uploadItemImage method with empty ID
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    await expect(menuService.uploadItemImage(emptyId, mockSectionId, mockItemId, mockFile))
      .rejects
      .toThrow();
  });
}); 