import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/Restaurant';
import { Menu, MenuItem, PricePoint } from '@/types/MenuItem';
import { useCart } from '@/context/CartContext';
import RestaurantHeader from '@/components/RestaurantHeader';
import MenuGrid from '@/components/MenuGrid';
import restaurantService from '@/services/restaurantService';
import menuService from '@/services/menuService';

interface RestaurantPageProps {
  restaurant: Restaurant | null;
  menu: Menu | null;
  error?: string;
}

export default function RestaurantPage({ restaurant, menu, error }: RestaurantPageProps) {
  const { setRestaurantId } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  // Set restaurant ID in cart context when page loads
  useEffect(() => {
    if (restaurant?._id) {
      setRestaurantId(restaurant._id);
    }
  }, [restaurant, setRestaurantId]);

  const handleAddToCart = (item: MenuItem, selectedPricePoint?: PricePoint) => {
    // This is handled by the MenuGrid component which passes it to MenuItemCard
    // The actual add to cart is handled by the CartContext
  };

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>Restaurant Not Found</title>
          <meta name="description" content="Restaurant not available" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Restaurant Not Available</h1>
            <p className="text-xl text-gray-600 mb-8">{error}</p>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">What you can do:</h2>
              <ul className="text-gray-600 text-left space-y-2">
                <li>• Check if the restaurant ID is configured correctly</li>
                <li>• Verify the API connection is working</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Loading state
  if (!restaurant || !menu) {
    return (
      <>
        <Head>
          <title>Loading Restaurant...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Loading Restaurant...</h1>
            <p className="text-gray-600">Please wait while we load the menu</p>
          </div>
        </main>
      </>
    );
  }

  // Main restaurant page
  return (
    <>
      <Head>
        <title>{restaurant.name} - Order Online</title>
        <meta 
          name="description" 
          content={`Order delicious food online from ${restaurant.name}. ${restaurant.description || 'Fresh, quality meals delivered to your door.'}`} 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${restaurant.name} - Order Online`} />
        <meta property="og:description" content={restaurant.description || `Order from ${restaurant.name}`} />
        <meta property="og:type" content="website" />
        <meta name="keywords" content={`restaurant, food delivery, ${restaurant.name}, online ordering`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Restaurant Header */}
        <RestaurantHeader restaurant={restaurant} />

        {/* Menu Grid */}
        <MenuGrid 
          menu={menu} 
          onAddToCart={handleAddToCart}
        />

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
            {restaurant.address && (
              <p className="text-gray-300 mb-2">{restaurant.address}</p>
            )}
            {restaurant.phone && (
              <p className="text-gray-300 mb-4">{restaurant.phone}</p>
            )}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-400 text-sm">
                © 2024 {restaurant.name}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const restaurantId = process.env.RESTAURANT_ID;

  if (!restaurantId) {
    return {
      props: {
        restaurant: null,
        menu: null,
        error: 'Restaurant ID not configured. Please check your environment settings.'
      }
    };
  }

  try {
    // Fetch restaurant and menu data in parallel
    const [restaurant, menu] = await Promise.all([
      restaurantService.getRestaurant(restaurantId),
      menuService.getRestaurantMenu(restaurantId)
    ]);

    return {
      props: {
        restaurant,
        menu
      }
    };
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
    
    return {
      props: {
        restaurant: null,
        menu: null,
        error: 'Unable to load restaurant information. Please try again later.'
      }
    };
  }
}; 