 
---

### **📍 `/backend/README.md` (Backend API & Database Overview)**
```markdown
# Backend – RestaurantDeveloper  

## 🔥 API Overview  
This backend is built with **Node.js & Express**, handling:  
✅ **Authentication via Supabase** (JWT-based sessions).  
✅ **Restaurant & menu data storage** using **MongoDB Atlas**.  
✅ **Order processing** – Including **guest checkout & customer reordering**.  

## 🔗 API Endpoints  
📍 **Authentication** → `/auth/signup`, `/auth/login`, `/auth/profile/{user_id}`  
📍 **Restaurant Data** → `/restaurants/{restaurant_id}`  
📍 **Menu Management** → `/menus/{restaurant_id}`  
📍 **Order Placement & History** → `/orders/new`, `/orders/history/{customer_id}`  

## 🛠 Setup Guide  
1️⃣ Install dependencies:  
```sh
cd backend && npm install  
```

2️⃣ Create a `.env` file and add your `MONGODB_URI`.

## 🌱 Database Seeding
To populate your development database with a complete set of test data (users, restaurants, menus, orders), run the following command from the `backend` directory:

```sh
npm run seed
```

This will wipe the relevant collections and create a fresh, interconnected dataset. It's safe and recommended to run this command any time you need to reset to a known good state. 