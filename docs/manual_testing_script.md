# Manual Testing Script

This document provides comprehensive manual testing procedures that correspond to all automated tests in the Restaurant Developer application. It should be updated whenever new automated tests are added to maintain parity between automated and manual testing coverage.

## Test Environment Setup

### Prerequisites
1. **Local Development Environment Running:**
   - Backend server on port 3550 (`npm run dev` in backend directory)
   - Frontend server on port 3560 (`npm run dev` in root directory)
   - Local Supabase instance running (`npx supabase start`)
   - MongoDB connection available

2. **Test Data:**
   - Run seed script: `npm run seed` (from backend directory)
   - Ensure test accounts are available (see `tests/README.md`)

3. **Browser Setup:**
   - Clear browser cache and localStorage
   - Use incognito/private mode for fresh sessions
   - Developer tools open for network monitoring

## 1. Authentication Tests

### 1.1 User Registration (POST /auth/register)

**Test Case 1.1.1: Create Customer User**
1. Navigate to `/signup`
2. Fill in form:
   - Email: `newcustomer@test.com`
   - Password: `password123`
   - Name: `Test Customer`
   - Role: `Customer` (default)
3. Click "Sign Up"
4. **Expected:** Success message, redirect to login
5. **Verify:** User can login with these credentials

**Test Case 1.1.2: Create Restaurant Owner**
1. Navigate to `/signup`
2. Fill in form:
   - Email: `newowner@test.com`
   - Password: `password123`
   - Name: `Test Owner`
   - Role: `Restaurant Owner`
3. Click "Sign Up"
4. **Expected:** Success message, redirect to dashboard
5. **Verify:** User has restaurant owner permissions

**Test Case 1.1.3: Missing Required Fields**
1. Navigate to `/signup`
2. Leave email field empty
3. Fill other fields
4. Click "Sign Up"
5. **Expected:** Error message "Missing required fields"

**Test Case 1.1.4: Invalid Role Handling**
1. Use browser dev tools to modify role value to invalid option
2. Submit form
3. **Expected:** Error message about invalid role

### 1.2 User Login (POST /auth/login)

**Test Case 1.2.1: Successful Login**
1. Navigate to `/login`
2. Enter credentials:
   - Email: `owner1@example.com`
   - Password: Any password (first signup with this email)
3. Click "Login"
4. **Expected:** Redirect to dashboard, user menu shows name

**Test Case 1.2.2: Missing Credentials**
1. Navigate to `/login`
2. Leave password field empty
3. Enter email
4. Click "Login"
5. **Expected:** Error message "Email and password are required"

### 1.3 User Profile (GET /auth/me)

**Test Case 1.3.1: Authenticated User Profile**
1. Login as `owner1@example.com`
2. Navigate to `/dashboard`
3. **Expected:** Dashboard loads with user information
4. **Verify:** User name and role displayed correctly

**Test Case 1.3.2: Unauthenticated Access**
1. Clear localStorage (or use incognito mode)
2. Navigate directly to `/dashboard`
3. **Expected:** Redirect to login page

## 2. Restaurant Management Tests

### 2.1 Create Restaurant (POST /restaurants)

**Test Case 2.1.1: Restaurant Owner Creates Restaurant**
1. Login as `owner1@example.com`
2. Navigate to `/dashboard/restaurants/new`
3. Fill form:
   - Name: `Test Kitchen Manual`
   - Description: `A restaurant created via manual testing`
4. Click "Create Restaurant"
5. **Expected:** Success message, redirect to restaurant dashboard
6. **Verify:** Restaurant appears in owner's restaurant list

**Test Case 2.1.2: Customer Cannot Create Restaurant**
1. Login as `customer1@example.com`
2. Navigate directly to `/dashboard/restaurants/new`
3. **Expected:** 403 Forbidden or redirect with error message

### 2.2 List Restaurants (GET /restaurants)

**Test Case 2.2.1: Public Restaurant List**
1. Navigate to `/restaurants` (no login required)
2. **Expected:** List of all public restaurants (should show 3 seeded restaurants)
3. **Verify:** Shows "The Golden Spoon", "Pizza Palace", "Burger Barn"

### 2.3 Get Single Restaurant (GET /restaurants/:id)

**Test Case 2.3.1: View Restaurant Details**
1. From restaurant list, click on "Pizza Palace"
2. **Expected:** Restaurant detail page loads
3. **Verify:** Restaurant name, description, and menu displayed

## 3. Menu Management Tests

### 3.1 Get Restaurant Menu (GET /menus/:restaurant_id)

