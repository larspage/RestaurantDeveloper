import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import restaurantService, { RestaurantFormData } from '../../../services/restaurantService';
import themeService, { Theme } from '../../../services/themeService';
import ProtectedRoute from '../../../components/ProtectedRoute';

const NewRestaurant = () => {
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    description: '',
    location: '',
    cuisine: '',
    theme: ''
  });
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThemesLoading, setIsThemesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch themes on component mount
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setIsThemesLoading(true);
        const themeData = await themeService.getAllThemes();
        setThemes(themeData);
      } catch (err) {
        console.error('Failed to fetch themes:', err);
      } finally {
        setIsThemesLoading(false);
      }
    };

    fetchThemes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newRestaurant = await restaurantService.createRestaurant(formData);
      
      router.push(`/dashboard/restaurants/${newRestaurant._id}`);
    } catch (err) {
      console.error('Failed to create restaurant:', err);
      setError('Failed to create restaurant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Create New Restaurant">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Restaurant</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
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
                value={formData.description}
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
                value={formData.location}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="cuisine" className="block text-gray-700 text-sm font-bold mb-2">
                Cuisine Type *
              </label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., Italian, Mexican, Japanese"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="theme" className="block text-gray-700 text-sm font-bold mb-2">
                Theme
              </label>
              {isThemesLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-gray-500">Loading themes...</span>
                </div>
              ) : (
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select a theme</option>
                  {themes.map((theme) => (
                    <option key={theme._id} value={theme._id}>
                      {theme.displayName}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-gray-600 text-xs mt-1">
                You can change the theme later in the restaurant settings.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
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
                {isLoading ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProtectedRoute(NewRestaurant, ['restaurant_owner']); 