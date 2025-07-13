import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import restaurantService, { RestaurantFormData } from '../../../services/restaurantService';
import themeService, { Theme } from '../../../services/themeService';

const NewRestaurant = () => {
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    description: '',
    location: '',
    cuisine: '',
    theme: ''
  });
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [contactData, setContactData] = useState({
    phone: '',
    fax: ''
  });
  const [customCuisine, setCustomCuisine] = useState('');
  const [showCustomCuisine, setShowCustomCuisine] = useState(false);
  
  // Common cuisine types
  const cuisineTypes = [
    'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'French', 
    'Mediterranean', 'Greek', 'Korean', 'Vietnamese', 'Brazilian', 'Peruvian', 'Spanish',
    'German', 'British', 'Russian', 'Lebanese', 'Moroccan', 'Ethiopian', 'Cajun',
    'Seafood', 'Steakhouse', 'BBQ', 'Pizza', 'Sushi', 'Vegetarian', 'Vegan', 'Fusion'
  ];
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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCuisineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Other') {
      setShowCustomCuisine(true);
      setFormData((prev) => ({ ...prev, cuisine: '' }));
    } else {
      setShowCustomCuisine(false);
      setFormData((prev) => ({ ...prev, cuisine: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Combine address fields into location
      const fullAddress = [
        addressData.street,
        addressData.city,
        addressData.state,
        addressData.zipCode,
        addressData.country
      ].filter(Boolean).join(', ');
      
      const restaurantData = {
        ...formData,
        location: fullAddress || formData.location,
        cuisine: showCustomCuisine ? customCuisine : formData.cuisine,
        // Add contact info to description for now (can be expanded later)
        description: `${formData.description}${contactData.phone ? `\n\nPhone: ${contactData.phone}` : ''}${contactData.fax ? `\nFax: ${contactData.fax}` : ''}`
      };
      
      const newRestaurant = await restaurantService.createRestaurant(restaurantData);
      
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
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Address *
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={addressData.street}
                  onChange={handleAddressChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State/Province"
                    value={addressData.state}
                    onChange={handleAddressChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP/Postal Code"
                    value={addressData.zipCode}
                    onChange={handleAddressChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={addressData.country}
                    onChange={handleAddressChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Information
              </label>
              <div className="space-y-3">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={contactData.phone}
                  onChange={handleContactChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
                <input
                  type="tel"
                  name="fax"
                  placeholder="Fax Number (Optional)"
                  value={contactData.fax}
                  onChange={handleContactChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="cuisine" className="block text-gray-700 text-sm font-bold mb-2">
                Cuisine Type *
              </label>
              <select
                id="cuisine"
                name="cuisine"
                value={showCustomCuisine ? 'Other' : formData.cuisine}
                onChange={handleCuisineChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select a cuisine type</option>
                {cuisineTypes.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
                <option value="Other">Other (specify below)</option>
              </select>
              
              {showCustomCuisine && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Enter your cuisine type"
                    value={customCuisine}
                    onChange={(e) => setCustomCuisine(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              )}
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

export default NewRestaurant; 