/// <reference types="jest" />
import '@testing-library/jest-dom';
import menuService from '../../services/menuService';

// Mock the api module using Jest's mock factory
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Import the mocked api
import api from '../../services/api';
const mockApi = api as jest.Mocked<typeof api>;

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
  
  describe('getRestaurantMenu', () => {
    it('should fetch menu data', async () => {
      mockApi.get.mockResolvedValue({ data: mockMenu });
      
      const result = await menuService.getRestaurantMenu(mockRestaurantId);
      
      expect(mockApi.get).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`);
      expect(result).toEqual(mockMenu);
    });
    
    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.get.mockRejectedValue(mockError);
      
      await expect(menuService.getRestaurantMenu(mockRestaurantId)).rejects.toThrow('Network error');
    });
  });
  
  describe('createOrUpdateMenu', () => {
    it('should update menu data', async () => {
      const mockMenuData = {
        name: 'Updated Menu',
        sections: [],
      };
      
      const mockUpdatedMenu = {
        _id: 'test-menu-id',
        restaurant: mockRestaurantId,
        ...mockMenuData,
        active: true,
      };
      
      mockApi.post.mockResolvedValue({ data: mockUpdatedMenu });
      
      const result = await menuService.createOrUpdateMenu(mockRestaurantId, mockMenuData);
      
      expect(mockApi.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`, mockMenuData);
      expect(result).toEqual(mockUpdatedMenu);
    });
    
    it('should handle API errors', async () => {
      const mockMenuData = { name: 'Test Menu' };
      const mockError = new Error('Failed to update menu');
      mockApi.post.mockRejectedValue(mockError);
      
      await expect(menuService.createOrUpdateMenu(mockRestaurantId, mockMenuData)).rejects.toThrow('Failed to update menu');
    });
  });
  
  describe('addOrUpdateSection', () => {
    it('should add a section to the menu', async () => {
      const newSection = {
        name: 'Appetizers',
        description: 'Start your meal right',
        items: [],
      };
      
      const mockUpdatedMenu = {
        _id: 'test-menu-id',
        restaurant: mockRestaurantId,
        name: 'Test Menu',
        sections: [{ ...newSection, _id: 'new-section-id' }],
        active: true,
      };
      
      mockApi.post.mockResolvedValue({ data: mockUpdatedMenu });
      
      const result = await menuService.addOrUpdateSection(mockRestaurantId, newSection);
      
      expect(mockApi.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, newSection);
      expect(result).toEqual(mockUpdatedMenu);
    });
    
    it('should update an existing section', async () => {
      const existingSection = {
        _id: 'existing-section-id',
        name: 'Updated Appetizers',
        description: 'Updated description',
        items: [],
      };
      
      const mockUpdatedMenu = {
        _id: 'test-menu-id',
        restaurant: mockRestaurantId,
        name: 'Test Menu',
        sections: [existingSection],
        active: true,
      };
      
      mockApi.post.mockResolvedValue({ data: mockUpdatedMenu });
      
      const result = await menuService.addOrUpdateSection(mockRestaurantId, existingSection);
      
      expect(mockApi.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, existingSection);
      expect(result).toEqual(mockUpdatedMenu);
    });
    
    it('should handle API errors', async () => {
      const newSection = { name: 'Test Section' };
      const mockError = new Error('Failed to add section');
      mockApi.post.mockRejectedValue(mockError);
      
      await expect(menuService.addOrUpdateSection(mockRestaurantId, newSection)).rejects.toThrow('Failed to add section');
    });
  });
  
  describe('updateSectionOrder', () => {
    it('should reorder menu sections', async () => {
      const sectionIds = ['section-1', 'section-2', 'section-3'];
      const mockUpdatedMenu = {
        _id: 'test-menu-id',
        restaurant: mockRestaurantId,
        name: 'Test Menu',
        sections: [],
        active: true,
      };
      
      mockApi.put.mockResolvedValue({ data: mockUpdatedMenu });
      
      const result = await menuService.updateSectionOrder(mockRestaurantId, sectionIds);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/order`, { sectionIds });
      expect(result).toEqual(mockUpdatedMenu);
    });
    
    it('should handle API errors', async () => {
      const sectionIds = ['section-1', 'section-2'];
      const mockError = new Error('Failed to update section order');
      mockApi.put.mockRejectedValue(mockError);
      
      await expect(menuService.updateSectionOrder(mockRestaurantId, sectionIds)).rejects.toThrow('Failed to update section order');
    });
    
    it('should validate input parameters', async () => {
      await expect(menuService.updateSectionOrder(mockRestaurantId, [])).rejects.toThrow('Section IDs array is required');
      await expect(menuService.updateSectionOrder(mockRestaurantId, null as any)).rejects.toThrow('Section IDs array is required');
    });
  });
  
  describe('deleteSection', () => {
    it('should remove a section from the menu', async () => {
      mockApi.delete.mockResolvedValue({});
      
      await menuService.deleteSection(mockRestaurantId, mockSectionId);
      
      expect(mockApi.delete).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/${mockSectionId}`);
    });
    
    it('should handle API errors', async () => {
      const mockError = new Error('Failed to delete section');
      mockApi.delete.mockRejectedValue(mockError);
      
      await expect(menuService.deleteSection(mockRestaurantId, mockSectionId)).rejects.toThrow('Failed to delete section');
    });
  });
  
  describe('addOrUpdateItem', () => {
    it('should add an item to a section', async () => {
      const newItem = {
        name: 'Chocolate Cake',
        description: 'Rich and decadent',
        price: 6.99,
        category: 'Dessert',
        available: true,
      };
      
      const mockUpdatedItem = { ...newItem, _id: 'new-item-id' };
      mockApi.post.mockResolvedValue({ data: mockUpdatedItem });
      
      const result = await menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, newItem);
      
      expect(mockApi.post).toHaveBeenCalledWith(
        `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
        { item: newItem }
      );
      expect(result).toEqual(mockUpdatedItem);
    });
    
    it('should update an existing item', async () => {
      const updatedItem = {
        _id: mockItemId,
        name: 'Updated Mozzarella Sticks',
        description: 'Even crispier outside, even gooier inside',
        price: 9.99,
        category: 'Fried',
        available: true,
      };
      
      const mockResponse = { ...updatedItem };
      mockApi.post.mockResolvedValue({ data: mockResponse });
      
      const result = await menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, updatedItem);
      
      expect(mockApi.post).toHaveBeenCalledWith(
        `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
        { item: updatedItem }
      );
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle API errors', async () => {
      const newItem = {
        name: 'Chocolate Cake',
        description: 'Rich and decadent',
        price: 6.99,
        category: 'Dessert',
        available: true,
      };
      
      const mockError = new Error('Failed to add item');
      mockApi.post.mockRejectedValue(mockError);
      
      await expect(menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, newItem)).rejects.toThrow('Failed to add item');
      
      expect(mockApi.post).toHaveBeenCalledWith(
        `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
        { item: newItem }
      );
    });
  });
  
  describe('deleteItem', () => {
    it('should remove an item from a section', async () => {
      mockApi.delete.mockResolvedValue({});
      
      await menuService.deleteItem(mockRestaurantId, mockSectionId, mockItemId);
      
      expect(mockApi.delete).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}`);
    });
    
    it('should handle API errors', async () => {
      const mockError = new Error('Failed to delete item');
      mockApi.delete.mockRejectedValue(mockError);
      
      await expect(menuService.deleteItem(mockRestaurantId, mockSectionId, mockItemId)).rejects.toThrow('Failed to delete item');
    });
  });
  
  describe('uploadItemImage', () => {
    it('should upload an image file and return the image URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockImageUrl = 'https://example.com/image.jpg';
      
      mockApi.post.mockResolvedValue({ data: { imageUrl: mockImageUrl } });
      
      const result = await menuService.uploadItemImage(mockRestaurantId, mockSectionId, mockItemId, mockFile);
      
      expect(mockApi.post).toHaveBeenCalledWith(
        `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}/image`,
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: expect.any(Function),
        })
      );
      expect(result).toBe(mockImageUrl);
    });
    
    it('should handle API errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Failed to upload image');
      mockApi.post.mockRejectedValue(mockError);
      
      await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, mockItemId, mockFile)).rejects.toThrow('Failed to upload image');
    });
    
    it('should validate input parameters', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(menuService.uploadItemImage('', mockSectionId, mockItemId, mockFile)).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.uploadItemImage(mockRestaurantId, '', mockItemId, mockFile)).rejects.toThrow('Section ID is required');
      await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, '', mockFile)).rejects.toThrow('Item ID is required');
      await expect(menuService.uploadItemImage(mockRestaurantId, mockSectionId, mockItemId, null as any)).rejects.toThrow('Image file is required');
    });
  });
  
  describe('importMenuFromJson', () => {
    it('should call createOrUpdateMenu', async () => {
      const mockJsonData = {
        name: 'Imported Menu',
        sections: [
          {
            name: 'Desserts',
            description: 'Sweet treats',
            items: [],
          },
        ],
      };
      
      const mockUpdatedMenu = {
        _id: 'test-menu-id',
        restaurant: mockRestaurantId,
        ...mockJsonData,
        active: true,
      };
      
      mockApi.post.mockResolvedValue({ data: mockUpdatedMenu });
      
      const result = await menuService.importMenuFromJson(mockRestaurantId, mockJsonData);
      
      expect(mockApi.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`, mockJsonData);
      expect(result).toEqual(mockUpdatedMenu);
    });
    
    it('should handle invalid JSON data', async () => {
      const invalidJsonData = { name: 'Invalid Menu' }; // Missing sections
      
      await expect(menuService.importMenuFromJson(mockRestaurantId, invalidJsonData)).rejects.toThrow('Invalid menu format: must include name and sections');
    });
  });
  
  describe('should handle empty restaurant ID for all methods', () => {
    it('should validate restaurant ID for all methods', async () => {
      await expect(menuService.getRestaurantMenu('')).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.createOrUpdateMenu('', {})).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.addOrUpdateSection('', { name: 'Test' })).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.updateSectionOrder('', ['section-1'])).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.deleteSection('', 'section-id')).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.addOrUpdateItem('', 'section-id', { name: 'Test' })).rejects.toThrow('Restaurant ID is required');
      await expect(menuService.deleteItem('', 'section-id', 'item-id')).rejects.toThrow('Restaurant ID is required');
    });
  });
}); 