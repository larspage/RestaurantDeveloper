# RestaurantDeveloper  

A **B2B SaaS platform for restaurant owners** to create and manage their online presence, featuring **advanced menu management with price points, JSON/CSV import/export, and comprehensive ordering systems**.

## 📊 **Project Status: 99% Complete**
✅ **Backend Foundation** - Authentication, models, and API structure complete  
✅ **API Endpoints** - Restaurant, menu, order, and theme management complete  
✅ **Frontend** - Next.js implementation with advanced menu management complete  
✅ **Price Points System** - Multiple pricing options per menu item complete
✅ **Import/Export** - JSON and CSV import/export with price points complete
✅ **Shopping Cart** - Price point selection and cart integration complete
✅ **Testing** - 52/52 tests passing across backend and frontend
❌ **Deployment** - CI/CD and production setup pending  

*See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress tracking*  
*See [docs/IMPLEMENTATION_DECISIONS.md](docs/IMPLEMENTATION_DECISIONS.md) for architectural decisions*

## 🎉 **Latest Achievement: JSON Import/Export with Price Points Enhancement**
Successfully completed a comprehensive enhancement adding support for multiple price points per menu item (Small/Medium/Large, Regular/Premium, etc.) with advanced import/export capabilities.

**Key Features Added:**
- 🍕 **Multiple Price Points** - Support for complex pricing (e.g., "Small: $9.99, Medium: $12.99, Large: $15.99")
- 📊 **JSON Import/Export** - Enhanced with price points validation and smart defaults
- 📄 **CSV Import/Export** - Template download and comprehensive error handling
- 🛒 **Shopping Cart Integration** - Price point selection workflow
- 🎨 **Customer Menu Display** - Radio button price point selection interface
- 👁️ **Import Preview** - Comprehensive change visualization before applying
- 🔄 **Full Backward Compatibility** - Existing single-price items continue to work

## 🏗 Project Structure  
✅ **Backend** → Node.js, Express API, MongoDB *(Complete - All APIs implemented)*  
✅ **Frontend** → Next.js UI, Tailwind CSS *(Complete - Full B2B dashboard)*  
✅ **Authentication** → Supabase (Secure Login & User Roles) *(Complete)*  
✅ **Menu Management** → Advanced system with price points, import/export *(Complete)*
✅ **Shopping Cart** → Price point selection and ordering workflow *(Complete)*
❌ **CI/CD** → GitHub Actions, Docker, Manual Deployments to DigitalOcean *(Planned)*  
✅ **Testing** → **Test-Driven Development (TDD)** with Jest, Supertest, Cypress *(52/52 tests passing)*  

## 🚀 Setup Guide  
1️⃣ Clone the repository:  
```sh
git clone https://github.com/larspage/RestaurantDeveloper.git
```

2️⃣ Install dependencies:
```sh
npm install
```

3️⃣ Start the development servers (includes MinIO for image storage):
```sh
npm run dev:all
```

4️⃣ Stop the development servers:
```sh
npm run stop
```

## 📸 Image Storage with MinIO
This project uses MinIO for image storage in development. The `dev:all` script automatically:

1. Checks if Docker is running
2. Starts MinIO if it's not already running
3. Provides information about the MinIO console

To manually manage MinIO:
```sh
# Start MinIO and create the required bucket
npm run setup:minio

# Access the MinIO console
# URL: http://localhost:9001
# Username: minioadmin
# Password: minioadmin
```

If you encounter issues with image uploads:
1. Make sure Docker is running
2. Check that the "restaurant-menu-images" bucket exists in MinIO
3. Set the bucket's access policy to "public" for development purposes
