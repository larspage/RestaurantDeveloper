# Data Models & Schema Design

## Overview
This document defines the **data structure** for Mr. Brooks Restaurant Creator, ensuring seamless integration between **Supabase authentication** and **MongoDB restaurant data**.

---

## Core Data Model Relationships
- **Supabase** manages authentication for restaurant owners and customers.
- **MongoDB** stores restaurant-specific data, menus, orders, and customer interactions.
- **Customer logins are optional**, allowing guest checkouts while supporting order tracking for registered users.

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
| `created_at` | Timestamp | Setup date               |

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
### **4. Menu Collection** (`menus`)
Stores restaurant menu items.

```json
{
  "_id": ObjectId,
  "restaurant_id": UUID,
  "items": [
    {
      "name": "Margherita Pizza",
      "price": 12.99,
      "customizations": ["Extra Cheese", "Gluten-Free Crust"],
      "available": true
    }
  ],
  "updated_at": Timestamp
}

{
  "_id": ObjectId,
  "restaurant_id": UUID,
  "customer_id": UUID,
  "items": [
    {
      "name": "Spicy Ramen",
      "price": 10.99,
      "modifications": ["Extra Spice", "No Egg"]
    }
  ],
  "total_price": 21.98,
  "status": "Completed",
  "timestamp": Timestamp
}

{
  "_id": ObjectId,
  "customer_id": UUID,
  "restaurant_id": UUID,
  "order_history": [
    {
      "order_id": ObjectId,
      "items": [
        {
          "name": "Vegan Burger",
          "price": 14.99,
          "customizations": ["No Cheese", "Extra Avocado"]
        }
      ],
      "timestamp": Timestamp
    }
  ]
}




