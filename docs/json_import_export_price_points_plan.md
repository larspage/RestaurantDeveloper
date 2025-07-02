# JSON Import/Export Enhancement with Price Points Support

## Project Overview

This document outlines the implementation plan for enhancing the JSON Import/Export functionality with multiple price points support for menu items. The project is broken down into Level 1 complexity tasks to ensure manageable implementation.

## Core Requirement

**Current State**: Each MenuItem has a single `price: number`  
**Target State**: Each MenuItem can have multiple pricing options (Small/Medium/Large, Regular/Premium, etc.)

## Data Structure Changes

### New Price Point Interface
```typescript
export interface PricePoint {
  id: string;
  name: string; // "Small", "Medium", "Large", "Regular", "Premium"
  price: number;
  isDefault?: boolean;
}
```

### Updated MenuItem Interface
```typescript
export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  // Keep single price for backward compatibility
  price: number;
  // Add new price points array
  pricePoints?: PricePoint[];
  available: boolean;
  // ... rest unchanged
}
```

## Level 1 Task Breakdown

### Task 1: Price Points Data Structure (1 day) ✅ COMPLETED
**Complexity**: Level 1 - Simple data structure addition

**Objective**: Add price points support to MenuItem interface while maintaining backward compatibility

**Implementation Steps**:
1. ✅ Update `src/types/MenuItem.ts` with PricePoint interface
2. ✅ Add optional pricePoints array to MenuItem and MenuItemInput interfaces
3. ✅ Ensure TypeScript compilation passes
4. ✅ Test backward compatibility with existing single-price items

**Files Modified**:
- ✅ `src/types/MenuItem.ts`

**Success Criteria**:
- ✅ TypeScript compiles without errors
- ✅ Existing code continues to work
- ✅ New pricePoints field is optional

**Completion Notes**:
- Added PricePoint interface with id, name, price, and optional isDefault fields
- Updated MenuItem and MenuItemInput interfaces with optional pricePoints array
- Maintained backward compatibility with existing single price field
- All tests pass and TypeScript compilation successful
- Cart.ts automatically inherits new pricePoints field through MenuItem extension

### Task 2: Basic JSON Schema Validation (1 day) ✅ COMPLETED
**Complexity**: Level 1 - Simple validation rules

**Objective**: Add validation for price points in JSON imports with clear error messages

**Implementation Steps**:
1. ✅ Create validation function for price points
2. ✅ Integrate with existing JSON import validation
3. ✅ Add specific error messages for price point validation failures
4. ✅ Test with valid and invalid price point data

**Files Modified**:
- ✅ `src/pages/dashboard/menus/[restaurantId].tsx` (validation functions)

**Validation Rules**:
- ✅ Price point name is required
- ✅ Price point price must be a positive number
- ✅ At least one price point if pricePoints array exists
- ✅ No duplicate price point names within an item
- ✅ Auto-generate price point IDs if missing
- ✅ Validate isDefault field if present
- ✅ Enhanced base price validation (positive numbers)
- ✅ Validate available and modifications fields

**Success Criteria**:
- ✅ Invalid price points are rejected with clear messages
- ✅ Valid price points pass validation
- ✅ Validation integrates with existing JSON import

**Completion Notes**:
- Added comprehensive `validatePricePoints` function with detailed error messages
- Enhanced existing `validateMenuJson` to support price points validation
- Added validation for duplicate price point names within items
- Auto-generates price point IDs from names if missing
- Validates all price point fields with specific error messages including item and section context
- Updated `handleJsonImport` to process and include price points in imported data
- All existing tests pass, maintaining backward compatibility
- Enhanced validation provides clear, actionable error messages for users

### Task 3: JSON Import Price Points Support (1 day)
**Complexity**: Level 1 - Simple JSON parsing addition

**Objective**: Update JSON import to handle price points while maintaining fallback to single price

**Implementation Steps**:
1. Update `handleJsonImport` function to process price points
2. Set default price from first price point if no base price provided
3. Maintain backward compatibility with single-price JSON
4. Test import with both old and new JSON formats

**Files Modified**:
- `src/pages/dashboard/menus/[restaurantId].tsx` (handleJsonImport function)

**JSON Format Support**:
```json
{
  "name": "Pizza",
  "price": 12.99,
  "pricePoints": [
    {"id": "small", "name": "Small", "price": 9.99, "isDefault": true},
    {"id": "medium", "name": "Medium", "price": 12.99},
    {"id": "large", "name": "Large", "price": 15.99}
  ]
}
```

**Success Criteria**:
- JSON with price points imports successfully
- JSON without price points still works (backward compatibility)
- Default price is set correctly

### Task 4: JSON Export Price Points Support (0.5 day)
**Complexity**: Level 1 - Simple JSON serialization addition

**Objective**: Include price points in JSON export with clean, readable structure

**Implementation Steps**:
1. Update `handleExportJson` function to include price points
2. Ensure exported JSON maintains clean structure
3. Test export and re-import cycle
4. Verify file download functionality

**Files Modified**:
- `src/pages/dashboard/menus/[restaurantId].tsx` (handleExportJson function)

**Success Criteria**:
- Exported JSON includes price points when present
- Exported JSON is valid and importable
- File downloads successfully

### Task 5: Basic Import Preview (1 day)
**Complexity**: Level 1 - Simple before/after comparison

**Objective**: Show simple preview of what will be imported with price points display

