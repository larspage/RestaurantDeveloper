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

### **8. Winston Logging System (Observability & Debugging)**
- **Comprehensive logging framework** with daily log rotation and automatic cleanup.
- **Performance monitoring** with queryable metrics and slow operation detection.
- **Error tracking** with contextual information and stack traces.
- **Category-based logging** (Performance, Errors, Authentication, Database, API, Business).
- **Configurable log levels** and retention policies (7-day default).
- **Structured JSON logging** for analysis and troubleshooting.
- **Development mode support** with enhanced debugging capabilities.

### **9. MCP Server Integration (AI-Assisted Development)**
- **MongoDB MCP Server** for direct database integration and mindmap functionality.
- **Supabase MCP Server** for authentication and user management integration.
- **Puppeteer MCP Server** for visual frontend testing and debugging capabilities.
- **Enhanced development workflow** with AI-assisted visual debugging and testing.
- **Real-time frontend inspection** for better UI/UX issue resolution.
- **Screenshot-based debugging** for visual context in development discussions.

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
5. **All operations are logged** with performance metrics and error tracking.

### **Logging & Observability Flow**
1. **Performance timers** track operation duration across all system components.
2. **Error logging** captures failures with full context and stack traces.
3. **Authentication events** are logged for security and debugging.
4. **Database operations** are monitored for slow queries and connection issues.
5. **API requests/responses** are logged with configurable detail levels.
6. **Business events** (orders, menu updates) are tracked for audit trails.
7. **Log files rotate daily** and are automatically cleaned up after 7 days.

### **MCP-Enhanced Development Flow**
1. **Visual debugging** via Puppeteer MCP server for real-time frontend inspection.
2. **Database integration** through MongoDB MCP server for direct data access and mindmap functionality.
3. **Authentication integration** via Supabase MCP server for user management workflows.
4. **Screenshot-based issue resolution** for better understanding of UI/UX problems.
5. **AI-assisted development** with visual context for more accurate code changes.
6. **Enhanced testing capabilities** combining traditional testing with visual verification.

---

## Future Enhancements
- **AI-Based Menu Suggestions** – Recommend dishes dynamically using customer behavior.
- **POS System Integration** – Improve order tracking and ticket printing functionality.
- **Expanded Theming Options** – Provide more restaurant-specific UI designs.
- **Optimized Prep Time Logic** – Ensure efficient kitchen workflow and order sequencing.
- **Advanced Visual Testing** – Expand Puppeteer integration for automated visual regression testing.
- **Performance Monitoring** – Leverage MCP servers for real-time performance analysis and optimization.
