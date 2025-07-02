import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import restaurantService, { Restaurant } from '../../../services/restaurantService';
import menuService, { Menu, MenuSection, MenuItem, MenuItemInput, MenuSectionInput } from '../../../services/menuService';
import MenuSectionList from '../../../components/MenuSectionList';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import MenuItemForm from '../../../components/MenuItemForm';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const MenuManagement = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [jsonImportModal, setJsonImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    sectionId: '',
    sectionName: '',
    itemCount: 0
  });
  
  const router = useRouter();
  const { restaurantId } = router.query;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Create a mock restaurant and menu for development testing
  const createMockData = () => {
    // Mock restaurant data
    const mockRestaurant: Restaurant = {
      _id: 'dev-restaurant-123',
      name: 'Development Test Restaurant',
      description: 'This is a mock restaurant for development testing',
      location: '123 Dev Street',
      cuisine: 'Development Cuisine',
      status: 'active',
      owner: 'dev-user-123',
      theme: 'modern-dark',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock menu data with proper MenuItem interface
    const mockMenu: Menu = {
      _id: 'dev-menu-123',
      restaurant: 'dev-restaurant-123',
      name: 'Development Test Menu',
      sections: [
        {
          _id: 'dev-section-1',
          name: 'Appetizers',
          description: 'Start your meal with these delicious options',
          order: 0,
          items: [
            {
              _id: 'dev-item-1',
              name: 'Test Appetizer',
              description: 'A delicious test appetizer',
              price: 9.99,
              category: 'appetizer',
              available: true,
              modifications: ['Add cheese', 'Extra sauce']
            }
          ]
        },
        {
          _id: 'dev-section-2',
          name: 'Main Courses',
          description: 'Our signature dishes',
          order: 1,
          items: [
            {
              _id: 'dev-item-2',
              name: 'Test Main Course',
              description: 'A delicious test main course',
              price: 19.99,
              category: 'main',
              available: true,
              modifications: ['Medium rare', 'Well done']
            }
          ]
        }
      ],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return { mockRestaurant, mockMenu };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;
      
      try {
        setIsLoading(true);
        
        // Check if this is a development mock ID
        if (isDevelopment && restaurantId === 'dev-restaurant-123') {
          // Use mock data in development mode
          const { mockRestaurant, mockMenu } = createMockData();
          setRestaurant(mockRestaurant);
          setMenu(mockMenu);
          setIsLoading(false);
          return;
        }
        
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
  }, [restaurantId, isDevelopment]);

  const handleAddSection = async () => {
    if (!restaurantId) return;
    
    const sectionName = prompt('Enter section name:');
    if (!sectionName) return;
    
    try {
      setIsLoading(true);
      
      const newSection: MenuSectionInput = {
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
        // For createOrUpdateMenu, we need to pass sections without _id since it will be generated
        const newMenu = {
          restaurant: restaurantId as string,
          name: `${restaurant?.name || 'Restaurant'} Menu`,
          sections: [newSection] as any, // Type assertion needed since backend will generate _id
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

  const handleSectionOrderChange = async (sectionIds: string[]) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      // Call the API to update the section order
      const updatedMenu = await menuService.updateSectionOrder(restaurantId as string, sectionIds);
      
      // Update the local state with the new menu
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to update section order:', err);
      setError('Failed to update section order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSectionDescription = async (sectionId: string, description: string) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      // Find the section to update
      const sectionToUpdate = menu.sections.find(section => section._id === sectionId);
      
      if (!sectionToUpdate) {
        throw new Error('Section not found');
      }
      
      // Update the section with the new description
      const updatedSection = {
        ...sectionToUpdate,
        description
      };
      
      // Call the API to update the section
      const result = await menuService.addOrUpdateSection(restaurantId as string, updatedSection);
      
      // Update the local state with the new menu
      setMenu(result);
      setError(null);
    } catch (err) {
      console.error('Failed to update section description:', err);
      setError('Failed to update section description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = (sectionId: string) => {
    if (!menu) return;
    
    // Find the section to delete
    const sectionToDelete = menu.sections.find(section => section._id === sectionId);
    
    if (!sectionToDelete) return;
    
    // Open the delete confirmation modal
    setDeleteModal({
      isOpen: true,
      sectionId,
      sectionName: sectionToDelete.name,
      itemCount: sectionToDelete.items.length
    });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      sectionId: '',
      sectionName: '',
      itemCount: 0
    });
  };

  const handleConfirmDeleteSection = async () => {
    if (!restaurantId || !menu || !deleteModal.sectionId) return;
    
    try {
      setIsLoading(true);
      
      await menuService.deleteSection(restaurantId as string, deleteModal.sectionId);
      
      // Update local state
      const updatedMenu = {
        ...menu,
        sections: menu.sections.filter(section => section._id !== deleteModal.sectionId)
      };
      
      setMenu(updatedMenu);
      if (activeSection === deleteModal.sectionId) {
        setActiveSection(null);
      }
      
      setError(null);
      
      // Close the modal
      handleCloseDeleteModal();
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

  const handleUpdateItem = async (sectionId: string, itemId: string, updatedItem: Partial<MenuItemInput>) => {
    if (!restaurantId || !sectionId || !itemId) return;
    
    try {
      setIsLoading(true);
      
      // Handle image upload if there's an image file
      if (updatedItem.imageFile) {
        setUploadingItemId(itemId);
        
        // Set upload progress to 0
        setUploadProgress(0);
        
        // Upload the image and get the URL
        const imageUrl = await menuService.uploadItemImage(
          restaurantId as string,
          sectionId,
          itemId,
          updatedItem.imageFile,
          (progress) => {
            // Update progress state
            setUploadProgress(progress);
          }
        );
        
        // Add the imageUrl to the updated item
        updatedItem.imageUrl = imageUrl;
        
        // Remove the file from the update payload
        delete updatedItem.imageFile;
        setUploadingItemId(null);
      }
      
      const result = await menuService.addOrUpdateItem(restaurantId as string, sectionId, {
        _id: itemId,
        ...updatedItem
      });
      
      // Check if we got a full menu object or just the updated item
      if ('sections' in result) {
        // If we got a full menu back, use it
        setMenu(result as unknown as Menu);
      } else {
        // Update local state with the returned item
        const updatedMenu = {
          ...menu!,
          sections: menu!.sections.map(section => {
            if (section._id === sectionId) {
              return {
                ...section,
                items: section.items.map(item => 
                  item._id === itemId ? { ...item, ...result } : item
                )
              };
            }
            return section;
          })
        };
        setMenu(updatedMenu);
      }
      setError(null);
      
      // Close the edit form if it was open
      if (editingItem && editingItem._id === itemId) {
        setEditingItem(null);
      }
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

  const validatePricePoints = (pricePoints: any[], itemName: string, sectionName: string): boolean => {
    if (!Array.isArray(pricePoints)) {
      setJsonError(`Item "${itemName}" in section "${sectionName}" has invalid pricePoints - must be an array`);
      return false;
    }
    
    if (pricePoints.length === 0) {
      setJsonError(`Item "${itemName}" in section "${sectionName}" has empty pricePoints array - at least one price point is required`);
      return false;
    }
    
    const pricePointNames = new Set();
    
    for (let i = 0; i < pricePoints.length; i++) {
      const pricePoint = pricePoints[i];
      
      // Validate price point name
      if (!pricePoint.name || typeof pricePoint.name !== 'string') {
        setJsonError(`Item "${itemName}" price point ${i + 1} is missing a valid name`);
        return false;
      }
      
      // Check for duplicate price point names
      if (pricePointNames.has(pricePoint.name)) {
        setJsonError(`Item "${itemName}" has duplicate price point name: "${pricePoint.name}"`);
        return false;
      }
      pricePointNames.add(pricePoint.name);
      
      // Validate price point price
      if (typeof pricePoint.price !== 'number' || pricePoint.price < 0) {
        setJsonError(`Item "${itemName}" price point "${pricePoint.name}" must have a valid positive price`);
        return false;
      }
      
      // Validate price point id (generate if missing)
      if (!pricePoint.id) {
        pricePoint.id = pricePoint.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      // Validate isDefault if present
      if (pricePoint.isDefault !== undefined && typeof pricePoint.isDefault !== 'boolean') {
        setJsonError(`Item "${itemName}" price point "${pricePoint.name}" isDefault must be a boolean`);
        return false;
      }
    }
    
    return true;
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
        
        // Validate base price (required for backward compatibility)
        if (typeof item.price !== 'number' || item.price < 0) {
          setJsonError(`Item "${item.name}" must have a valid positive base price`);
          return false;
        }
        
        // Validate price points if present
        if (item.pricePoints) {
          if (!validatePricePoints(item.pricePoints, item.name, section.name)) {
            return false;
          }
        }
        
        // Validate available field if present
        if (item.available !== undefined && typeof item.available !== 'boolean') {
          setJsonError(`Item "${item.name}" available field must be a boolean`);
          return false;
        }
        
        // Validate modifications array if present
        if (item.modifications && !Array.isArray(item.modifications)) {
          setJsonError(`Item "${item.name}" modifications must be an array`);
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
            pricePoints: item.pricePoints || undefined, // Include price points if present
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

  const handleEditItem = (sectionId: string, item: MenuItem) => {
    setEditingItem(item);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleImageUpload = (sectionId: string, itemId: string) => {
    setUploadingItemId(itemId);
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingItemId || !activeSection || !restaurantId) {
      setUploadingItemId(null);
      return;
    }

    try {
      setIsLoading(true);
      
      // Update the item with the image file
      await handleUpdateItem(activeSection, uploadingItemId, { imageFile: file });
      
      setError(null);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadingItemId(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    <Layout title={restaurant ? `${restaurant.name} - Menu Management` : 'Menu Management'}>
      <div className="container mx-auto px-4 py-8">
        {isDevelopment && restaurantId === 'dev-restaurant-123' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800">Development Mode</h2>
            <p className="text-green-700">
              You are viewing a mock restaurant menu for development testing. Changes won't be saved to a database.
            </p>
          </div>
        )}
        
        {/* Hidden file input for image uploads */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
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
            {/* Menu Section List - Left Column */}
            <div className="md:col-span-1">
              <MenuSectionList
                sections={menu.sections}
                onSectionOrderChange={handleSectionOrderChange}
                onSectionClick={setActiveSection}
                onDeleteSection={handleOpenDeleteModal}
                activeSection={activeSection}
                onEditDescription={handleEditSectionDescription}
              />
            </div>
            
            {/* Menu Items - Right Column */}
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
                            {editingItem && editingItem._id === item._id ? (
                              <MenuItemForm
                                item={item}
                                onSave={(updatedItem) => handleUpdateItem(activeSection, item._id!, updatedItem)}
                                onCancel={handleCancelEdit}
                                isUploading={uploadingItemId === item._id}
                                uploadProgress={uploadProgress}
                              />
                            ) : (
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div>
                                    <h3 className="font-medium text-lg">{item.name}</h3>
                                    <p className="text-gray-600 text-sm">{item.description}</p>
                                    <p className="text-gray-800 font-medium mt-1">${item.price.toFixed(2)}</p>
                                    
                                    {/* Availability indicator */}
                                    <div className="mt-2 flex items-center">
                                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${item.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      <p className={`mt-1 text-sm ${item.available ? 'text-green-600' : 'text-gray-500'}`}>
                                        {item.available ? 'Available' : 'Not Available'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Show upload progress if uploading */}
                                  {item._id === uploadingItemId && (
                                    <div className="mt-2">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-blue-600 h-2.5 rounded-full" 
                                          style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Uploading: {uploadProgress}%
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Image on the right side */}
                                <div className="flex items-center ml-4">
                                  {item.imageUrl && (
                                    <div className="relative h-24 w-24">
                                      <Image
                                        src={`${item.imageUrl}?cacheBust=${Date.now()}`}
                                        alt={item.name}
                                        width={96}
                                        height={96}
                                        className="rounded-md object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex space-x-2 ml-4">
                                  <button
                                    onClick={() => handleImageUpload(activeSection, item._id!)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title={item.imageUrl ? "Change image" : "Add image"}
                                    disabled={uploadingItemId === item._id}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleEditItem(activeSection, item)}
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
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No Section Selected</h2>
                  <p className="text-gray-600">
                    Select a section from the left to view and manage its items.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JSON Import Modal */}
        {jsonImportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Import Menu from JSON
                  </h3>
                  
                  <textarea
                    className="w-full p-2 border rounded h-64 font-mono text-sm"
                    value={jsonInput}
                    onChange={handleJsonInputChange}
                    placeholder='{"name": "My Menu", "sections": [{"name": "Appetizers", "items": [{"name": "Mozzarella Sticks", "price": 8.99}]}]}'
                  ></textarea>
                  
                  {jsonError && (
                    <div className="mt-2 text-sm text-red-600">
                      {jsonError}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleJsonImport}
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setJsonImportModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Menu Section"
          message="Are you sure you want to delete this section? This action cannot be undone."
          itemName={deleteModal.sectionName}
          itemCount={deleteModal.itemCount}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDeleteSection}
        />
      </div>
    </Layout>
  );
};

export default MenuManagement; 