# Customer Ordering Website Template Implementation Plan

## 🎯 **ARCHITECTURE CLARIFICATION**

**Restaurant Developer Platform Architecture:**
- **Main Platform** (current codebase): B2B SaaS for restaurant owners to manage restaurants and menus
- **Customer Website Template** (new): Standalone deployable websites for each restaurant's customers
- **Shared Backend**: Single API serving both the main platform and customer websites

### **Customer Website Flow:**
1. Restaurant owner creates/manages restaurant and menus on main platform
2. Restaurant gets a standalone customer website (deployed separately)
3. Customers visit restaurant's website to browse menu and place orders
4. Orders flow back to restaurant owner's dashboard on main platform
5. Each restaurant can have custom domain/branding

## 📋 **IMPLEMENTATION PHASES**

### **Phase 1: Customer Website Template Foundation**
**Total Estimated Time: 5 days (5 Level 1 tasks)**

#### **Task 1: Template Project Structure (Level 1 - 1 day)**
- Create separate `customer-website-template/` directory
- Initialize Next.js project with TypeScript and Tailwind
- Configure API connection to main backend
- Set up environment variables for restaurant ID configuration

#### **Task 2: Menu Display Components (Level 1 - 1 day)**  
- Create customer-focused menu components
- Adapt existing components for customer experience
- Focus on ordering UX (clear pricing, easy selection)
- Remove all restaurant management functionality

#### **Task 3: Customer Shopping Cart (Level 1 - 1 day)**
- Create customer-specific cart implementation
- Add guest customer information collection
- Integrate with existing backend order API
- Handle order placement for guest customers

#### **Task 4: Main Restaurant Page (Level 1 - 1 day)**
- Create primary ordering page (`index.tsx`)
- Fetch restaurant/menu data via API
- Integrate all components for complete ordering experience
- Add SEO optimization for restaurant visibility

#### **Task 5: Order Confirmation System (Level 1 - 1 day)**
- Create order confirmation and tracking pages
- Display order status and details
- Add thank you page with order summary
- Handle order status updates from backend

### **Phase 2: Template Enhancement (Future)**
- Restaurant theming/branding system
- Customer account system (favorites, order history)
- Advanced order tracking
- Mobile app optimization

## 🔧 **TECHNICAL SPECIFICATIONS**

### **Template Architecture:**
```
customer-website-template/
├── src/
│   ├── components/          # Customer-focused UI components
│   │   ├── MenuItemCard.tsx
│   │   ├── ShoppingCart.tsx
│   │   ├── CustomerInfoForm.tsx
│   │   └── OrderStatus.tsx
│   ├── pages/              # Customer website pages
│   │   ├── index.tsx       # Main menu/ordering page
│   │   └── orders/
│   │       └── [orderId].tsx
│   ├── services/           # API integration
│   │   ├── restaurantService.ts
│   │   ├── menuService.ts
│   │   └── orderService.ts
│   ├── context/            # State management
│   │   └── CartContext.tsx
│   └── types/              # TypeScript definitions
├── package.json
├── next.config.js
└── .env.example
```

### **API Integration:**
- **Backend URL**: Configurable via environment variables
- **Restaurant ID**: Set per deployment to identify which restaurant
- **Endpoints Used**:
  - `GET /restaurants/:id` - Restaurant information
  - `GET /menus/:restaurant_id` - Menu data with price points
  - `POST /orders/new` - Place customer orders

### **Deployment Strategy:**
- Each restaurant gets their own deployment of the template
- Environment variables configure which restaurant data to load
- Custom domains/subdomains per restaurant
- Shared backend API serves all customer websites

## 🎨 **CUSTOMER EXPERIENCE FOCUS**

### **Key Differences from Main Platform:**
- **Simplified Navigation**: Focus on menu browsing and ordering
- **Guest-Friendly**: No account required to place orders
- **Mobile-Optimized**: Primary interface for customer ordering
- **Restaurant Branding**: Display restaurant identity prominently
- **Fast Loading**: Optimized for customer conversion

### **Order Flow:**
1. Customer visits restaurant website
2. Browses menu with price point options
3. Adds items to cart with selected price points
4. Provides contact information (guest checkout)
5. Places order and receives confirmation
6. Can track order status via confirmation link

## 📊 **SUCCESS METRICS**

### **Phase 1 Completion Criteria:**
- ✅ Template project builds and runs successfully
- ✅ Menu displays correctly with price points
- ✅ Shopping cart handles price point selection
- ✅ Guest customers can place orders
- ✅ Orders appear in main platform for restaurant owners
- ✅ Order confirmation system works end-to-end

### **Quality Standards:**
- Full TypeScript type safety
- Responsive design (mobile-first)
- Fast loading times (< 3 seconds)
- Accessibility compliance
- SEO optimization for restaurant discovery

## 🔄 **INTEGRATION WITH MAIN PLATFORM**

### **Data Flow:**
- **Restaurant Setup**: Done via main platform
- **Menu Management**: Updated via main platform, reflected in customer sites
- **Order Processing**: Orders placed on customer sites, managed via main platform
- **Analytics**: Order data available in restaurant owner dashboard

### **Shared Components/Types:**
- Reuse TypeScript interfaces for MenuItem, Restaurant, Order
- Adapt existing service patterns for API communication
- Maintain consistency in data structures and validation

This architecture provides a clean separation between restaurant management (B2B) and customer ordering (B2C) while maintaining a unified backend system.