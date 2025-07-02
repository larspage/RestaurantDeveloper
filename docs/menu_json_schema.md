# Menu JSON Schema Documentation

This document defines the JSON schema for menu import/export functionality in the Restaurant Developer platform. The schema supports both traditional single-price items and enhanced price points for multiple pricing options.

## JSON Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://restaurant-developer.com/schemas/menu.json",
  "title": "Restaurant Menu",
  "description": "Schema for restaurant menu import/export with price points support",
  "type": "object",
  "required": ["name", "sections"],
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the menu",
      "minLength": 1,
      "maxLength": 100,
      "examples": ["Main Menu", "Dinner Menu", "Weekend Specials"]
    },
    "description": {
      "type": "string",
      "description": "Optional description of the menu",
      "maxLength": 500,
      "examples": ["Our signature dishes and seasonal favorites"]
    },
    "sections": {
      "type": "array",
      "description": "Array of menu sections",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/MenuSection"
      }
    }
  },
  "$defs": {
    "MenuSection": {
      "type": "object",
      "required": ["name", "items"],
      "properties": {
        "name": {
          "type": "string",
          "description": "The name of the menu section",
          "minLength": 1,
          "maxLength": 50,
          "examples": ["Appetizers", "Main Courses", "Desserts", "Beverages"]
        },
        "description": {
          "type": "string",
          "description": "Optional description of the section",
          "maxLength": 200,
          "examples": ["Start your meal with these delicious appetizers"]
        },
        "items": {
          "type": "array",
          "description": "Array of menu items in this section",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/MenuItem"
          }
        }
      }
    },
    "MenuItem": {
      "type": "object",
      "required": ["name", "description"],
      "anyOf": [
        {
          "required": ["price"]
        },
        {
          "required": ["pricePoints"]
        }
      ],
      "properties": {
        "name": {
          "type": "string",
          "description": "The name of the menu item",
          "minLength": 1,
          "maxLength": 100,
          "examples": ["Margherita Pizza", "Grilled Salmon", "Chocolate Cake"]
        },
        "description": {
          "type": "string",
          "description": "Description of the menu item",
          "maxLength": 300,
          "examples": ["Fresh mozzarella, tomato sauce, and basil on our homemade crust"]
        },
        "price": {
          "type": "number",
          "description": "Base price of the item (required if no pricePoints provided)",
          "minimum": 0,
          "multipleOf": 0.01,
          "examples": [12.99, 8.50, 15.00]
        },
        "pricePoints": {
          "type": "array",
          "description": "Array of price points for different sizes/options",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/PricePoint"
          }
        },
        "category": {
          "type": "string",
          "description": "Optional category for the item",
          "maxLength": 50,
          "examples": ["Main", "Appetizer", "Dessert", "Vegetarian", "Gluten-Free"]
        },
        "available": {
          "type": "boolean",
          "description": "Whether the item is currently available",
          "default": true
        },
        "modifications": {
          "type": "array",
          "description": "Available modifications for the item",
          "items": {
            "type": "string",
            "maxLength": 50
          },
          "examples": [["Extra cheese", "Thin crust", "No onions"]]
        },
        "customizations": {
          "type": "array",
          "description": "Available customizations for the item",
          "items": {
            "type": "string",
            "maxLength": 50
          },
          "examples": [["Gluten-free base", "Vegan cheese", "Extra spicy"]]
        },
        "image": {
          "type": "string",
          "description": "Image filename or identifier",
          "maxLength": 200
        },
        "imageUrl": {
          "type": "string",
          "description": "Full URL to the item image",
          "format": "uri",
          "examples": ["https://example.com/images/pizza.jpg"]
        }
      }
    },
    "PricePoint": {
      "type": "object",
      "required": ["name", "price"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the price point (auto-generated if not provided)",
          "pattern": "^[a-z0-9-]+$",
          "maxLength": 50,
          "examples": ["small", "medium", "large", "regular", "premium"]
        },
        "name": {
          "type": "string",
          "description": "Display name for the price point",
          "minLength": 1,
          "maxLength": 30,
          "examples": ["Small", "Medium", "Large", "Regular", "Premium", "Family Size"]
        },
        "price": {
          "type": "number",
          "description": "Price for this size/option",
          "minimum": 0,
          "multipleOf": 0.01,
          "examples": [8.99, 12.99, 16.99]
        },
        "isDefault": {
          "type": "boolean",
          "description": "Whether this is the default price point",
          "default": false
        }
      }
    }
  }
}
```

## Example JSON Documents

### Complete Menu with Price Points

```json
{
  "name": "Bella Italia Restaurant Menu",
  "description": "Authentic Italian cuisine with fresh ingredients",
  "sections": [
    {
      "name": "Pizza",
      "description": "Hand-tossed pizzas made with our signature dough",
      "items": [
        {
          "name": "Margherita Pizza",
          "description": "Fresh mozzarella, tomato sauce, and basil",
          "price": 12.99,
          "pricePoints": [
            {
              "id": "small",
              "name": "Small (10\")",
              "price": 9.99,
              "isDefault": true
            },
            {
              "id": "medium",
              "name": "Medium (12\")",
              "price": 12.99
            },
            {
              "id": "large",
              "name": "Large (16\")",
              "price": 15.99
            }
          ],
          "category": "Main",
          "available": true,
          "modifications": ["Extra cheese", "Thin crust", "Gluten-free base"],
          "customizations": ["Vegan cheese", "Extra basil"],
          "imageUrl": "https://example.com/images/margherita.jpg"
        },
        {
          "name": "Pepperoni Pizza",
          "description": "Classic pepperoni with mozzarella cheese",
          "pricePoints": [
            {
              "name": "Personal",
              "price": 8.99
            },
            {
              "name": "Large",
              "price": 16.99,
              "isDefault": true
            }
          ],
          "category": "Main",
          "available": true,
          "modifications": ["Extra pepperoni", "Light cheese"]
        }
      ]
    },
    {
      "name": "Beverages",
      "description": "Refreshing drinks to complement your meal",
      "items": [
        {
          "name": "Italian Soda",
          "description": "Sparkling water with natural fruit flavors",
          "price": 3.99,
          "pricePoints": [
            {
              "id": "regular",
              "name": "Regular",
              "price": 3.99,
              "isDefault": true
            },
            {
              "id": "large",
              "name": "Large",
              "price": 4.99
            }
          ],
          "category": "Beverage",
          "available": true,
          "customizations": ["Lemon", "Orange", "Cherry"]
        },
        {
          "name": "Espresso",
          "description": "Rich, authentic Italian espresso",
          "price": 2.50,
          "category": "Beverage",
          "available": true
        }
      ]
    }
  ]
}
```

### Legacy Format (Single Price Items)

```json
{
  "name": "Simple Cafe Menu",
  "description": "Quick and delicious options",
  "sections": [
    {
      "name": "Sandwiches",
      "items": [
        {
          "name": "Club Sandwich",
          "description": "Turkey, bacon, lettuce, tomato on toasted bread",
          "price": 8.99,
          "category": "Main",
          "available": true,
          "modifications": ["No mayo", "Extra bacon"]
        },
        {
          "name": "Veggie Wrap",
          "description": "Fresh vegetables in a spinach tortilla",
          "price": 7.99,
          "category": "Vegetarian",
          "available": true
        }
      ]
    }
  ]
}
```

### Minimal Valid Menu

```json
{
  "name": "Basic Menu",
  "sections": [
    {
      "name": "Items",
      "items": [
        {
          "name": "Simple Item",
          "description": "A basic menu item",
          "price": 5.99
        }
      ]
    }
  ]
}
```

## Validation Rules

### Required Fields
- **Menu**: `name`, `sections`
- **Section**: `name`, `items`
- **Item**: `name`, `description`, and either `price` OR `pricePoints`
- **Price Point**: `name`, `price`

### Optional Fields
- **Menu**: `description`
- **Section**: `description`
- **Item**: `category`, `available`, `modifications`, `customizations`, `image`, `imageUrl`
- **Price Point**: `id`, `isDefault`

### Data Constraints
- **Prices**: Must be positive numbers with up to 2 decimal places
- **Names**: Non-empty strings with reasonable length limits
- **IDs**: Lowercase alphanumeric with hyphens (auto-generated if not provided)
- **URLs**: Must be valid URI format
- **Arrays**: Must contain at least one item where required

### Business Logic
- Items must have either a base `price` OR `pricePoints` array (or both)
- If `pricePoints` exist without base `price`, the default or first price point will be used as base price
- Price point `id` fields are auto-generated from `name` if not provided (converted to kebab-case)
- Only one price point per item can have `isDefault: true`

## Import Behavior

### Price Point Processing
1. **ID Generation**: Missing IDs are auto-generated from names ("Large Size" → "large-size")
2. **Base Price Fallback**: If no base price provided, uses default price point or first price point
3. **Validation**: Ensures all price points have valid names and positive prices
4. **Deduplication**: Prevents duplicate price point names within the same item

### Error Handling
- Clear, contextual error messages including item and section names
- Specific validation for each field type
- Graceful handling of missing optional fields
- Backward compatibility with legacy single-price format

### Field Processing
- Empty strings converted to meaningful defaults
- Optional arrays initialized as empty if not provided
- Boolean fields default appropriately (`available` defaults to `true`)
- Image fields preserved for future upload functionality

## Export Behavior

### Clean Output
- Only exports fields that have meaningful values
- Removes internal database fields (`_id`, etc.)
- Maintains consistent structure for re-import
- Preserves all price point data accurately

### Format Optimization
- Pretty-printed JSON with 2-space indentation
- Consistent field ordering for readability
- Conditional field inclusion (no empty/null values)
- Proper file naming with restaurant context

This schema ensures robust, flexible menu data management while maintaining backward compatibility and providing clear validation rules for both import and export operations. 