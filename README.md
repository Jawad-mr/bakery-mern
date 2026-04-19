# 🥐 Sweet Crumb Bakery POS — MERN Stack

A full-stack Bakery Point of Sale system built with MongoDB, Express, React, and Node.js.

## ✨ Features

- **Role-based access** — Admin, Cashier, Staff with different permissions
- **GST 5%** — Calculated per item, shown on bill and receipt
- **Purchase List** — Auto-logged every time stock is added or restocked
- **Smart Billing** — Cart with live stock validation, customer info
- **Print Receipt** — Opens print dialog with formatted bill
- **WhatsApp Share** — Sends bill via WhatsApp Web
- **CSV Export** — Download orders as spreadsheet
- **Admin: Delete Orders** — Restores stock automatically
- **Admin: Delete Purchases** — Removes log entries
- **Dark / Light Mode** — Toggle in top nav
- **Products (no emoji)** — Clean name-based design with stock bars

---

## 📁 Project Structure

```
sweetcrumb-mern/
├── backend/
│   ├── models/         User, Product, Order, Purchase
│   ├── routes/         auth, products, orders, purchases
│   ├── controllers/    business logic
│   ├── middleware/      JWT auth + role guard
│   ├── server.js
│   ├── seed.js         demo data seeder
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/        axios instance + API helpers
    │   ├── components/ TopNav, BottomNav, Modal, Toast, Charts
    │   ├── context/    AuthContext (JWT + theme)
    │   ├── pages/      Login, Home, Billing, Orders, Products, Purchases
    │   └── utils/      helpers, print, WhatsApp, CSV export
    └── vite.config.js
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd backend
npm install

# Edit .env with your MongoDB URI
# Default: mongodb://localhost:27017/sweetcrumb

npm run seed     # loads demo data
npm run dev      # starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

### 3. Open in browser
```
http://localhost:5173
```

---

## 🔑 Demo Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| Arjun Sharma | admin@sweetcrumb.in | admin123 | Admin |
| Priya Menon | cashier@sweetcrumb.in | cash123 | Cashier |
| Ravi Kumar | staff@sweetcrumb.in | staff123 | Staff |

---

## 🌐 Deploy

### Backend (Render / Railway)
1. Push backend folder to GitHub
2. Set environment variables: `MONGO_URI`, `JWT_SECRET`
3. Build command: `npm install`
4. Start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Update `vite.config.js` proxy target to your backend URL
2. Or set `VITE_API_URL=https://your-backend.com` and update `src/api/axios.js`
3. Build command: `npm run build`
4. Output dir: `dist`

---

## 📋 API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/products
POST   /api/products          [Admin]
PUT    /api/products/:id      [Admin]
DELETE /api/products/:id      [Admin]

GET    /api/orders
GET    /api/orders/stats
POST   /api/orders
DELETE /api/orders/:id        [Admin]

GET    /api/purchases
DELETE /api/purchases/:id     [Admin]
```

---

## ⚙️ Role Permissions

| Feature | Admin | Cashier | Staff |
|---------|-------|---------|-------|
| Dashboard | Full + charts | Today only | Today only |
| Billing | ✅ | ✅ | ✅ |
| Orders (monthly) | ✅ | ❌ | ❌ |
| Delete Orders | ✅ | ❌ | ❌ |
| Add/Edit Products | ✅ | ❌ | ❌ |
| Purchase List | ✅ | Today | Today |
| Delete Purchase | ✅ | ❌ | ❌ |

---

Made with ☕ by JSN Creative