**Implementation Steps**:
1. Create ImportPreview component
2. Display items with their price points in readable format
3. Add preview to import workflow
4. Include confirm/cancel options

**Files Created**:
- `src/components/ImportPreview.tsx`

**Files Modified**:
- `src/pages/dashboard/menus/[restaurantId].tsx` (integrate preview)

**Success Criteria**:
- Preview shows all items with their price points
- Preview is readable and clear
- User can approve or cancel import

### Task 6: Shopping Cart Price Point Integration (1 day)
**Complexity**: Level 1 - Simple cart item structure update

**Objective**: Update cart to handle items with selected price points

**Implementation Steps**:
1. Update CartItem interface to include selectedPricePoint
2. Modify cart context to handle price point selection
3. Update cart calculations to use effective price
4. Maintain compatibility with single-price items

**Files Modified**:
- `src/context/CartContext.tsx`
- `src/components/ShoppingCart.tsx`
- `src/types/Cart.ts`

**New Cart Item Structure**:
```typescript
interface CartItem extends MenuItem {
  quantity: number;
  selectedPricePoint?: PricePoint;
  effectivePrice: number; // The actual price to use
}
```

**Success Criteria**:
- Cart displays correct price for selected price point
- Cart calculations use effective price
- Single-price items continue to work

### Task 7: Menu Display Price Point Selection (1 day)
**Complexity**: Level 1 - Simple UI component addition

**Objective**: Show price point options on menu display and allow customer selection

**Implementation Steps**:
1. Create PricePointSelector component
2. Integrate with menu item display
3. Update "Add to Cart" functionality to use selected price point
4. Default to first/default price point

**Files Created**:
- `src/components/PricePointSelector.tsx`

**Files Modified**:
- `src/pages/restaurants/[restaurantId]/index.tsx` (customer menu view)

**Success Criteria**:
- Price points display as dropdown/options
- Selection updates displayed price
- "Add to Cart" uses selected price point

### Task 8: CSV Import Basic Support (1 day)
**Complexity**: Level 1 - Simple CSV parsing with fixed format

**Objective**: Support basic CSV import with predefined columns including price points

**Implementation Steps**:
1. Create simple CSV parser for fixed format
2. Handle price points in CSV format: "Small:8.99,Medium:10.99,Large:12.99"
3. Create CSV template download functionality
4. Add basic error handling for malformed CSV

**Files Modified**:
- `src/pages/dashboard/menus/[restaurantId].tsx` (add CSV import)
- `src/utils/csvParser.ts` (new utility file)

**CSV Format**:
```csv
Name,Description,Price,PricePoints,Category,Available
Pizza,Delicious pizza,12.99,"Small:9.99,Medium:12.99,Large:15.99",Main,true
```

**Success Criteria**:
- CSV with price points imports correctly
- CSV template downloads with example format
- Simple error handling for malformed CSV

## Implementation Timeline

### Phase 1: Foundation (2 days)
- Task 1: Price Points Data Structure (1 day)
- Task 2: Basic JSON Schema Validation (1 day)

### Phase 2: Import/Export (2.5 days)
- Task 3: JSON Import Price Points Support (1 day)
- Task 4: JSON Export Price Points Support (0.5 day)
- Task 5: Basic Import Preview (1 day)

### Phase 3: Integration (2 days)
- Task 6: Shopping Cart Price Point Integration (1 day)
- Task 7: Menu Display Price Point Selection (1 day)

### Phase 4: Enhancement (1 day)
- Task 8: CSV Import Basic Support (1 day)

**Total Estimated Time**: 7.5 days

## Testing Strategy

### Unit Tests Required
- Price point validation functions
- JSON import/export with price points
- Cart calculations with price points
- CSV parsing functionality

### Integration Tests Required
- End-to-end import/export cycle
- Cart to order workflow with price points
- Menu display to cart addition with price points

### Compatibility Tests Required
- Backward compatibility with single-price items
- Legacy JSON import/export
- Existing cart functionality

## Risk Mitigation

### Data Migration
- **Risk**: Existing menu items without price points
- **Mitigation**: Optional price points field, fallback to single price

### Cart Compatibility
- **Risk**: Breaking existing cart functionality
- **Mitigation**: Maintain effectivePrice field, gradual rollout

### Performance Impact
- **Risk**: Additional data in menu items
- **Mitigation**: Optional loading, efficient data structures

## Success Metrics

### Functional Requirements
- [ ] Menu items can have multiple price points
- [ ] JSON import/export supports price points
- [ ] Shopping cart handles selected price points correctly
- [ ] Menu display shows price point options
- [ ] Basic CSV import works with price points
- [ ] Import preview shows price point changes

### Compatibility Requirements
- [ ] Existing single-price items continue to work
- [ ] Backward compatibility with old JSON exports
- [ ] Shopping cart calculations remain accurate
- [ ] No breaking changes to existing functionality

## Future Enhancements (Out of Scope)

- Advanced CSV column mapping
- Excel file import support
- Bulk price point editing
- Price point templates
- Advanced validation rules
- Price point analytics

## Dependencies

### Frontend Dependencies
- Existing menu management system
- Cart context and components
- JSON import/export functionality

### Backend Dependencies
- Menu API endpoints (may need updates for price points)
- Database schema (may need migration for price points)

## Conclusion

This plan breaks down the complex JSON Import/Export with Price Points enhancement into manageable Level 1 tasks. Each task has clear objectives, success criteria, and estimated timeframes. The approach maintains backward compatibility while adding powerful new functionality for restaurant menu management. 