/// <reference types="jest" />
import '@testing-library/jest-dom';
import { 
  parseCsvToMenuItems, 
  generateCsvTemplate, 
  downloadCsvTemplate,
  CsvParseResult,
  CsvRow 
} from '../../utils/csvParser';
import { MenuItem, PricePoint } from '../../types/MenuItem';

// Mock DOM methods for downloadCsvTemplate
const mockCreateElement = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

// Mock document and URL
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  writable: true,
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

describe('CSV Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCsvToMenuItems', () => {
    describe('Basic CSV Parsing', () => {
      it('should parse valid CSV with all fields', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications,Customizations
Margherita Pizza,Classic tomato sauce with fresh mozzarella,16.99,Personal:12.99,Pizza,true,Thin crust,No cheese`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.errors).toHaveLength(0);
        
        const item = result.data![0];
        expect(item.name).toBe('Margherita Pizza');
        expect(item.description).toBe('Classic tomato sauce with fresh mozzarella');
        expect(item.price).toBe(16.99);
        expect(item.category).toBe('Pizza');
        expect(item.available).toBe(true);
        expect(item.modifications).toEqual(['Thin crust']);
        expect(item.customizations).toEqual(['No cheese']);
        expect(item.pricePoints).toEqual([
          { id: 'personal', name: 'Personal', price: 12.99, isDefault: true }
        ]);
      });

      it('should parse CSV with multiple price points', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Delicious pizza,16.99,"Small:12.99,Medium:16.99,Large:21.99",Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].pricePoints).toEqual([
          { id: 'small', name: 'Small', price: 12.99, isDefault: true },
          { id: 'medium', name: 'Medium', price: 16.99, isDefault: false },
          { id: 'large', name: 'Large', price: 21.99, isDefault: false }
        ]);
      });

      it('should parse CSV with multiple items', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Delicious pizza,16.99,Small:12.99,Pizza,true
Burger,Tasty burger,14.99,,Main,false`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data![0].name).toBe('Pizza');
        expect(result.data![1].name).toBe('Burger');
        expect(result.data![1].available).toBe(false);
      });

      it('should handle CSV with quoted fields containing commas', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications
"Caesar Salad","Fresh lettuce, parmesan, croutons",12.99,Half:8.99,Salad,true,"No croutons,Extra dressing"`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].description).toBe('Fresh lettuce, parmesan, croutons');
        expect(result.data![0].modifications).toEqual(['No croutons', 'Extra dressing']);
      });

      it('should handle empty optional fields', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications,Customizations
Burger,Simple burger,14.99,,,Main,true,,`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].category).toBeUndefined();
        expect(result.data![0].modifications).toBeUndefined();
        expect(result.data![0].customizations).toBeUndefined();
        expect(result.data![0].pricePoints).toBeUndefined();
      });

      it('should handle truly empty optional fields (no columns)', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Simple burger,14.99,,,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].category).toBeUndefined();
        expect(result.data![0].modifications).toBeUndefined();
        expect(result.data![0].customizations).toBeUndefined();
        expect(result.data![0].pricePoints).toBeUndefined();
      });
    });

    describe('Price Point Parsing', () => {
      it('should parse price points with special characters in names', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Coffee,Great coffee,3.99,"8 oz:2.99,12 oz:3.99,16 oz:4.99",Beverage,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].pricePoints).toEqual([
          { id: '8-oz', name: '8 oz', price: 2.99, isDefault: true },
          { id: '12-oz', name: '12 oz', price: 3.99, isDefault: false },
          { id: '16-oz', name: '16 oz', price: 4.99, isDefault: false }
        ]);
      });

      it('should use first price point as default price when no base price', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,0,Small:12.99,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].price).toBe(12.99);
        expect(result.warnings).toContain('Line 2: No base price provided, using first price point ($12.99)');
      });

      it('should handle empty price points string', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Simple burger,14.99,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].pricePoints).toBeUndefined();
      });

      it('should handle price points with whitespace', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,16.99," Small : 12.99 , Medium : 16.99 ",Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].pricePoints).toEqual([
          { id: 'small', name: 'Small', price: 12.99, isDefault: true },
          { id: 'medium', name: 'Medium', price: 16.99, isDefault: false }
        ]);
      });
    });

    describe('Array Field Parsing', () => {
      it('should parse modifications and customizations arrays', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications,Customizations
Burger,Tasty burger,14.99,,Main,true,"No pickles,Extra sauce","Add bacon,Add cheese"`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].modifications).toEqual(['No pickles', 'Extra sauce']);
        expect(result.data![0].customizations).toEqual(['Add bacon', 'Add cheese']);
      });

      it('should handle single item arrays', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications,Customizations
Burger,Tasty burger,14.99,,Main,true,No pickles,Add bacon`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].modifications).toEqual(['No pickles']);
        expect(result.data![0].customizations).toEqual(['Add bacon']);
      });

      it('should handle arrays with empty items', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available,Modifications
Burger,Tasty burger,14.99,,Main,true,"No pickles,,Extra sauce,"`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].modifications).toEqual(['No pickles', 'Extra sauce']);
      });
    });

    describe('Boolean Field Parsing', () => {
      it('should parse available as true for "true"', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,14.99,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].available).toBe(true);
      });

      it('should parse available as true for "1"', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,14.99,,Main,1`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].available).toBe(true);
      });

      it('should parse available as false for other values', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,14.99,,Main,false`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].available).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle empty CSV content', () => {
        const result = parseCsvToMenuItems('');

        expect(result.success).toBe(false);
        expect(result.errors).toContain('CSV file is empty');
      });

      it('should handle CSV with only whitespace', () => {
        const result = parseCsvToMenuItems('   \n  \n  ');

        expect(result.success).toBe(false);
        expect(result.errors).toContain('CSV file is empty');
      });

      it('should handle missing required headers', () => {
        const csvContent = `Name,Description,Price
Burger,Tasty burger,14.99`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Missing required headers: PricePoints, Category, Available');
      });

      it('should handle rows with insufficient columns', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Not enough columns (expected at least 6, got 2)');
      });

      it('should handle missing required name field', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
,Great description,14.99,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Name is required');
      });

      it('should handle invalid price values', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,invalid,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Invalid price "invalid". Must be a non-negative number.');
      });

      it('should handle negative price values', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,-5.99,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Invalid price "-5.99". Must be a non-negative number.');
      });

      it('should handle invalid price point format', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,16.99,Small12.99,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Invalid price point format: "Small12.99". Expected format: "Name:Price"');
      });

      it('should handle empty price point names', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,16.99,:12.99,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Empty price point name in: ":12.99"');
      });

      it('should handle invalid price point prices', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,16.99,Small:invalid,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Invalid price for "Small": "invalid". Must be a positive number.');
      });

      it('should handle zero price point prices', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,Great pizza,16.99,Small:0,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Line 2: Invalid price for "Small": "0". Must be a positive number.');
      });

      it('should handle general parsing errors', () => {
        // Create a malformed CSV that would cause a general error
        const csvContent = 'Name,Description,Price,PricePoints,Category,Available\n"Unclosed quote,test,1.99,,Main,true';

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle CSV with only headers', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should handle very long field values', () => {
        const longDescription = 'A'.repeat(1000);
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Pizza,"${longDescription}",16.99,,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].description).toBe(longDescription);
      });

      it('should handle special characters in field values', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
"Café Latté","Espresso with steamed milk & foam",4.99,,Beverage,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].name).toBe('Café Latté');
        expect(result.data![0].description).toBe('Espresso with steamed milk & foam');
      });

      it('should handle decimal prices with many decimal places', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,14.999999,,Main,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].price).toBe(14.999999);
      });

      it('should handle zero price', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Free Sample,Try it free,0,,Sample,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0].price).toBe(0);
      });

      it('should generate unique IDs for items', () => {
        const csvContent = `Name,Description,Price,PricePoints,Category,Available
Burger,Tasty burger,14.99,,Main,true
Pizza,Great pizza,16.99,,Pizza,true`;

        const result = parseCsvToMenuItems(csvContent);

        expect(result.success).toBe(true);
        expect(result.data![0]._id).toBeDefined();
        expect(result.data![1]._id).toBeDefined();
        expect(result.data![0]._id).not.toBe(result.data![1]._id);
      });
    });
  });

  describe('generateCsvTemplate', () => {
    it('should generate a valid CSV template', () => {
      const template = generateCsvTemplate();

      expect(template).toBeDefined();
      expect(template.length).toBeGreaterThan(0);
      
      // Check that it contains required headers
      expect(template).toContain('Name,Description,Price,PricePoints,Category,Available,Modifications,Customizations');
      
      // Check that it contains example data
      expect(template).toContain('Margherita Pizza');
      expect(template).toContain('Caesar Salad');
      expect(template).toContain('Classic Burger');
    });

    it('should quote fields containing commas', () => {
      const template = generateCsvTemplate();

      // Check that fields with commas are quoted
      expect(template).toContain('"Personal:12.99,Medium:16.99,Large:21.99"');
      expect(template).toContain('"Thin crust,Thick crust,Extra cheese"');
    });

    it('should not quote fields without commas', () => {
      const template = generateCsvTemplate();

      // Check that simple fields are not quoted
      expect(template).toContain('Margherita Pizza');
      expect(template).toContain('16.99');
      expect(template).toContain('Pizza');
      expect(template).toContain('true');
    });

    it('should create parseable CSV content', () => {
      const template = generateCsvTemplate();
      const result = parseCsvToMenuItems(template);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('downloadCsvTemplate', () => {
    beforeEach(() => {
      // Reset mocks
      mockCreateElement.mockClear();
      mockCreateObjectURL.mockClear();
      mockAppendChild.mockClear();
      mockRemoveChild.mockClear();
      mockClick.mockClear();
    });

    it('should create and trigger download', () => {
      const mockLink = {
        download: true,
        setAttribute: jest.fn(),
        click: mockClick,
        style: { visibility: '' },
      };

      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      downloadCsvTemplate();

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'menu-import-template.csv');
      expect(mockLink.style.visibility).toBe('hidden');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle browsers without download support', () => {
      const mockLink = {
        download: undefined,
        setAttribute: jest.fn(),
        click: mockClick,
        style: { visibility: '' },
      };

      mockCreateElement.mockReturnValue(mockLink);

      downloadCsvTemplate();

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should create blob with correct content type', () => {
      const mockLink = {
        download: true,
        setAttribute: jest.fn(),
        click: mockClick,
        style: { visibility: '' },
      };

      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      downloadCsvTemplate();

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow from template to parsing', () => {
      // Generate template
      const template = generateCsvTemplate();
      
      // Parse the template
      const result = parseCsvToMenuItems(template);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      
      // Verify specific items from template
      const pizza = result.data!.find(item => item.name === 'Margherita Pizza');
      expect(pizza).toBeDefined();
      expect(pizza!.pricePoints).toHaveLength(3);
      
      const salad = result.data!.find(item => item.name === 'Caesar Salad');
      expect(salad).toBeDefined();
      expect(salad!.pricePoints).toHaveLength(2);
      
      const burger = result.data!.find(item => item.name === 'Classic Burger');
      expect(burger).toBeDefined();
      expect(burger!.pricePoints).toBeUndefined();
    });

    it('should handle mixed success and error scenarios', () => {
      const csvContent = `Name,Description,Price,PricePoints,Category,Available
Valid Item,Good description,12.99,Small:10.99,Main,true
,Missing name,15.99,,Main,true
Another Valid,Another good one,8.99,,Appetizer,false`;

      const result = parseCsvToMenuItems(csvContent);

      expect(result.success).toBe(true); // Should succeed despite some errors
      expect(result.data).toHaveLength(2); // Only valid items
      expect(result.errors).toHaveLength(1); // One error for missing name
      expect(result.errors[0]).toContain('Line 3: Name is required');
    });
  });
}); 