import menuService from '../../services/menuService';
import api from '../../services/api';

// Mock the API module
jest.mock('../../services/api');

describe('menuService', () => {
  const mockRestaurantId = 'test-restaurant-id';
  const mockSectionId = 'test-section-id';
  const mockItemId = 'test-item-id';
  
  const mockMenu = {
    _id: 'test-menu-id',
    restaurant: mockRestaurantId,
    name: 'Test Menu',
    sections: [
      {
        _id: mockSectionId,
        name: 'Appetizers',
        description: 'Start your meal right',
        items: [
          {
            _id: mockItemId,
            name: 'Mozzarella Sticks',
            description: 'Crispy outside, gooey inside',
            price: 8.99,
            category: 'Fried',
            available: true,
          },
        ],
      },
    ],
    active: true,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('getRestaurantMenu should fetch menu data', async () => {
    // Mock API response
    (api.get as jest.Mock).mockResolvedValue({ data: mockMenu });
    
    // Call the service
    const result = await menuService.getRestaurantMenu(mockRestaurantId);
    
    // Verify API was called correctly
    expect(api.get).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`);
    
    // Verify result
    expect(result).toEqual(mockMenu);
  });
  
  it('createOrUpdateMenu should update menu data', async () => {
    // Mock API response
    (api.post as jest.Mock).mockResolvedValue({ data: mockMenu });
    
    // Call the service
    const result = await menuService.createOrUpdateMenu(mockRestaurantId, mockMenu);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}`, mockMenu);
    
    // Verify result
    expect(result).toEqual(mockMenu);
  });
  
  it('addOrUpdateSection should add a section to the menu', async () => {
    const newSection = {
      name: 'Desserts',
      description: 'Sweet treats',
      items: [],
    };
    
    // Mock API response
    const updatedMenu = {
      ...mockMenu,
      sections: [...mockMenu.sections, { _id: 'new-section-id', ...newSection }],
    };
    (api.post as jest.Mock).mockResolvedValue({ data: updatedMenu });
    
    // Call the service
    const result = await menuService.addOrUpdateSection(mockRestaurantId, newSection);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections`, newSection);
    
    // Verify result
    expect(result).toEqual(updatedMenu);
  });
  
  it('deleteSection should remove a section from the menu', async () => {
    // Mock API response
    (api.delete as jest.Mock).mockResolvedValue({ data: {} });
    
    // Call the service
    await menuService.deleteSection(mockRestaurantId, mockSectionId);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(`/menus/${mockRestaurantId}/sections/${mockSectionId}`);
  });
  
  it('addOrUpdateItem should add an item to a section', async () => {
    const newItem = {
      name: 'Chocolate Cake',
      description: 'Rich and decadent',
      price: 6.99,
      category: 'Dessert',
      available: true,
    };
    
    // Mock API response
    const addedItem = { _id: 'new-item-id', ...newItem };
    (api.post as jest.Mock).mockResolvedValue({ data: addedItem });
    
    // Call the service
    const result = await menuService.addOrUpdateItem(mockRestaurantId, mockSectionId, newItem);
    
    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items`,
      newItem
    );
    
    // Verify result
    expect(result).toEqual(addedItem);
  });
  
  it('deleteItem should remove an item from a section', async () => {
    // Mock API response
    (api.delete as jest.Mock).mockResolvedValue({ data: {} });
    
    // Call the service
    await menuService.deleteItem(mockRestaurantId, mockSectionId, mockItemId);
    
    // Verify API was called correctly
    expect(api.delete).toHaveBeenCalledWith(
      `/menus/${mockRestaurantId}/sections/${mockSectionId}/items/${mockItemId}`
    );
  });
  
  it('importMenuFromJson should call createOrUpdateMenu', async () => {
    // Create a spy on createOrUpdateMenu
    const spy = jest.spyOn(menuService, 'createOrUpdateMenu');
    spy.mockResolvedValue(mockMenu);
    
    const jsonData = {
      name: 'Imported Menu',
      sections: [
        {
          name: 'Desserts',
          description: 'Sweet treats',
          items: [
            {
              name: 'Chocolate Cake',
              description: 'Rich and decadent',
              price: 6.99,
              category: 'Dessert',
              available: true,
            },
          ],
        },
      ],
    };
    
    // Call the service
    const result = await menuService.importMenuFromJson(mockRestaurantId, jsonData);
    
    // Verify createOrUpdateMenu was called correctly
    expect(spy).toHaveBeenCalledWith(mockRestaurantId, jsonData);
    
    // Verify result
    expect(result).toEqual(mockMenu);
    
    // Restore the original implementation
    spy.mockRestore();
  });
}); 