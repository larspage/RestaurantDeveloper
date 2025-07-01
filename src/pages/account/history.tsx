import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import orderService, { Order } from '../../services/orderService';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const userOrders = await orderService.getOrderHistory();
        setOrders(userOrders);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Order History</h1>
        
        {loading && <p>Loading order history...</p>}
        
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {orders.length > 0 ? (
              orders.map(order => (
                <div key={order._id} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                      <p className="text-lg font-semibold">
                        Placed on: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="capitalize">Status: <span className="font-medium">{order.status}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${order.total_price.toFixed(2)}</p>
                      <Link href={`/orders/${order._id}`} className="text-blue-500 hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>You have not placed any orders yet.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Wrap the component with ProtectedRoute for authentication
const ProtectedOrderHistoryPage = () => (
  <ProtectedRoute>
    <OrderHistoryPage />
  </ProtectedRoute>
);

export default ProtectedOrderHistoryPage; 