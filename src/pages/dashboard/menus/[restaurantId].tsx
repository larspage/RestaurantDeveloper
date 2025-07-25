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
import MenuItemModal from '../../../components/MenuItemModal';
import ImportPreview from '../../../components/ImportPreview';
import { parseCsvToMenuItems, downloadCsvTemplate, CsvParseResult } from '../../../utils/csvParser';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const MenuManagement = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [jsonImportModal, setJsonImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [csvImportModal, setCsvImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvParseResult, setCsvParseResult] = useState<CsvParseResult | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalSectionId, setModalSectionId] = useState<string | null>(null);
  
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
    // Wait for the router to be ready before accessing query params
    if (!router.isReady) {
      return;
    }

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
  }, [restaurantId, isDevelopment, router.isReady]);

  const handleAddSection = async () => {
    if (!restaurantId) return;
    
    const sectionName = prompt('Enter section name:');
    if (!sectionName) return;
    
    try {
      setIsLoading(true);
      
      // Calculate the next displayOrder value for the new section
      const maxDisplayOrder = menu?.sections.reduce((max, section) => Math.max(max, section.displayOrder || 0), 0) || 0;
      
      const newSection: MenuSectionInput = {
        name: sectionName,
        description: '',
        displayOrder: maxDisplayOrder + 1,
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

  const handleAddItem = (sectionId: string) => {
    // Calculate the next order value for the new item
    const section = menu?.sections.find(s => s._id === sectionId);
    const maxOrder = section?.items.reduce((max, item) => Math.max(max, item.order || 0), 0) || 0;
    
    // Create a new item template with the next order value
    const newItemTemplate: Partial<MenuItem> = {
      name: '',
      description: '',
      price: 0,
      available: true,
      order: maxOrder + 1
    };
    
    setModalItem(newItemTemplate as MenuItem); // Pass template as new item
    setModalSectionId(sectionId);
    setShowItemModal(true);
  };

  const handleEditItemModal = (item: MenuItem, sectionId: string) => {
    setModalItem(item);
    setModalSectionId(sectionId);
    setShowItemModal(true);
  };

  const handleCloseItemModal = () => {
    setShowItemModal(false);
    setModalItem(null);
    setModalSectionId(null);
  };

  const handleSaveItem = async (updatedItem: Partial<MenuItemInput>) => {
    if (!restaurantId || !modalSectionId) return;
    
    try {
      setIsLoading(true);
      
      // Handle image upload if there's an image file
      if (updatedItem.imageFile) {
        setUploadingItemId(modalItem?._id || 'new');
        
        // Set upload progress to 0
        setUploadProgress(0);
        
        // For new items without _id, use a temporary ID for upload
        const itemIdForUpload = modalItem?._id || `temp-${Date.now()}`;
        
        // Upload the image and get the URL
        const imageUrl = await menuService.uploadItemImage(
          restaurantId as string,
          modalSectionId,
          itemIdForUpload,
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

      // If editing existing item, include the ID
      if (modalItem?._id) {
        updatedItem._id = modalItem._id;
      }
      
      const result = await menuService.addOrUpdateItem(restaurantId as string, modalSectionId, updatedItem);
      
      // Refresh the menu data to get the latest state
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
      setError(null);
      
      // Close the modal
      handleCloseItemModal();
    } catch (err) {
      console.error('Failed to save item:', err);
      setError('Failed to save menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveItemUp = async (sectionId: string, itemId: string) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      const section = menu.sections.find(s => s._id === sectionId);
      if (!section) return;
      
      const sortedItems = [...section.items].sort((a, b) => (a.order || 0) - (b.order || 0));
      const itemIndex = sortedItems.findIndex(item => item._id === itemId);
      
      if (itemIndex <= 0) return; // Already at top
      
      // Swap order values with the item above
      const currentItem = sortedItems[itemIndex];
      const itemAbove = sortedItems[itemIndex - 1];
      
      const tempOrder = currentItem.order || 0;
      currentItem.order = itemAbove.order || 0;
      itemAbove.order = tempOrder;
      
      // Update both items
      await menuService.addOrUpdateItem(restaurantId as string, sectionId, currentItem);
      await menuService.addOrUpdateItem(restaurantId as string, sectionId, itemAbove);
      
      // Refresh menu
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to move item up:', err);
      setError('Failed to reorder menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveItemDown = async (sectionId: string, itemId: string) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      const section = menu.sections.find(s => s._id === sectionId);
      if (!section) return;
      
      const sortedItems = [...section.items].sort((a, b) => (a.order || 0) - (b.order || 0));
      const itemIndex = sortedItems.findIndex(item => item._id === itemId);
      
      if (itemIndex >= sortedItems.length - 1) return; // Already at bottom
      
      // Swap order values with the item below
      const currentItem = sortedItems[itemIndex];
      const itemBelow = sortedItems[itemIndex + 1];
      
      const tempOrder = currentItem.order || 0;
      currentItem.order = itemBelow.order || 0;
      itemBelow.order = tempOrder;
      
      // Update both items
      await menuService.addOrUpdateItem(restaurantId as string, sectionId, currentItem);
      await menuService.addOrUpdateItem(restaurantId as string, sectionId, itemBelow);
      
      // Refresh menu
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to move item down:', err);
      setError('Failed to reorder menu item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveSectionUp = async (sectionId: string) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      const sortedSections = [...menu.sections].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const sectionIndex = sortedSections.findIndex(section => section._id === sectionId);
      
      console.log('Moving section up:', { sectionId, sectionIndex, sortedSections: sortedSections.map(s => ({ id: s._id, name: s.name, displayOrder: s.displayOrder })) });
      
      if (sectionIndex <= 0) {
        console.log('Section already at top, cannot move up');
        return; // Already at top
      }
      
      // Swap displayOrder values with the section above
      const currentSection = sortedSections[sectionIndex];
      const sectionAbove = sortedSections[sectionIndex - 1];
      
      const tempOrder = currentSection.displayOrder || 0;
      currentSection.displayOrder = sectionAbove.displayOrder || 0;
      sectionAbove.displayOrder = tempOrder;
      
      // Update both sections
      await menuService.addOrUpdateSection(restaurantId as string, currentSection);
      await menuService.addOrUpdateSection(restaurantId as string, sectionAbove);
      
      // Refresh menu
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to move section up:', err);
      setError('Failed to reorder menu section. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveSectionDown = async (sectionId: string) => {
    if (!restaurantId || !menu) return;
    
    try {
      setIsLoading(true);
      
      const sortedSections = [...menu.sections].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const sectionIndex = sortedSections.findIndex(section => section._id === sectionId);
      
      console.log('Moving section down:', { sectionId, sectionIndex, sortedSections: sortedSections.map(s => ({ id: s._id, name: s.name, displayOrder: s.displayOrder })) });
      
      if (sectionIndex >= sortedSections.length - 1) {
        console.log('Section already at bottom, cannot move down');
        return; // Already at bottom
      }
      
      // Swap displayOrder values with the section below
      const currentSection = sortedSections[sectionIndex];
      const sectionBelow = sortedSections[sectionIndex + 1];
      
      const tempOrder = currentSection.displayOrder || 0;
      currentSection.displayOrder = sectionBelow.displayOrder || 0;
      sectionBelow.displayOrder = tempOrder;
      
      // Update both sections
      await menuService.addOrUpdateSection(restaurantId as string, currentSection);
      await menuService.addOrUpdateSection(restaurantId as string, sectionBelow);
      
      // Refresh menu
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
      setError(null);
    } catch (err) {
      console.error('Failed to move section down:', err);
      setError('Failed to reorder menu section. Please try again.');
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
      
      // Refresh the menu data to get the latest state
      const updatedMenu = await menuService.getRestaurantMenu(restaurantId as string);
      setMenu(updatedMenu);
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
        
        // Validate base price - allow 0 or missing if price points are provided
        if (item.pricePoints && Array.isArray(item.pricePoints) && item.pricePoints.length > 0) {
          // If price points exist, base price can be 0 or missing (will be set from price points)
          if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
            setJsonError(`Item "${item.name}" base price must be a positive number if provided`);
            return false;
          }
        } else {
          // If no price points, base price is required
          if (typeof item.price !== 'number' || item.price <= 0) {
            setJsonError(`Item "${item.name}" must have a valid positive base price or price points`);
            return false;
          }
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

  const handleJsonImport = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      
      if (!validateMenuJson(jsonData)) {
        return;
      }
      
      // Process the JSON data for preview
      const processedMenuData = {
        name: jsonData.name || `${restaurant?.name || 'Restaurant'} Menu`,
        description: jsonData.description || '',
        sections: jsonData.sections.map((section: any) => ({
          name: section.name,
          description: section.description || '',
          items: section.items.map((item: any) => {
            // Process price points if present
            let processedPricePoints = undefined;
            let effectivePrice = item.price;

            if (item.pricePoints && Array.isArray(item.pricePoints)) {
              // Process each price point and ensure IDs are present
              processedPricePoints = item.pricePoints.map((pp: any) => ({
                id: pp.id || pp.name.toLowerCase().replace(/\s+/g, '-'),
                name: pp.name,
                price: pp.price,
                isDefault: pp.isDefault || false
              }));

              // If no base price provided, use the first price point or default price point
              if (!item.price || item.price === 0) {
                const defaultPricePoint = processedPricePoints.find((pp: any) => pp.isDefault);
                effectivePrice = defaultPricePoint ? defaultPricePoint.price : processedPricePoints[0].price;
              }
            }

            return {
              name: item.name,
              description: item.description || '',
              price: effectivePrice, // Use processed effective price
              pricePoints: processedPricePoints, // Include processed price points
              category: item.category || '',
              available: item.available !== undefined ? item.available : true,
              modifications: item.modifications || [],
              customizations: item.customizations || [],
              image: item.image || undefined,
              imageUrl: item.imageUrl || undefined
            };
          })
        }))
      };
      
      // Show preview instead of importing directly
      setImportPreview(processedMenuData);
      setShowImportPreview(true);
      setJsonError(null);
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      if (err instanceof SyntaxError) {
        setJsonError('Invalid JSON format. Please check your JSON syntax.');
      } else {
        setJsonError('Failed to process JSON. Please try again.');
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !restaurantId) return;
    
    try {
      setIsLoading(true);
      
      const menuData = {
        restaurant: restaurantId as string,
        ...importPreview,
        active: true
      };
      
      const result = await menuService.createOrUpdateMenu(restaurantId as string, menuData);
      
      setMenu(result);
      setJsonImportModal(false);
      setShowImportPreview(false);
      setImportPreview(null);
      setJsonInput('');
      setError(null);
    } catch (err) {
      console.error('Failed to import menu:', err);
      setJsonError('Failed to import menu. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportPreview(null);
    setJsonImportModal(false);
    setCsvImportModal(false);
    setCsvFile(null);
    setCsvError(null);
    setCsvParseResult(null);
  };

  // CSV Import handlers
  const handleImportCsv = () => {
    setCsvImportModal(true);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvFile(file || null);
    setCsvError(null);
    setCsvParseResult(null);
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvError('Please select a CSV file');
      return;
    }

    try {
      const csvContent = await csvFile.text();
      const parseResult = parseCsvToMenuItems(csvContent);
      
      setCsvParseResult(parseResult);
      
      if (!parseResult.success) {
        setCsvError(`Failed to parse CSV: ${parseResult.errors.join(', ')}`);
        return;
      }

      if (parseResult.warnings.length > 0) {
        console.warn('CSV Import Warnings:', parseResult.warnings);
      }

      // Convert parsed CSV data to menu format for preview
      const menuData = {
        name: `${restaurant?.name || 'Restaurant'} Menu`,
        description: 'Imported from CSV',
        sections: [
          {
            name: 'Imported Items',
            description: 'Items imported from CSV file',
            items: parseResult.data || []
          }
        ]
      };

      // Show preview
      setImportPreview(menuData);
      setShowImportPreview(true);
      setCsvError(null);
    } catch (error: any) {
      setCsvError(`Failed to read CSV file: ${error.message}`);
    }
  };

  const handleDownloadCsvTemplate = () => {
    downloadCsvTemplate();
  };

  const handleExportJson = () => {
    if (!menu) return;
    
    // Process menu data for clean export with price points
    const exportData = {
      name: menu.name,
      description: menu.description || '',
      sections: menu.sections.map(section => ({
        name: section.name,
        description: section.description || '',
        items: section.items.map(item => {
          // Create clean item object for export
          const exportItem: any = {
            name: item.name,
            description: item.description || '',
            price: item.price
          };

          // Include price points if they exist
          if (item.pricePoints && item.pricePoints.length > 0) {
            exportItem.pricePoints = item.pricePoints.map(pp => ({
              id: pp.id,
              name: pp.name,
              price: pp.price,
              ...(pp.isDefault && { isDefault: pp.isDefault })
            }));
          }

          // Include optional fields only if they have values
          if (item.category) exportItem.category = item.category;
          if (item.available !== undefined) exportItem.available = item.available;
          if (item.modifications && item.modifications.length > 0) exportItem.modifications = item.modifications;
          if (item.customizations && item.customizations.length > 0) exportItem.customizations = item.customizations;
          if (item.image) exportItem.image = item.image;
          if (item.imageUrl) exportItem.imageUrl = item.imageUrl;

          return exportItem;
        })
      }))
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
    setModalItem(item);
    setModalSectionId(sectionId);
    setShowItemModal(true);
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
          <h1 className="text-3xl font-bold text-gray-800" data-cy="restaurant-menu-title">{restaurant?.name} Menu</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/dashboard/restaurants/${restaurantId}`)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              data-cy="back-to-restaurant-button"
            >
              Back to Restaurant
            </button>
            <button
              onClick={handleAddSection}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              data-cy="add-section-button"
            >
              Add Section
            </button>
            <button
              onClick={handleImportJson}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Import JSON
            </button>
            <button
              onClick={handleImportCsv}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Import CSV
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
              <button
                onClick={handleImportCsv}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Import from CSV
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
                onMoveSectionUp={handleMoveSectionUp}
                onMoveSectionDown={handleMoveSectionDown}
                data-cy="menu-section-list"
              />
            </div>
            
            {/* Menu Items - Right Column */}
            <div className="md:col-span-2">
              {activeSection ? (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800" data-cy="active-section-title">
                      {menu.sections.find(s => s._id === activeSection)?.name || 'Section'}
                    </h2>
                    <button
                      onClick={() => handleAddItem(activeSection)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                      data-cy="add-item-button"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  {menu.sections.find(s => s._id === activeSection)?.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No items in this section yet. Add your first item!
                    </div>
                  ) : (
                    <div className="space-y-4" data-cy="menu-item-list">
                      {menu.sections
                        .find(s => s._id === activeSection)
                        ?.items.sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(item => (
                          <div key={item._id} className="border border-gray-200 rounded-lg p-4" data-cy={`menu-item-${item._id}`}>
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
                                    
                                    {/* Display price points if available, otherwise show single price */}
                                    {item.pricePoints && item.pricePoints.length > 0 ? (
                                      <div className="mt-1">
                                        <div className="flex flex-wrap gap-2">
                                          {item.pricePoints.map((pricePoint, index) => (
                                            <span
                                              key={pricePoint.id}
                                              className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${
                                                pricePoint.isDefault 
                                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                                              }`}
                                            >
                                              {pricePoint.name}: ${pricePoint.price.toFixed(2)}
                                              {pricePoint.isDefault && (
                                                <span className="ml-1 text-xs font-semibold">(default)</span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-gray-800 font-medium mt-1">${(item.price || 0).toFixed(2)}</p>
                                    )}
                                    
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
                                  {/* Reorder buttons */}
                                  <div className="flex flex-col space-y-1">
                                    <button
                                      onClick={() => handleMoveItemUp(activeSection!, item._id!)}
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move up"
                                      disabled={menu.sections.find(s => s._id === activeSection)?.items.sort((a, b) => (a.order || 0) - (b.order || 0))[0]._id === item._id}
                                    >
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveItemDown(activeSection!, item._id!)}
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move down"
                                      disabled={(() => {
                                        const sortedItems = menu.sections.find(s => s._id === activeSection)?.items.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
                                        return sortedItems[sortedItems.length - 1]?._id === item._id;
                                      })()}
                                    >
                                      <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  
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
                                    onClick={() => handleEditItem(activeSection!, item)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit item"
                                    data-cy="edit-item-button"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(activeSection, item._id!)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete item"
                                    data-cy="delete-item-button"
                                  >
                                    <TrashIcon className="h-5 w-5" />
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
                    Preview Import
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
        
        {/* CSV Import Modal */}
        {csvImportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Import Menu from CSV
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  </div>

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="text-orange-600 hover:text-orange-800 text-sm underline"
                    >
                      Download CSV Template
                    </button>
                  </div>

                  {csvFile && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Selected file:</strong> {csvFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}

                  {csvParseResult && csvParseResult.warnings.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside">
                        {csvParseResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {csvError && (
                    <div className="mt-2 text-sm text-red-600">
                      {csvError}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCsvImport}
                    disabled={!csvFile}
                  >
                    Preview Import
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setCsvImportModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Preview Modal */}
        <ImportPreview
          isOpen={showImportPreview}
          menuData={importPreview}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
          isLoading={isLoading}
        />
        
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

        <MenuItemModal
          isOpen={showItemModal}
          item={modalItem}
          onSave={handleSaveItem}
          onCancel={handleCloseItemModal}
          isUploading={uploadingItemId !== null}
          uploadProgress={uploadProgress}
        />
      </div>
    </Layout>
  );
};

export default MenuManagement; 