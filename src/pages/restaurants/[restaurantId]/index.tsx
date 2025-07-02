import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import menuService, { Menu, MenuSection, MenuItem } from '../../../services/menuService';
import Layout from '../../../components/Layout';
import MenuItemCard from '../../../components/MenuItemCard';

interface RestaurantMenuPageProps {
  restaurant: Restaurant;
  menu: Menu;
}

const RestaurantMenuPage = ({ restaurant, menu }: RestaurantMenuPageProps) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-xl text-gray-600 mb-8">{restaurant.description}</p>

        {menu && menu.sections ? (
          menu.sections.map((section: MenuSection) => (
            <div key={section._id} className="mb-8">
              <h2 className="text-3xl font-semibold mb-4">{section.name}</h2>
              <p className="text-lg text-gray-500 mb-4">{section.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item: MenuItem) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    restaurantId={restaurant._id!}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No menu available for this restaurant.</p>
        )}
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // This can be improved to fetch a list of all restaurant IDs from the API
  // For now, we will not pre-render any paths and rely on fallback: 'blocking'
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { restaurantId } = context.params as { restaurantId: string };

  try {
    const restaurant = await restaurantService.getRestaurant(restaurantId);
    const menu = await menuService.getRestaurantMenu(restaurantId);

    return {
      props: {
        restaurant,
        menu,
      },
      revalidate: 60, // Re-generate the page every 60 seconds
    };
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
    return {
      notFound: true,
    };
  }
};

export default RestaurantMenuPage; 