# Restaurant Customer Website Template

This is a standalone Next.js application template for restaurant customer ordering websites. Each restaurant gets their own deployment of this template to serve their customers.

## Overview

This template provides:
- Customer-facing restaurant menu display
- Shopping cart with price point selection
- Guest checkout (no account required)
- Order placement and confirmation
- Mobile-optimized ordering experience

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `env.example` to `.env.local` and configure:
   ```
   RESTAURANT_ID=your_restaurant_id_here
   API_BASE_URL=http://localhost:3550
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will run on http://localhost:3551

## Architecture

### API Integration
- Connects to the main Restaurant Developer backend API
- Uses the same endpoints as the main platform
- Configured per restaurant via environment variables

### Key Features
- **Restaurant-Specific**: Each deployment serves one restaurant
- **Guest-Friendly**: No customer accounts required
- **Mobile-First**: Optimized for mobile ordering
- **Fast Loading**: Lightweight customer experience

### Deployment Strategy
- Each restaurant gets their own deployment
- Custom domain/subdomain per restaurant
- Environment variables configure restaurant data
- Shared backend serves all customer websites

## Development

### Project Structure
```
src/
├── components/          # Customer-focused UI components
├── pages/              # Customer website pages
├── services/           # API integration
├── context/            # State management
├── types/              # TypeScript definitions
└── styles/             # CSS and styling
```

### API Endpoints Used
- `GET /restaurants/:id` - Restaurant information
- `GET /menus/:restaurant_id` - Menu data with price points
- `POST /orders/new` - Place customer orders

## Customization

### Restaurant Branding
- Configure restaurant ID in environment variables
- Restaurant name, description, and theme loaded from API
- Custom styling can be added per restaurant

### Features
- Menu display with price point selection
- Shopping cart with guest checkout
- Order confirmation and tracking
- Mobile-responsive design

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Configure environment variables for production:
   - Set `RESTAURANT_ID` to the target restaurant
   - Set `API_BASE_URL` to the production backend
   - Configure custom domain/hosting as needed

## Integration with Main Platform

This template integrates with the Restaurant Developer main platform:
- Restaurant owners manage their restaurant/menu via the main platform
- Orders placed on customer websites appear in the restaurant owner's dashboard
- Menu changes on the main platform are reflected in customer websites
- Shared backend ensures data consistency 