import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import Layout from '../../../../components/Layout';
import PrinterManagement from '../../../../components/PrinterManagement';
import restaurantService, { Restaurant } from '../../../../services/restaurantService';

const PrintersPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadRestaurant(id);
    }
  }, [id]);

  const loadRestaurant = async (restaurantId: string) => {
    try {
      setLoading(true);
      const data = await restaurantService.getRestaurant(restaurantId);
      setRestaurant(data);
    } catch (err) {
      setError('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !restaurant) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Restaurant not found'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 py-4 text-sm text-gray-500">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-gray-700"
                >
                  Dashboard
                </button>
                <span>›</span>
                <button
                  onClick={() => router.push(`/dashboard/restaurants/${id}`)}
                  className="hover:text-gray-700"
                >
                  {restaurant.name}
                </button>
                <span>›</span>
                <span className="text-gray-900 font-medium">Printers</span>
              </div>
            </div>
          </div>

          <PrinterManagement 
            restaurantId={restaurant._id || ''} 
            restaurantName={restaurant.name} 
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default PrintersPage; 