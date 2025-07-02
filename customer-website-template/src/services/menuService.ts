import api from './api';
import { Menu } from '@/types/MenuItem';

export class MenuService {
  async getRestaurantMenu(restaurantId: string): Promise<Menu> {
    try {
      const menu = await api.get<Menu>(`/menus/${restaurantId}`);
      return menu;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw new Error('Failed to load restaurant menu');
    }
  }
}

const menuService = new MenuService();
export default menuService; 