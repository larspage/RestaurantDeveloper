# Tech Context

## Overview
Mr. Brooks Restaurant Creator is powered by a **hybrid architecture**, utilizing **Supabase for authentication** and **MongoDB for restaurant data**, all deployed on **DigitalOcean** for cost-efficient hosting.

---

## Core Technologies & Their Roles

### **1. DigitalOcean (Hosting & Infrastructure)**
- **Primary hosting environment** for backend services, database management, and frontend applications.
- **Supports Droplets, App Platform, Kubernetes**, and managed database services.
- **Handles deployment of API, frontend, and database connections**.

### **2. Supabase (Authentication & User Management)**
- **Manages user authentication** via OAuth, email/password, and magic links.
- **Stores structured user data** (profiles, permissions).
- **Provides auto-generated REST API endpoints** for seamless integration.
- **Webhooks notify MongoDB of authentication changes**, ensuring event-driven updates.

### **3. MongoDB Atlas (Restaurant Data Storage)**
- **Holds restaurant-specific data** such as menus, orders, and configurations.
- **Uses multi-tenant architecture**, separating restaurant data logically.
- **Enables dynamic queries and fast retrieval of structured & unstructured information**.

### **4. Node.js + Express (API Layer)**
- **Acts as a bridge between Supabase & MongoDB**, ensuring smooth data flow.
- **Handles API requests** for authentication, menu retrieval, ordering, and customization.
- **Uses REST endpoints for simplicity** over GraphQL.

### **5. Next.js + React (Frontend Framework)**
- **Provides restaurant owners with a customizable website experience**.
- **Supports dynamic styling via Tailwind CSS**.
- **Uses server-side rendering (SSR) for improved performance**.
- **Pulls data from MongoDB via API endpoints**.

### **6. Tailwind CSS (Styling & Theming)**
- **Enables easy UI customization with pre-built restaurant themes**.
- **Ensures lightweight, responsive, and accessible design**.
- **Supports global styling updates for brand consistency**.

### **7. DigitalOcean Spaces (Media Storage)**
- **Hosts images, logos, and menu assets** used by restaurants.
- **Provides fast retrieval via CDN for optimized loading times**.
- **Integrates directly with frontend for scalable media hosting**.

---

## System Interaction Flow
### **User Authentication**
1. User signs up or logs in via **Supabase Authentication**.
2. Supabase verifies credentials and **triggers webhooks** to notify MongoDB.
3. MongoDB stores **restaurant-specific data** linked to user accounts.
4. API (Node.js) retrieves **authenticated user details** for frontend interactions.

### **Restaurant Data Access**
1. The frontend sends a request to **Node.js API**.
2. API queries **MongoDB Atlas** for restaurant data (menus, orders, themes).
3. MongoDB responds with structured data.
4. Next.js renders the website dynamically with **Tailwind styling**.

### **Order Processing**
1. Customer places an order via the **Next.js frontend**.
2. Order request is sent to the **API (Node.js)**.
3. API updates the **MongoDB database** and notifies the kitchen ticket system.
4. **Kitchen ticket prints automatically** for restaurant staff.

---

## Future Enhancements
- **AI-Based Menu Suggestions** – Recommend dishes dynamically using customer behavior.
- **POS System Integration** – Improve order tracking and ticket printing functionality.
- **Expanded Theming Options** – Provide more restaurant-specific UI designs.
- **Optimized Prep Time Logic** – Ensure efficient kitchen workflow and order sequencing.
