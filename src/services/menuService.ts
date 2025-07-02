import api from './api';
import { MenuItem, MenuItemInput, MenuSection, MenuSectionInput, Menu } from '../types/MenuItem';

// Re-export types for backward compatibility
export type { MenuItem, MenuItemInput, MenuSection, MenuSectionInput, Menu };

/**
 * Validates that a restaurant ID is provided and not empty
 */
const validateRestaurantId = (restaurantId: string): void => {
  if (!restaurantId) {
    throw new Error('Restaurant ID is required');
  }
};

const menuService = {
  /**
   * Get menu for a restaurant
   */
  async getRestaurantMenu(restaurantId: string): Promise<Menu> {
    validateRestaurantId(restaurantId);
    try {
      const response = await api.get(`/menus/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant menu:', error);
      throw error;
    }
  },

  /**
   * Create or update a restaurant menu
   */
  async createOrUpdateMenu(restaurantId: string, menuData: Partial<Menu>): Promise<Menu> {
    validateRestaurantId(restaurantId);
    
    if (!menuData) {
      throw new Error('Menu data is required');
    }
    
    try {
      const response = await api.post(`/menus/${restaurantId}`, menuData);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating menu:', error);
      throw error;
    }
  },

  /**
   * Add or update a menu section
   */
  async addOrUpdateSection(restaurantId: string, sectionData: Partial<MenuSectionInput>): Promise<Menu> {
    validateRestaurantId(restaurantId);
    
    if (!sectionData) {
      throw new Error('Section data is required');
    }
    
    if (!sectionData.name) {
      throw new Error('Section name is required');
    }
    
    try {
      const response = await api.post(`/menus/${restaurantId}/sections`, sectionData);
      return response.data;
    } catch (error) {
      console.error('Error adding/updating section:', error);
      throw error;
    }
  },

  /**
   * Update the order of menu sections
   */
  async updateSectionOrder(restaurantId: string, sectionIds: string[]): Promise<Menu> {
    validateRestaurantId(restaurantId);
    
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      throw new Error('Section IDs array is required');
    }
    
    try {
      const response = await api.put(`/menus/${restaurantId}/sections/order`, { sectionIds });
      return response.data;
    } catch (error) {
      console.error('Error updating section order:', error);
      throw error;
    }
  },

  /**
   * Delete a menu section
   */
  async deleteSection(restaurantId: string, sectionId: string): Promise<void> {
    validateRestaurantId(restaurantId);
    
    if (!sectionId) {
      throw new Error('Section ID is required');
    }
    
    try {
      await api.delete(`/menus/${restaurantId}/sections/${sectionId}`);
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  },

  /**
   * Add or update a menu item within a section
   */
  async addOrUpdateItem(restaurantId: string, sectionId: string, itemData: Partial<MenuItemInput>): Promise<MenuItem> {
    validateRestaurantId(restaurantId);
    
    if (!sectionId) {
      throw new Error('Section ID is required');
    }
    
    if (!itemData) {
      throw new Error('Item data is required');
    }
    
    if (!itemData.name) {
      throw new Error('Item name is required');
    }
    
    try {
      const response = await api.post(`/menus/${restaurantId}/sections/${sectionId}/items`, { item: itemData });
      
      // Handle development mode response format
      if (response.data.success && response.data.item) {
        return response.data.item;
      }
      
      // Handle regular response format
      // Find the updated item in the returned menu
      if (response.data && response.data.sections) {
        const section = response.data.sections.find((s: any) => s._id === sectionId);
        if (section) {
          const updatedItem = section.items.find((i: any) => i._id === itemData._id);
          if (updatedItem) {
            return updatedItem;
          }
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding/updating item:', error);
      throw error;
    }
  },

  /**
   * Delete a menu item
   */
  async deleteItem(restaurantId: string, sectionId: string, itemId: string): Promise<void> {
    validateRestaurantId(restaurantId);
    
    if (!sectionId) {
      throw new Error('Section ID is required');
    }
    
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    try {
      await api.delete(`/menus/${restaurantId}/sections/${sectionId}/items/${itemId}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  /**
   * Upload an image for a menu item
   */
  async uploadItemImage(restaurantId: string, sectionId: string, itemId: string, imageFile: File, onProgress?: (progress: number) => void): Promise<string> {
    validateRestaurantId(restaurantId);
    
    if (!sectionId) {
      throw new Error('Section ID is required');
    }
    
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    if (!imageFile) {
      throw new Error('Image file is required');
    }
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Create custom config to track upload progress
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      };
      
      // Upload the image
      const response = await api.post(
        `/menus/${restaurantId}/sections/${sectionId}/items/${itemId}/image`,
        formData,
        config
      );
      
      // Log debug info if available
      if (response.data.debug) {
        console.log('===== IMAGE UPLOAD CLIENT DEBUG =====');
        console.log('Response from server:', response.data);
        console.log('Image URL:', response.data.imageUrl);
        console.log('File name:', response.data.debug.fileName);
        console.log('Bucket name:', response.data.debug.bucketName);
        console.log('Full path:', response.data.debug.fullPath);
        console.log('Direct URL:', response.data.debug.directUrl);
        console.log('===================================');
      }
      
      // Return the image URL from the response
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading item image:', error);
      throw error;
    }
  },

  /**
   * Import a menu from JSON
   * This is a convenience method that wraps createOrUpdateMenu
   */
  async importMenuFromJson(restaurantId: string, jsonData: any): Promise<Menu> {
    validateRestaurantId(restaurantId);
    
    if (!jsonData) {
      throw new Error('JSON data is required');
    }
    
    if (!jsonData.name || !jsonData.sections) {
      throw new Error('Invalid menu format: must include name and sections');
    }
    
    return this.createOrUpdateMenu(restaurantId, jsonData);
  }
};

export default menuService; 