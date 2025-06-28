# RestaurantDeveloper  

A **multi-tenant restaurant website creator** integrating **Supabase authentication, MongoDB data management, and Next.js frontend** for scalable restaurant solutions.  

## 📊 **Project Status: 25% Complete**
✅ **Backend Foundation** - Authentication, models, and API structure complete  
🚧 **API Endpoints** - Restaurant, menu, and order management in progress  
❌ **Frontend** - Next.js implementation not started  
❌ **Deployment** - CI/CD and production setup pending  

*See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed progress tracking*  
*See [docs/IMPLEMENTATION_DECISIONS.md](docs/IMPLEMENTATION_DECISIONS.md) for architectural decisions*

## 🏗 Project Structure  
✅ **Backend** → Node.js, Express API, MongoDB *(Authentication Complete)*  
❌ **Frontend** → Next.js UI, Tailwind CSS *(Not Started)*  
✅ **Authentication** → Supabase (Secure Login & User Roles) *(Complete)*  
❌ **CI/CD** → GitHub Actions, Docker, Manual Deployments to DigitalOcean *(Planned)*  
✅ **Testing** → **Test-Driven Development (TDD)** with Jest, Supertest, Cypress *(Auth Tests Complete)*  

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
