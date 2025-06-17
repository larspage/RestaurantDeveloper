import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../hooks/useAuth';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import menuService, { Menu, MenuSection, MenuItem } from '../../../services/menuService';
import ProtectedRoute from '../../../components/ProtectedRoute';

const MenuManagement = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [jsonImportModal, setJsonImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  const router = useRouter();
  const { restaurantId } = router.query;

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch restaurant details
        const restaurantData = await restaurantService.getRestaurant(restaurantId as string);
        setRestaurant(restaurantData);
        
        // Fetch menu data
        try {
          const menuData = await menuService.getRestaurantMenu(restaurantId as string);
          setMenu(menuData);
        } catch (menuErr) {
          // If menu doesn't exist yet, that's okay
          console.log('No menu found, will create one when needed');
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load restaurant or menu data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const handleAddSection = async () => {
    if (!restaurantId) return;
    
    const sectionName = prompt('Enter section name:');
    if (!sectionName) return;
    
    try {
      setIsLoading(true);
      
      const newSection = {
        name: sectionName,
        description: '',
        items: []
      };
      
      let updatedMenu;
      
      if (menu) {
        // Add section to existing menu
        const result = await menuService.addOrUpdateSection(restaurantId as string, newSection);
        updatedMenu = result;
      } else {
        // Create new menu with this section
        const newMenu = {
          restaurant: restaurantId as string,
          name: `${restaurant?.name || 'Restaurant'} Menu`,
          sections: [newSection],
          active: true
        };
        
        const result = await menuService.createOrUpdateMenu(restaurantId as string, newMenu);
        updatedMenu = result;
      }
      
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to add section:', err);
      setError('Failed to add menu section. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!restaurantId || !sectionId || !menu) return;
    
    if (!confirm('Are you sure you want to delete this section? All items in this section will be deleted.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await menuService.deleteSection(restaurantId as string, sectionId);
      
      // Update local state
      const updatedMenu = {
        ...menu,
        sections: menu.sections.filter(section => section._id !== sectionId)
      };
      
      setMenu(updatedMenu);
      if (activeSection === sectionId) {
        setActiveSection(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to delete section:', err);
      setError('Failed to delete menu section. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (sectionId: string) => {
    if (!restaurantId || !sectionId) return;
    
    try {
      setIsLoading(true);
      
      const newItem = {
        name: 'New Item',
        description: 'Item description',
        price: 0,
        category: '',
        available: true
      };
      
      const result = await menuService.addOrUpdateItem(restaurantId as string, sectionId, newItem);
      
      // Update local state
      const updatedMenu = {
        ...menu!,
        sections: menu!.sections.map(section => {
          if (section._id === sectionId) {
            return {
              ...section,
              items: [...section.items, result]
            };
          }
          return section;
        })
      };
      
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (sectionId: string, itemId: string, updatedItem: Partial<MenuItem>) => {
    if (!restaurantId || !sectionId || !itemId) return;
    
    try {
      setIsLoading(true);
      
      const result = await menuService.addOrUpdateItem(restaurantId as string, sectionId, {
        _id: itemId,
        ...updatedItem
      });
      
      // Update local state
      const updatedMenu = {
        ...menu!,
        sections: menu!.sections.map(section => {
          if (section._id === sectionId) {
            return {
              ...section,
              items: section.items.map(item => 
                item._id === itemId ? { ...item, ...updatedItem } : item
              )
            };
          }
          return section;
        })
      };
      
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (!restaurantId || !sectionId || !itemId) return;
    
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      await menuService.deleteItem(restaurantId as string, sectionId, itemId);
      
      // Update local state
      const updatedMenu = {
        ...menu!,
        sections: menu!.sections.map(section => {
          if (section._id === sectionId) {
            return {
              ...section,
              items: section.items.filter(item => item._id !== itemId)
            };
          }
          return section;
        })
      };
      
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJson = () => {
    setJsonImportModal(true);
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setJsonError(null);
  };

  const validateMenuJson = (json: any): boolean => {
    // Basic validation
    if (!json) return false;
    
    // Check if it has sections
    if (!Array.isArray(json.sections)) {
      setJsonError('JSON must contain a "sections" array');
      return false;
    }
    
    // Validate each section
    for (const section of json.sections) {
      if (!section.name) {
        setJsonError('Each section must have a name');
        return false;
      }
      
      if (!Array.isArray(section.items)) {
        setJsonError(`Section "${section.name}" must have an "items" array`);
        return false;
      }
      
      // Validate each item
      for (const item of section.items) {
        if (!item.name) {
          setJsonError(`Item in section "${section.name}" is missing a name`);
          return false;
        }
        
        if (typeof item.price !== 'number') {
          setJsonError(`Item "${item.name}" must have a numeric price`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleJsonImport = async () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      
      if (!validateMenuJson(jsonData)) {
        return;
      }
      
      setIsLoading(true);
      
      // Create or update menu with imported data
      const menuData = {
        restaurant: restaurantId as string,
        name: jsonData.name || `${restaurant?.name || 'Restaurant'} Menu`,
        description: jsonData.description || '',
        sections: jsonData.sections.map((section: any) => ({
          name: section.name,
          description: section.description || '',
          items: section.items.map((item: any) => ({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category || '',
            available: item.available !== undefined ? item.available : true,
            modifications: item.modifications || []
          }))
        })),
        active: true
      };
      
      const result = await menuService.createOrUpdateMenu(restaurantId as string, menuData);
      
      setMenu(result);
      setJsonImportModal(false);
      setJsonInput('');
      setError(null);
    } catch (err) {
      console.error('Failed to import JSON:', err);
      if (err instanceof SyntaxError) {
        setJsonError('Invalid JSON format. Please check your JSON syntax.');
      } else {
        setJsonError('Failed to import menu. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!menu) return;
    
    const exportData = {
      name: menu.name,
      description: menu.description,
      sections: menu.sections
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurant?.name || 'restaurant'}-menu.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !restaurant) {
    return (
      <Layout title="Menu Management">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Menu - ${restaurant?.name || 'Restaurant'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{restaurant?.name} Menu</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/dashboard/restaurants/${restaurantId}`)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Back to Restaurant
            </button>
            <button
              onClick={handleAddSection}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Add Section
            </button>
            <button
              onClick={handleImportJson}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Import JSON
            </button>
            {menu && menu.sections.length > 0 && (
              <button
                onClick={handleExportJson}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Export JSON
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!menu || menu.sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Menu Yet</h2>
            <p className="text-gray-600 mb-6">
              This restaurant doesn't have a menu yet. Add sections and items to create one, or import a menu from JSON.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleAddSection}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Add First Section
              </button>
              <button
                onClick={handleImportJson}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Import from JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sections</h2>
              <ul className="space-y-2">
                {menu.sections.map(section => (
                  <li key={section._id} className="flex justify-between items-center">
                    <button
                      onClick={() => setActiveSection(section._id || null)}
                      className={`flex-1 text-left py-2 px-4 rounded ${
                        activeSection === section._id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {section.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section._id!)}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="Delete section"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-2">
              {activeSection ? (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {menu.sections.find(s => s._id === activeSection)?.name || 'Section'}
                    </h2>
                    <button
                      onClick={() => handleAddItem(activeSection)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  {menu.sections.find(s => s._id === activeSection)?.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No items in this section yet. Add your first item!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {menu.sections
                        .find(s => s._id === activeSection)
                        ?.items.map(item => (
                          <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                                <p className="text-gray-800 font-medium mt-1">${item.price.toFixed(2)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const name = prompt('Item name:', item.name);
                                    if (name) {
                                      handleUpdateItem(activeSection, item._id!, { name });
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(activeSection, item._id!)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">Select a section to view and manage items</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* JSON Import Modal */}
        {jsonImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Import Menu from JSON</h2>
              
              {jsonError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{jsonError}</span>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Paste your menu JSON below. The format should include sections and items:
                </p>
                <pre className="bg-gray-100 p-2 rounded text-xs mb-4">
{`{
  "name": "Restaurant Menu",
  "description": "Our delicious offerings",
  "sections": [
    {
      "name": "Appetizers",
      "description": "Start your meal right",
      "items": [
        {
          "name": "Mozzarella Sticks",
          "description": "Crispy outside, gooey inside",
          "price": 8.99,
          "category": "Fried",
          "available": true
        }
      ]
    }
  ]
}`}
                </pre>
                <textarea
                  className="w-full h-64 border border-gray-300 rounded p-2 font-mono text-sm"
                  value={jsonInput}
                  onChange={handleJsonInputChange}
                  placeholder="Paste your JSON here..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setJsonImportModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJsonImport}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Importing...' : 'Import Menu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProtectedRoute(MenuManagement, ['restaurant_owner']); 