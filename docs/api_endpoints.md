# API Endpoints & Interaction Design

## Overview  
This document defines the REST API structure for Mr. Brooks Restaurant Creator, ensuring seamless data flow between **Supabase (authentication)** and **MongoDB (restaurant data, orders, customer history)**.

*Updated: December 2024 - Reflects implemented authentication system and architectural decisions*

## 🎯 **IMPLEMENTATION STATUS**
✅ **Authentication Endpoints** - Fully implemented with tests  
✅ **Theme Endpoints** - Fully implemented with tests  
❌ **Restaurant Endpoints** - Not yet implemented  
❌ **Menu Endpoints** - Not yet implemented  
❌ **Order Endpoints** - Not yet implemented  

*See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress*

---

## Core API Principles  
✅ **RESTful architecture** with structured routes (`/auth`, `/restaurants`, `/orders`).  
✅ **Secure authentication via Supabase** with role-based access control.  
✅ **Dynamic data retrieval** optimized for menus, orders, and customer interactions.  
✅ **Guest & registered user support** with order tracking and reordering functionality.  

---

## Authentication Endpoints (`/auth`) - ✅ **IMPLEMENTED**
### **1. User Signup**
**POST** `/auth/signup`  
Registers a new user via Supabase and creates MongoDB profile.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "customer",
  "restaurant_id": "UUID" // optional, for restaurant owners
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user_id": "UUID",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer"
}
```

### **2. User Login**
**POST** `/auth/login`  
Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "JWT-TOKEN",
  "user": {
    "user_id": "UUID",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "restaurant_id": "UUID"
  }
}
```

### **3. Retrieve User Profile**
**GET** `/auth/profile/{user_id}`  
Fetches user account details. Requires: Bearer Token.

---

## Theme Endpoints (`/themes`) - ✅ **IMPLEMENTED**
### **1. List All Themes**
**GET** `/themes`  
Retrieves all available themes with optional tag filtering.

**Query Parameters:**
- `tags` (optional): Comma-separated list of tags to filter themes

**Response:**
```json
[
  {
    "_id": "theme_id",
    "name": "modern-dark",
    "displayName": "Modern Dark",
    "description": "A sleek, dark theme with modern aesthetics",
    "colors": {
      "primary": "#3498db",
      "secondary": "#2ecc71",
      "accent": "#e74c3c",
      "background": "#121212",
      "text": "#ffffff"
    },
    "fonts": {
      "heading": "Montserrat, sans-serif",
      "body": "Open Sans, sans-serif"
    },
    "tags": ["dark", "modern", "sleek"]
  }
]
```

### **2. Get Theme Details**
**GET** `/themes/{theme_id}`  
Retrieves detailed information about a specific theme.

**Response:**
```json
{
  "_id": "theme_id",
  "name": "modern-dark",
  "displayName": "Modern Dark",
  "description": "A sleek, dark theme with modern aesthetics",
  "colors": {
    "primary": "#3498db",
    "secondary": "#2ecc71",
    "accent": "#e74c3c",
    "background": "#121212",
    "text": "#ffffff"
  },
  "fonts": {
    "heading": "Montserrat, sans-serif",
    "body": "Open Sans, sans-serif"
  },
  "spacing": {
    "unit": 8,
    "scale": 1.5
  },
  "borderRadius": 4,
  "shadows": ["0 2px 4px rgba(0,0,0,0.2)", "0 4px 8px rgba(0,0,0,0.3)"],
  "tags": ["dark", "modern", "sleek"],
  "customizable": true,
  "version": "1.0.0"
}
```

---

## Restaurant Endpoints (`/restaurants`)
### **4. Get Restaurant Data**
**GET** `/restaurants/{restaurant_id}`  
Retrieves restaurant metadata and configurations.  

**Response:**
```json
{
  "name": "Best Pizza",
  "owner_id": "UUID",
  "theme": "modern-dark"
}
```

### **5. Update Restaurant Settings**
**PATCH** `/restaurants/{restaurant_id}`  
Allows owners to update settings. Requires: Authenticated Owner Role.

---

## Menu Endpoints (`/menus`)
### **6. Get Menu for a Restaurant**
**GET** `/menus/{restaurant_id}`  
Retrieves menu items for the given restaurant.  

**Response:**
```json
{
  "items": [
    {
      "name": "Margherita Pizza",
      "price": 12.99,
      "available": true,
      "customizations": ["Extra Cheese", "Gluten-Free Crust"]
    }
  ]
}
```

### **7. Update Menu**
**POST** `/menus/{restaurant_id}`  
Adds or modifies menu items (Owner Only).

### **8. Import Menu from JSON**
**POST** `/menus/{restaurant_id}/import`  
Imports a complete menu structure from JSON (Owner Only).

**Request Body:**
```json
{
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
}
```

**Response:**
```json
{
  "message": "Menu imported successfully",
  "menu_id": "ObjectId",
  "sections_count": 1,
  "items_count": 1
}
```

---

## Order Endpoints (`/orders`)
### **9. Place an Order (Guest or Logged-in User)**
**POST** `/orders/new`  
Creates a new order in MongoDB.

```json
{
  "restaurant_id": "UUID",
  "customer_id": "UUID (null for guest)",
  "items": [
    { "name": "Spicy Ramen", "price": 10.99, "modifications": ["Extra Spice", "No Egg"] }
  ]
}
```

**Response:**
```json
{
  "message": "Order placed successfully",
  "order_id": "ObjectId",
  "status": "pending"
}
```

### **10. Get Order History (Registered Customers)**
**GET** `/orders/history/{customer_id}`  
Retrieves past orders for a logged-in customer.

### **11. Reorder Previous Items**
**POST** `/orders/reorder/{order_id}`  
Recreates a previous order.

---

## Review & Rating Endpoints (`/reviews`)
### **12. Submit Item Review**
**POST** `/reviews/{restaurant_id}/item/{item_name}`  
Allows customers to rate menu items.

---

## Future Enhancements
✅ AI-Based Menu Suggestions for personalized recommendations.

✅ Real-Time Order Tracking with status updates.

✅ Loyalty Rewards Program for returning customers.
