import api from './api';

export interface Restaurant {
  _id?: string;
  name: string;
  description: string;
  location: string;
  cuisine: string;
  status: 'active' | 'inactive' | 'pending';
  owner: string;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantFormData {
  name: string;
  description: string;
  location: string;
  cuisine: string;
  theme?: string;
}

const restaurantService = {
  // Get all restaurants owned by the current user
  getUserRestaurants: async () => {
    const response = await api.get('/restaurants/user');
    return response.data;
  },

  // Get a single restaurant by ID
  getRestaurant: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  // Create a new restaurant
  createRestaurant: async (restaurantData: RestaurantFormData) => {
    const response = await api.post('/restaurants', restaurantData);
    return response.data;
  },

  // Update an existing restaurant
  updateRestaurant: async (id: string, restaurantData: Partial<RestaurantFormData>) => {
    const response = await api.put(`/restaurants/${id}`, restaurantData);
    return response.data;
  },

  // Delete a restaurant
  deleteRestaurant: async (id: string) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
  }
};

export default restaurantService; 