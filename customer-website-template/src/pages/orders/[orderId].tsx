import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Order } from '@/types/Order';
import { Restaurant } from '@/types/Restaurant';
import orderService from '@/services/orderService';
import restaurantService from '@/services/restaurantService';

interface OrderPageProps {
  order: Order | null;
  restaurant: Restaurant | null;
  error?: string;
}

export default function OrderPage({ order, restaurant, error }: OrderPageProps) {
  // Error state
  if (error || !order) {
    return (
      <>
        <Head>
          <title>Order Not Found</title>
          <meta name="description" content="Order not found" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">{error || 'The order you are looking for does not exist.'}</p>
            <Link 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Menu
            </Link>
          </div>
        </main>
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'preparing':
        return 'text-orange-600 bg-orange-100';
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-green-800 bg-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Head>
        <title>Order #{order._id} - {restaurant?.name || 'Restaurant'}</title>
        <meta name="description" content={`Order confirmation for ${restaurant?.name || 'restaurant'}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmation</h1>
            <p className="text-xl text-gray-600">Thank you for your order!</p>
          </div>

          {/* Order Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h2>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            {/* Restaurant Info */}
            {restaurant && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{restaurant.name}</h3>
                {restaurant.address && (
                  <p className="text-gray-600">{restaurant.address}</p>
                )}
                {restaurant.phone && (
                  <p className="text-gray-600">{restaurant.phone}</p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.pricePointName && (
                        <p className="text-sm text-blue-600">{item.pricePointName}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Information</h3>
            <div className="space-y-3">
              {order.status === 'pending' && (
                <div className="flex items-center text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                  <span>Your order has been received and is being reviewed.</span>
                </div>
              )}
              {order.status === 'confirmed' && (
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>Your order has been confirmed and is being prepared.</span>
                </div>
              )}
              {order.status === 'preparing' && (
                <div className="flex items-center text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
                  <span>Your order is currently being prepared.</span>
                </div>
              )}
              {order.status === 'ready' && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>Your order is ready for pickup or delivery!</span>
                </div>
              )}
              {order.status === 'completed' && (
                <div className="flex items-center text-green-800">
                  <div className="w-2 h-2 bg-green-800 rounded-full mr-3"></div>
                  <span>Your order has been completed. Thank you!</span>
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                  <span>Your order has been cancelled.</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          {order.guest_info && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{order.guest_info.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.guest_info.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{order.guest_info.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-x-4">
            <Link 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Order Again
            </Link>
            {restaurant?.phone && (
              <a 
                href={`tel:${restaurant.phone}`}
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Call Restaurant
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderId } = context.params!;
  const restaurantId = process.env.RESTAURANT_ID;

  if (!orderId || typeof orderId !== 'string') {
    return {
      props: {
        order: null,
        restaurant: null,
        error: 'Invalid order ID.'
      }
    };
  }

  try {
    // Fetch order details
    const order = await orderService.getOrder(orderId);
    
    // Fetch restaurant details if we have a restaurant ID
    let restaurant = null;
    if (restaurantId) {
      try {
        restaurant = await restaurantService.getRestaurant(restaurantId);
      } catch (error) {
        console.warn('Could not fetch restaurant details:', error);
      }
    }

    return {
      props: {
        order,
        restaurant
      }
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    
    return {
      props: {
        order: null,
        restaurant: null,
        error: 'Order not found or could not be loaded.'
      }
    };
  }
}; 