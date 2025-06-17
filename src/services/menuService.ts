import api from './api';

export interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  modifications?: string[];
}

export interface MenuSection {
  _id?: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export interface Menu {
  _id?: string;
  restaurant: string;
  name: string;
  description?: string;
  sections: MenuSection[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const menuService = {
  /**
   * Get menu for a restaurant
   */
  async getRestaurantMenu(restaurantId: string): Promise<Menu> {
    const response = await api.get(`/menus/${restaurantId}`);
    return response.data;
  },

  /**
   * Create or update a restaurant menu
   */
  async createOrUpdateMenu(restaurantId: string, menuData: Partial<Menu>): Promise<Menu> {
    const response = await api.post(`/menus/${restaurantId}`, menuData);
    return response.data;
  },

  /**
   * Add or update a menu section
   */
  async addOrUpdateSection(restaurantId: string, sectionData: Partial<MenuSection>): Promise<Menu> {
    const response = await api.post(`/menus/${restaurantId}/sections`, sectionData);
    return response.data;
  },

  /**
   * Delete a menu section
   */
  async deleteSection(restaurantId: string, sectionId: string): Promise<void> {
    await api.delete(`/menus/${restaurantId}/sections/${sectionId}`);
  },

  /**
   * Add or update a menu item within a section
   */
  async addOrUpdateItem(restaurantId: string, sectionId: string, itemData: Partial<MenuItem>): Promise<MenuItem> {
    const response = await api.post(`/menus/${restaurantId}/sections/${sectionId}/items`, itemData);
    return response.data;
  },

  /**
   * Delete a menu item
   */
  async deleteItem(restaurantId: string, sectionId: string, itemId: string): Promise<void> {
    await api.delete(`/menus/${restaurantId}/sections/${sectionId}/items/${itemId}`);
  },

  /**
   * Import a menu from JSON
   * This is a convenience method that wraps createOrUpdateMenu
   */
  async importMenuFromJson(restaurantId: string, jsonData: any): Promise<Menu> {
    return this.createOrUpdateMenu(restaurantId, jsonData);
  }
};

export default menuService; 