**Test Case 3.1.1: Retrieve Restaurant Menu**
1. Navigate to any restaurant page (e.g., Pizza Palace)
2. **Expected:** Menu sections load (should show "Pizzas" and "Sides" for Pizza Palace)
3. **Verify:** Menu items display with names and prices

### 3.2 Add Menu Section (POST /menus/:restaurant_id/sections)

**Test Case 3.2.1: Owner Adds Menu Section**
1. Login as `owner2@example.com` (Pizza Palace owner)
2. Navigate to `/dashboard/menus/{pizza-palace-id}`
3. Click "Add Section"
4. Enter section name: `Desserts`
5. Click "Save"
6. **Expected:** New section appears in menu
7. **Verify:** Section persists after page refresh

### 3.3 Add Menu Item (POST /menus/:restaurant_id/sections/:section_id/items)

**Test Case 3.3.1: Owner Adds Menu Item**
1. Login as `owner1@example.com` (Golden Spoon owner)
2. Navigate to menu management for The Golden Spoon
3. Select "Mains" section
4. Click "Add Item"
5. Fill form:
   - Name: `Manual Test Dish`
   - Description: `Added via manual testing`
   - Price: `15.99`
   - Category: `Main Course`
6. Click "Save"
7. **Expected:** Item appears in Mains section
8. **Verify:** Item shows correct price formatting

## 4. Order Management Tests

### 4.1 Place Order as Customer (POST /orders/new)

**Test Case 4.1.1: Logged-in Customer Places Order**
1. Login as `customer2@example.com`
2. Navigate to Pizza Palace
3. Add items to cart:
   - 2x Margherita Pizza
4. Click "Checkout"
5. Complete order
6. **Expected:** Order confirmation page
7. **Verify:** Order total matches item prices × quantities

**Test Case 4.1.2: Guest Places Order**
1. Clear browser session (no login)
2. Navigate to Pizza Palace
3. Add items to cart:
   - 1x Garlic Bread
4. Click "Checkout"
5. Fill guest information:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `555-123-4567`
6. Complete order
7. **Expected:** Order confirmation with guest details

### 4.2 Order History (GET /orders/history)

**Test Case 4.2.1: Customer Views Order History**
1. Login as `customer2@example.com`
2. Navigate to `/account/history`
3. **Expected:** List of previous orders for this customer
4. **Verify:** Orders show restaurant names, dates, and totals

## 5. Theme Management Tests

### 5.1 List Themes (GET /themes)

**Test Case 5.1.1: View All Themes**
1. Navigate to theme selection (restaurant creation/editing)
2. **Expected:** List of available themes
3. **Verify:** Each theme shows preview and name

**Test Case 5.1.2: Filter Themes by Tags**
1. Use theme filter/search functionality
2. Search for specific tag (e.g., "modern")
3. **Expected:** Filtered results show only matching themes

### 5.2 Get Single Theme (GET /themes/:id)

**Test Case 5.2.1: View Theme Details**
1. Click on a specific theme from theme list
2. **Expected:** Theme preview with all style details
3. **Verify:** Colors, fonts, and layout properly displayed

## 6. Frontend Component Tests

### 6.1 Menu Management Component

**Test Case 6.1.1: Menu Management Page Renders**
1. Login as restaurant owner
2. Navigate to `/dashboard/menus/{restaurant-id}`
3. **Expected:** Page loads with restaurant name in title
4. **Verify:** Menu sections display correctly

**Test Case 6.1.2: Menu Sections Display**
1. On menu management page
2. **Expected:** All menu sections visible (e.g., "Appetizers", "Mains")
3. Click on a section
4. **Expected:** Section items display with details

**Test Case 6.1.3: Menu Items Show When Section Selected**
1. Click on "Appetizers" section
2. **Expected:** Items display with:
   - Item names
   - Descriptions
   - Prices (formatted as currency)
   - Availability status

**Test Case 6.1.4: JSON Import Modal**
1. Click "Import JSON" button
2. **Expected:** Modal opens with textarea
3. **Verify:** Modal title "Import Menu from JSON"
4. **Verify:** Placeholder text visible

**Test Case 6.1.5: JSON Import Validation**
1. Open JSON import modal
2. Enter invalid JSON: `{ invalid json }`
3. Click "Import Menu"
4. **Expected:** Error message "Invalid JSON format"
5. Clear and enter valid JSON:
```json
{
  "name": "Test Menu",
  "sections": [{
    "name": "Desserts",
    "description": "Sweet treats",
    "items": [{
      "name": "Chocolate Cake",
      "description": "Rich and decadent",
      "price": 6.99,
      "category": "Dessert",
      "available": true
    }]
  }]
}
```
6. Click "Import Menu"
7. **Expected:** Success message, menu updates

