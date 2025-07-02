// CSV Parser utility for menu import with price points support
import { MenuItem, PricePoint } from '../types/MenuItem';

export interface CsvRow {
  Name: string;
  Description: string;
  Price: string;
  PricePoints: string;
  Category: string;
  Available: string;
  Modifications?: string;
  Customizations?: string;
}

export interface CsvParseResult {
  success: boolean;
  data?: MenuItem[];
  errors: string[];
  warnings: string[];
}

// Parse price points from CSV format: "Small:8.99,Medium:10.99,Large:12.99"
function parsePricePoints(pricePointsStr: string): PricePoint[] {
  if (!pricePointsStr || pricePointsStr.trim() === '') {
    return [];
  }

  const pricePoints: PricePoint[] = [];
  const pairs = pricePointsStr.split(',');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;
    
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid price point format: "${pair}". Expected format: "Name:Price"`);
    }
    
    const name = pair.substring(0, colonIndex).trim();
    const priceStr = pair.substring(colonIndex + 1).trim();
    const price = parseFloat(priceStr);
    
    if (!name) {
      throw new Error(`Empty price point name in: "${pair}"`);
    }
    
    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price for "${name}": "${priceStr}". Must be a positive number.`);
    }
    
    // Generate ID from name
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    pricePoints.push({
      id,
      name,
      price,
      isDefault: i === 0 // First price point is default
    });
  }
  
  return pricePoints;
}

// Parse modifications/customizations from CSV format: "Option1,Option2,Option3"
function parseStringArray(str: string): string[] {
  if (!str || str.trim() === '') {
    return [];
  }
  
  return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

// Parse CSV content into menu items
export function parseCsvToMenuItems(csvContent: string): CsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const menuItems: MenuItem[] = [];
  
  try {
    // Split into lines and remove empty lines
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty'],
        warnings: []
      };
    }
    
    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Validate required headers
    const requiredHeaders = ['Name', 'Description', 'Price', 'PricePoints', 'Category', 'Available'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      return {
        success: false,
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
        warnings: []
      };
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i];
      
      try {
        // Parse CSV line handling quoted fields with commas
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        if (values.length < requiredHeaders.length) {
          errors.push(`Line ${lineNumber}: Not enough columns (expected at least ${requiredHeaders.length}, got ${values.length})`);
          continue;
        }
        
        // Create row object
        const row: CsvRow = {
          Name: values[headers.indexOf('Name')] || '',
          Description: values[headers.indexOf('Description')] || '',
          Price: values[headers.indexOf('Price')] || '',
          PricePoints: values[headers.indexOf('PricePoints')] || '',
          Category: values[headers.indexOf('Category')] || '',
          Available: values[headers.indexOf('Available')] || '',
        };
        
        // Add optional fields if present
        const modIndex = headers.indexOf('Modifications');
        if (modIndex !== -1 && values[modIndex]) {
          row.Modifications = values[modIndex];
        }
        
        const custIndex = headers.indexOf('Customizations');
        if (custIndex !== -1 && values[custIndex]) {
          row.Customizations = values[custIndex];
        }
        
        // Validate required fields
        if (!row.Name) {
          errors.push(`Line ${lineNumber}: Name is required`);
          continue;
        }
        
        // Parse price
        let basePrice = 0;
        if (row.Price) {
          basePrice = parseFloat(row.Price);
          if (isNaN(basePrice) || basePrice < 0) {
            errors.push(`Line ${lineNumber}: Invalid price "${row.Price}". Must be a non-negative number.`);
            continue;
          }
        }
        
        // Parse price points
        let pricePoints: PricePoint[] = [];
        let effectivePrice = basePrice;
        
        try {
          pricePoints = parsePricePoints(row.PricePoints);
          
          // If price points exist but no base price, use first price point
          if (pricePoints.length > 0 && basePrice === 0) {
            const defaultPricePoint = pricePoints.find(pp => pp.isDefault) || pricePoints[0];
            effectivePrice = defaultPricePoint.price;
            warnings.push(`Line ${lineNumber}: No base price provided, using first price point ($${effectivePrice.toFixed(2)})`);
          }
        } catch (pricePointError: any) {
          errors.push(`Line ${lineNumber}: ${pricePointError.message}`);
          continue;
        }
        
        // Parse available status
        const available = row.Available.toLowerCase() === 'true' || row.Available === '1';
        
        // Parse modifications and customizations
        const modifications = row.Modifications ? parseStringArray(row.Modifications) : [];
        const customizations = row.Customizations ? parseStringArray(row.Customizations) : [];
        
        // Create menu item
        const menuItem: MenuItem = {
          _id: `csv-import-${Date.now()}-${i}`, // Temporary ID for import
          name: row.Name,
          description: row.Description,
          price: effectivePrice,
          category: row.Category || undefined,
          available,
          modifications: modifications.length > 0 ? modifications : undefined,
          customizations: customizations.length > 0 ? customizations : undefined,
        };
        
        // Add price points if present
        if (pricePoints.length > 0) {
          menuItem.pricePoints = pricePoints;
        }
        
        menuItems.push(menuItem);
        
      } catch (error: any) {
        errors.push(`Line ${lineNumber}: ${error.message}`);
      }
    }
    
    // Final validation
    if (menuItems.length === 0 && errors.length > 0) {
      return {
        success: false,
        errors,
        warnings
      };
    }
    
    return {
      success: true,
      data: menuItems,
      errors,
      warnings
    };
    
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse CSV: ${error.message}`],
      warnings: []
    };
  }
}

// Generate CSV template for download
export function generateCsvTemplate(): string {
  const headers = [
    'Name',
    'Description', 
    'Price',
    'PricePoints',
    'Category',
    'Available',
    'Modifications',
    'Customizations'
  ];
  
  const examples = [
    [
      'Margherita Pizza',
      'Classic tomato sauce with fresh mozzarella and basil',
      '16.99',
      'Personal:12.99,Medium:16.99,Large:21.99',
      'Pizza',
      'true',
      'Thin crust,Thick crust,Extra cheese',
      'No cheese,Extra sauce'
    ],
    [
      'Caesar Salad',
      'Crisp romaine lettuce with parmesan and croutons',
      '12.99',
      'Half:8.99,Full:12.99',
      'Salad',
      'true',
      'No croutons,Extra dressing',
      'Add chicken,Add shrimp'
    ],
    [
      'Classic Burger',
      'Beef patty with lettuce, tomato, and special sauce',
      '14.99',
      '',
      'Main',
      'true',
      'No pickles,Extra sauce',
      ''
    ]
  ];
  
  // Create CSV content
  const csvLines = [headers.join(',')];
  
  examples.forEach(example => {
    // Quote fields that contain commas
    const quotedExample = example.map(field => 
      field.includes(',') ? `"${field}"` : field
    );
    csvLines.push(quotedExample.join(','));
  });
  
  return csvLines.join('\n');
}

// Download CSV template
export function downloadCsvTemplate() {
  const csvContent = generateCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'menu-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}