import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import themeService, { Theme } from '../../../services/themeService';

const RestaurantDetail = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Restaurant>>({});
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await restaurantService.getRestaurant(id as string);
        setRestaurant(data);
        setEditFormData(data);

        // Fetch theme if restaurant has one
        if (data.theme) {
          const themeData = await themeService.getTheme(data.theme);
          setTheme(themeData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
        setError('Failed to load restaurant details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant || !id) return;
    
    try {
      setIsLoading(true);
      const updatedRestaurant = await restaurantService.updateRestaurant(id as string, editFormData);
      setRestaurant(updatedRestaurant);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Failed to update restaurant:', err);
      setError('Failed to update restaurant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await restaurantService.deleteRestaurant(id as string);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
      setError('Failed to delete restaurant. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading && !restaurant) {
    return (
      <Layout title="Restaurant Details">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !restaurant) {
    return (
      <Layout title="Restaurant Details">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={restaurant?.name || 'Restaurant Details'}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{restaurant?.name}</h1>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Edit Restaurant
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!isEditing ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Restaurant Details</h2>
                <p className="text-gray-600">{restaurant?.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-gray-700 font-medium mb-2">Location</h3>
                  <p className="text-gray-600">{restaurant?.location}</p>
                </div>
                <div>
                  <h3 className="text-gray-700 font-medium mb-2">Cuisine</h3>
                  <p className="text-gray-600">{restaurant?.cuisine}</p>
                </div>
                <div>
                  <h3 className="text-gray-700 font-medium mb-2">Status</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    restaurant?.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : restaurant?.status === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant?.status && restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-700 font-medium mb-2">Theme</h3>
                  <p className="text-gray-600">
                    {theme ? theme.displayName : 'No theme selected'}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6 flex space-x-4">
                <button
                  onClick={() => router.push(`/dashboard/menus/${restaurant?._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Manage Menu
                </button>
                <button
                  onClick={() => router.push(`/dashboard/orders/${restaurant?._id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  View Orders
                </button>
                <button
                  onClick={() => router.push(`/dashboard/restaurants/${restaurant?._id}/settings`)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={() => router.push(`/dashboard/preview/${restaurant?._id}`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Preview Website
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name || ''}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={editFormData.description || ''}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={4}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={editFormData.location || ''}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="cuisine" className="block text-gray-700 text-sm font-bold mb-2">
                Cuisine Type *
              </label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={editFormData.cuisine || ''}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={editFormData.status || 'active'}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default RestaurantDetail; 