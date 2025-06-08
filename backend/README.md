 
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
