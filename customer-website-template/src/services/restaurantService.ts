import api from './api';
import { Restaurant } from '@/types/Restaurant';

export class RestaurantService {
  async getRestaurant(restaurantId: string): Promise<Restaurant> {
    try {
      const restaurant = await api.get<Restaurant>(`/restaurants/${restaurantId}`);
      return restaurant;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      throw new Error('Failed to load restaurant information');
    }
  }
}

const restaurantService = new RestaurantService();
export default restaurantService; 