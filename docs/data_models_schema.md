# Data Models & Schema Design

## Overview
This document defines the **data structure** for Mr. Brooks Restaurant Creator, ensuring seamless integration between **Supabase authentication** and **MongoDB restaurant data**.

*Updated: December 2024 - Reflects actual implemented schema decisions*

---

## Core Data Model Relationships
- **Supabase** manages authentication for restaurant owners and customers.
- **MongoDB** stores restaurant-specific data, menus, orders, and customer interactions.
- **Customer logins are optional**, allowing guest checkouts while supporting order tracking for registered users.
- **Hybrid Data Strategy** - Minimal duplication between Supabase and MongoDB for performance

## 🏗️ **IMPLEMENTED ARCHITECTURE DECISIONS**
- **Theme Management** - Separate Theme collection with restaurant references
- **Menu Structure** - Structured sections with embedded items
- **User Data** - Hybrid approach with cached data in MongoDB
- **Order Status** - Kitchen-focused workflow with 6 status levels
- **Guest Orders** - Embedded contact info for non-registered users

*See [IMPLEMENTATION_DECISIONS.md](IMPLEMENTATION_DECISIONS.md) for detailed rationale*

---

## Supabase Data Structure (Authentication & Business Data)
### **1. Users Table** (`users`)
Stores login credentials and links users to restaurants.

| Field Name  | Type       | Description                      |
|-------------|-----------|----------------------------------|
| `id`        | UUID      | Unique user identifier          |
| `email`     | Text      | Email address for authentication |
| `password`  | Text      | Secure hashed password          |
| `role`      | Enum      | `restaurant_owner`, `customer` |
| `restaurant_id` | UUID  | Links user to a restaurant     |
| `created_at` | Timestamp | Account creation date          |

### **2. Restaurants Table** (`restaurants`)
Stores restaurant metadata.

| Field Name    | Type  | Description                     |
|--------------|------|---------------------------------|
| `id`         | UUID | Unique restaurant identifier   |
| `name`       | Text | Restaurant name               |
| `owner_id`   | UUID | Linked to `users.id`          |
| `theme_id`   | ObjectId | **NEW:** References Theme collection |
| `created_at` | Timestamp | Setup date               |

**Implementation Note:** Restaurant now references Theme collection instead of inline theme string.

### **3. Customers Table** (`customers`)
Stores registered customers who opt into account creation.

| Field Name    | Type  | Description                     |
|--------------|------|---------------------------------|
| `id`         | UUID | Unique customer identifier    |
| `email`      | Text | Customer email address        |
| `name`       | Text | Customer full name            |
| `created_at` | Timestamp | Account creation date     |

---

## MongoDB Data Structure (Restaurant Data & Orders)

### **4. Theme Collection** (`themes`) - **NEW**
Stores reusable restaurant themes.

```json
{
  "_id": ObjectId,
  "name": "modern-dark",
  "displayName": "Modern Dark",
  "description": "Sleek dark theme with modern typography",
  "colors": {
    "primary": "#1a1a1a",
    "secondary": "#333333",
    "accent": "#ff6b35",
    "background": "#ffffff",
    "text": "#000000",
    "textSecondary": "#666666"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Open Sans"
  },
  "layout": {
    "style": "modern",
    "cardStyle": "rounded",
    "buttonStyle": "filled"
  },
  "isActive": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### **5. Menu Collection** (`menus`) - **UPDATED STRUCTURE**
Stores restaurant menu items with structured sections.

```json
{
  "_id": ObjectId,
  "restaurant_id": UUID,
  "sections": [
    {
      "name": "Breakfast",
      "description": "Morning favorites",
      "displayOrder": 1,
      "isActive": true,
      "items": [
        {
          "name": "Margherita Pizza",
          "description": "Fresh tomatoes, mozzarella, basil",
          "price": 12.99,
          "customizations": ["Extra Cheese", "Gluten-Free Crust"],
          "available": true
        }
      ]
    }
  ],
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

### **6. Order Collection** (`orders`) - **UPDATED STATUS & GUEST SUPPORT**
Stores customer orders with kitchen-focused status workflow.

```json
{
  "_id": ObjectId,
  "restaurant_id": UUID,
  "customer_id": UUID, // null for guest orders
  "items": [
    {
      "name": "Spicy Ramen",
      "price": 10.99,
      "modifications": ["Extra Spice", "No Egg"],
      "quantity": 2
    }
  ],
  "total_price": 21.98,
  "status": "in_kitchen", // received, confirmed, in_kitchen, ready_for_pickup, delivered, cancelled
  "guest_info": { // for guest orders when customer_id is null
    "name": "John Doe",
    "phone": "555-1234",
    "email": "john@example.com"
  },
  "estimated_ready_time": "2024-12-01T18:30:00Z",
  "notes": "Extra spicy please",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

### **7. User Collection** (`users`) - **NEW: HYBRID APPROACH**
Stores cached user data for performance (auth data remains in Supabase).

```json
{
  "_id": ObjectId,
  "supabase_id": "uuid-from-supabase",
  "name": "John Doe",
  "role": "customer", // customer, restaurant_owner
  "restaurant_id": "uuid-for-owners", // null for customers
  "preferences": {
    "dietary_restrictions": ["vegetarian", "gluten-free"],
    "favorite_items": [
      {
        "restaurant_id": "restaurant-uuid",
        "item_name": "Vegan Burger"
      }
    ]
  },
  "last_sync": "2024-12-01T12:00:00Z",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}




