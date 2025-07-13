import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import restaurantService, { Restaurant } from '../../services/restaurantService';

const Dashboard = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await restaurantService.getUserRestaurants();
        setRestaurants(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
        setError('Failed to load your restaurants. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleCreateRestaurant = () => {
    router.push('/dashboard/restaurants/new');
  };

  // Mock restaurant ID for development testing
  const mockRestaurantId = 'dev-restaurant-123';

  return (
    <Layout title="Restaurant Dashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Restaurant Dashboard</h1>
          <button
            onClick={handleCreateRestaurant}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Create New Restaurant
          </button>
        </div>

        {isDevelopment && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Development Mode</h2>
            <p className="text-green-700 mb-4">
              Use these direct links to test functionality without needing to create restaurants:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/menus/${mockRestaurantId}`}>
                <span className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Test Menu Management
                </span>
              </Link>
              <Link href={`/dashboard/restaurants/${mockRestaurantId}`}>
                <span className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Test Restaurant Management
                </span>
              </Link>
              <Link href={`/dashboard/analytics/${mockRestaurantId}`}>
                <span className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Test Analytics Dashboard
                </span>
              </Link>
              <Link href={`/kitchen/${mockRestaurantId}`}>
                <span className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  Test Kitchen Display
                </span>
              </Link>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Restaurant Dashboard</h2>
            <p className="text-gray-600 mb-6">
              You don't have any restaurants yet. Create your first restaurant to get started!
            </p>
            <button
              onClick={handleCreateRestaurant}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Create Your First Restaurant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{restaurant.name}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{restaurant.description}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {restaurant.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    {restaurant.cuisine}
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      restaurant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : restaurant.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <Link href={`/dashboard/restaurants/${restaurant._id}`}>
                      <span className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                        Manage
                      </span>
                    </Link>
                    <Link href={`/dashboard/menus/${restaurant._id}`}>
                      <span className="block text-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                        Menu
                      </span>
                    </Link>
                    <Link href={`/dashboard/orders`}>
                      <span className="block text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                        Orders
                      </span>
                    </Link>
                    <Link href={`/dashboard/analytics/${restaurant._id}`}>
                      <span className="block text-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                        Analytics
                      </span>
                    </Link>
                    <Link href={`/kitchen/${restaurant._id}`}>
                      <span className="block text-center bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded transition-colors cursor-pointer">
                        Kitchen
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard; 