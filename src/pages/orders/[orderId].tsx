import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import orderService, { Order } from '../../services/orderService';

interface OrderConfirmationPageProps {
  order: Order | null;
  error?: string;
}

const OrderConfirmationPage = ({ order, error }: OrderConfirmationPageProps) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p>We could not find the order you are looking for.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p className="font-bold">Order Confirmed!</p>
          <p>Thank you for your purchase. Your order has been successfully placed.</p>
        </div>

        <h1 className="text-3xl font-bold mb-4">Order Summary</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <p className="text-gray-600">Order ID:</p>
            <p className="font-mono text-lg">{order._id}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Status:</p>
            <p className="text-lg font-semibold capitalize">{order.status}</p>
          </div>

          <h2 className="text-2xl font-semibold border-t pt-4 mt-4 mb-2">Items</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item._id} className="flex justify-between items-center">
                <p>{item.name} (x{item.quantity})</p>
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
            <span>Total Price:</span>
            <span>${order.total_price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderId } = context.params as { orderId: string };

  // Note: For guest users, the backend route requires email/phone for auth.
  // This simple implementation assumes an authenticated user context is passed
  // via cookies, which `api.ts` should handle automatically.
  // A more complete solution would handle passing guest credentials if needed.

  try {
    const order = await orderService.getOrder(orderId);
    return {
      props: {
        order,
      },
    };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return {
      props: {
        order: null,
        error: error.response?.data?.message || 'Failed to fetch order details.',
      },
    };
  }
};

export default OrderConfirmationPage; 