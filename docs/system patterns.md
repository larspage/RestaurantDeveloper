# System Patterns

## Architecture Overview
Mr. Brooks Restaurant Creator follows a **hybrid architecture**, combining **Supabase for authentication** and **MongoDB for restaurant data**, ensuring simplicity and maintainability.

### Core Technologies
- **DigitalOcean Hosting** – Primary deployment environment.
- **Supabase** – Handles authentication and structured user data.
- **MongoDB Atlas** – Stores restaurant-specific data.
- **Node.js + Express** – API layer connecting Supabase and MongoDB.
- **Next.js + React** – Frontend framework for restaurant websites.
- **Tailwind CSS** – Styling framework for easy UI customization.

## Infrastructure Design
### **1. Backend System**
- **Supabase Authentication** – OAuth, email/password, magic links.
- **MongoDB Data Storage** – Restaurant menus, orders, and configurations.
- **Node.js API** – REST endpoints connecting Supabase and MongoDB.
- **Event-Driven Syncing** – Supabase Webhooks notify MongoDB of user changes.

### **2. Frontend System**
- **Thematic UI Framework** – Pre-built themes with customizable layouts.
- **Real-Time Order Updates** – Powered by MongoDB subscriptions.
- **Multi-Tenant Setup** – Each restaurant pulls data dynamically.
- **Page Routing & Navigation** – Optimized user experience.

## Future Enhancements
- **Expanded Theme Library** – More pre-built restaurant website designs.
- **Advanced Menu AI Suggestions** – Personalized menu recommendations.
- **POS System Expansion** – Improved ticket printing integration.
- **Enhanced Prep Time Logic** – Optimize order flow in restaurant kitchens.
- **Interactive Theme Preview** – Live UI modifications before deployment.
