# Implementation Plan: Customer Ordering UI

This document breaks down the "Customer Ordering UI" feature into a series of smaller, actionable tasks, each with a complexity level of 1. This serves as a detailed guide for the implementation phase.

---

### **Task 1: Restaurant Menu Page Shell & Data Fetching**

*   **Complexity:** 1
*   **Description:** Create the foundational dynamic page for displaying a restaurant's public menu. This task focuses on setting up the page structure and fetching the necessary data from the backend.
*   **Files to Create/Modify:**
    *   **Create:** `src/pages/restaurants/[restaurantId]/index.tsx`
    *   **Create/Modify:** `src/services/restaurantService.ts` (to ensure a `getRestaurantDetails(id)` method exists).
    *   **Create/Modify:** `src/services/menuService.ts` (to ensure a `getMenu(restaurantId)` method exists).
*   **Implementation Details:**
    *   Use Next.js's `getStaticPaths` and `getStaticProps` for efficient, server-side data fetching.
    *   Fetch restaurant details from the `GET /restaurants/:restaurantId` endpoint.
    *   Fetch the full menu from the `GET /menus/:restaurantId` endpoint.
    *   Render a basic layout displaying the restaurant's name and a list of menu sections and items. UI styling can be minimal at this stage.

---

### **Task 2: Shopping Cart Context & UI Component**

*   **Complexity:** 1
*   **Description:** Establish the state management for the shopping cart using React Context and create the basic UI component to display the cart's contents.
*   **Files to Create/Modify:**
    *   **Create:** `src/context/CartContext.tsx`
    *   **Create:** `src/components/ShoppingCart.tsx`
    *   **Modify:** `src/pages/_app.tsx`
*   **Implementation Details:**
    *   The `CartContext` will manage the cart's state (e.g., an array of items). It should expose functions like `addItem`, `removeItem`, and `updateItemQuantity`.
    *   The `ShoppingCart.tsx` component will consume the `CartContext` to display the list of items, quantities, and a running total.
    *   Wrap the main application in `_app.tsx` with the `CartProvider` to make the cart state globally available.

---

### **Task 3: "Add to Cart" Functionality**

*   **Complexity:** 1
*   **Description:** Connect the menu items on the restaurant page to the shopping cart, allowing users to add items to their order.
*   **Files to Create/Modify:**
    *   **Modify:** `src/pages/restaurants/[restaurantId]/index.tsx`
*   **Implementation Details:**
    *   Add an "Add to Cart" button to each menu item displayed on the page.
    *   When a user clicks the button, call the `addItem` function from the `CartContext`.
    *   The `ShoppingCart` component should dynamically update to reflect the new item in the cart.

---

### **Task 4: Place Order & Create Confirmation Page**

*   **Complexity:** 1
*   **Description:** Implement the logic to submit the user's order to the backend and create the page they are redirected to upon successful submission.
*   **Files to Create/Modify:**
    *   **Create:** `src/services/orderService.ts`
    *   **Create:** `src/pages/orders/[orderId].tsx`
    *   **Modify:** `src/components/ShoppingCart.tsx`
*   **Implementation Details:**
    *   Create an `orderService.ts` file with a `placeOrder(orderData)` function that sends a request to the `POST /orders/new` endpoint.
    *   Wire the "Place Order" button in the `ShoppingCart` to call this service function.
    *   On a successful API response, clear the cart state and programmatically redirect the user to the `/orders/[orderId]` page, using the `orderId` from the response.
    *   The `[orderId].tsx` page will fetch the order details from `GET /orders/:id` and display a confirmation summary.

---

### **Task 5: User Order History Page**

*   **Complexity:** 1
*   **Description:** Create the page where logged-in users can view their past orders. This page must be protected and only accessible to authenticated users.
*   **Files to Create/Modify:**
    *   **Create:** `src/pages/account/history.tsx`
    *   **Modify:** `src/services/orderService.ts`
*   **Implementation Details:**
    *   Wrap the page component in the existing `ProtectedRoute` component to enforce login.
    *   In `orderService.ts`, add a `getOrderHistory()` function that calls the `GET /orders/history` endpoint.
    *   On the history page, call this service to fetch and display the list of past orders.
    *   Each order in the list should link to its detailed view at `/orders/[orderId]`.