## 7. End-to-End User Flows

### 7.1 Complete Restaurant Owner Flow

**Test Case 7.1.1: Owner Onboarding to Menu Management**
1. Sign up as new restaurant owner
2. Create first restaurant
3. Set up initial menu with sections and items
4. Preview restaurant as customer
5. **Expected:** Complete flow works without errors

### 7.2 Complete Customer Ordering Flow

**Test Case 7.2.1: Customer Registration to Order Completion**
1. Sign up as new customer
2. Browse restaurants
3. Select restaurant and add items to cart
4. Complete checkout process
5. View order confirmation
6. Check order history
7. **Expected:** End-to-end flow completes successfully

## 8. Navigation and Link Testing

### 8.1 Link Checker Tests

**Test Case 8.1.1: Homepage Links**
1. Navigate to `/`
2. Click each navigation link
3. **Expected:** All links lead to valid pages (no 404 errors)
4. **Verify:** Navigation menu works on all pages

**Test Case 8.1.2: Login Page Links**
1. Navigate to `/login`
2. Click all links (signup, forgot password, etc.)
3. **Expected:** All links functional
4. **Verify:** No broken links or 404 errors

## 9. Error Handling and Edge Cases

### 9.1 Network Error Handling

**Test Case 9.1.1: Backend Offline**
1. Stop backend server
2. Try to login
3. **Expected:** User-friendly error message
4. **Verify:** No console errors crash the app

**Test Case 9.1.2: Slow Network Simulation**
1. Use browser dev tools to simulate slow 3G
2. Navigate through application
3. **Expected:** Loading states display appropriately
4. **Verify:** Timeouts handled gracefully

### 9.2 Permission Edge Cases

**Test Case 9.2.1: Role Change Scenarios**
1. Login as customer
2. Use dev tools to manually change role in localStorage
3. Try to access owner-only features
4. **Expected:** Server-side validation prevents unauthorized access

## 10. Recent Bug Fix Verification

### 10.1 Port Configuration Fix

**Test Case 10.1.1: API Connection**
1. Ensure backend runs on port 3550
2. Frontend should connect without manual configuration
3. **Expected:** No "fetch failed" errors in console
4. **Verify:** All API calls successful

### 10.2 Supabase Integration

**Test Case 10.2.1: Local Supabase Connection**
1. Verify Supabase running: `npx supabase status`
2. Test authentication flows
3. **Expected:** No authentication errors
4. **Verify:** JWT tokens properly validated

### 10.3 Role-Based Access Control

**Test Case 10.3.1: Restaurant Owner Role Assignment**
1. Sign up new user with restaurant owner role
2. Verify user can create restaurants
3. **Expected:** No 403 forbidden errors for restaurant creation
4. **Verify:** Role properly stored and validated

### 10.4 React Context Error Fix

**Test Case 10.4.1: Dashboard Navigation**
1. Login as restaurant owner
2. Navigate to "Create New Restaurant"
3. **Expected:** No React context errors in console
4. **Verify:** Page renders without duplicate ProtectedRoute wrapping

## Test Data Cleanup

After completing manual tests:

1. **Database Cleanup:**
   - Remove test restaurants created during testing
   - Clean up test orders
   - Remove test user accounts if needed

2. **Storage Cleanup:**
   - Clear uploaded test images from MinIO/storage
   - Reset any modified theme data

3. **Browser Cleanup:**
   - Clear localStorage and sessionStorage
   - Clear browser cache
   - Close developer tools

## Test Results Documentation

For each test session, document:

1. **Test Environment:**
   - Date and time
   - Browser and version
   - Operating system
   - Backend/frontend versions

2. **Test Results:**
   - Pass/Fail status for each test case
   - Screenshots of any failures
   - Console errors or network issues
   - Performance observations

3. **Issues Found:**
   - Description of any bugs discovered
   - Steps to reproduce
   - Severity assessment
   - Recommendations for fixes

## Maintenance Notes

**When to Update This Document:**

1. New automated tests are added to any test suite
2. New features are implemented
3. Bug fixes change expected behavior
4. API endpoints are modified or added
5. UI components are significantly changed

**Review Schedule:**
- Update after each sprint/release cycle
- Verify alignment with automated test suites monthly
- Update test data and credentials as needed

---

*Last Updated: [Current Date]*
*Corresponds to Automated Test Suites: Backend Jest, Frontend Jest, Cypress E2E*