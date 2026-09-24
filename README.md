# 🏭 Tume Bag Supply Chain Tracking System

> A full-stack supply quantity distribution and inventory tracking platform for managing bag SKUs, warehouses, supply transfers, regional distribution, inventory levels, alerts, and operational reports.

## 📌 Overview

The **Tume Bag Supply Chain Tracking System** is a full-stack web application designed to provide centralized visibility into supply and inventory operations.

The system allows authorized users to manage products, locations, supply transfers, inventory, alerts, and reports through a responsive dashboard.

It includes **JWT authentication, role-based access control, automated inventory updates, low-stock alerts, analytics dashboards, CSV reporting, and responsive UI support**.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Access and refresh token mechanism
* Silent token refresh using Axios interceptors
* HTTP-only refresh token cookie
* Role-based access control
* Three user roles:

  * `ADMIN`
  * `MANAGER`
  * `VIEWER`

### 📦 Supply Management

* Create and manage supply transfers
* View supply ledger
* Edit supply status
* Automatically generate supply reference numbers
* Reference format:

```text
TBK-YYYY-XXXX
```

* Automatically update inventory when a supply becomes `DELIVERED`

### 📊 Inventory Management

* Track stock levels
* Monitor inventory across locations
* Display inventory health indicators
* Configure reorder levels
* Automatically identify low-stock products
* Generate inventory reports

### 📈 Dashboard & Analytics

The dashboard provides:

* KPI cards
* Supply trends
* Regional distribution charts
* Product statistics
* Supply status charts
* Recent supply information
* Inventory information

### 🚨 Alerts

The system provides alerts for:

* Low inventory
* Stock reaching reorder levels
* Supply/shipment-related events

### 📑 Reports

* Date-filtered reports
* Supply reports
* Inventory reports
* Chart data
* CSV export

### 🎨 User Interface

* Responsive React interface
* Tailwind CSS styling
* Responsive sidebar
* Mobile hamburger navigation
* Dark mode
* Light mode
* Theme preference stored in Local Storage

These features correspond to the current project implementation documented in the repository.

---

# 🛠️ Technology Stack

| Layer            | Technology       |
| ---------------- | ---------------- |
| Frontend         | React 19         |
| Build Tool       | Vite             |
| Styling          | Tailwind CSS     |
| Charts           | Chart.js         |
| HTTP Client      | Axios            |
| Backend          | Node.js          |
| Server Framework | Express.js       |
| Database         | MySQL            |
| Database Driver  | mysql2           |
| Authentication   | JWT              |
| Development      | npm, Git, GitHub |

---

# 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │       User        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ React Frontend    │
                    │ React + Vite      │
                    │ Tailwind CSS      │
                    └─────────┬─────────┘
                              │
                           Axios
                              │
                              ▼
                    ┌───────────────────┐
                    │ Express.js API    │
                    │    Node.js        │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
             JWT Authentication      MySQL
                                    Database
```

---

# 📂 Project Structure

```text
Tumi-Supply-cain-Tracing-system/
│
├── tume-bag-tracker/
│   │
│   ├── backend/
│   │   ├── ...                 # Express API
│   │   ├── .env.example        # Environment template
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── ...                 # React application
│   │   └── package.json
│   │
│   ├── database/
│   │   └── schema.sql          # Database schema
│   │
│   └── README.md
│
├── package-lock.json
└── README.md
```

The application itself is organized into separate **frontend, backend, and database** components.

---

# 👥 User Roles

The system provides three levels of access.

| Role      | Permissions                   |
| --------- | ----------------------------- |
| `ADMIN`   | Full system access            |
| `MANAGER` | Supply and product management |
| `VIEWER`  | Read-only access              |

### 👑 ADMIN

Administrators can manage:

* Users
* Products
* Locations
* Supply records
* Inventory
* Reports
* Alerts

### 🧑‍💼 MANAGER

Managers can manage:

* Supply records
* Products
* Inventory
* Reports

### 👁️ VIEWER

Viewers can access system information in read-only mode.

---

# 📦 Supply Workflow

The supply process follows:

```text
Create Supply
     ↓
Supply Reference Generated
     ↓
Supply Processing
     ↓
Supply Delivered
     ↓
Inventory Updated
     ↓
Inventory Checked
     ↓
Low-Stock Alert if Required
```

When the supply status changes to `DELIVERED`, the application automatically updates the relevant inventory quantity.

---

# 🔐 Authentication

The application uses JWT authentication.

The authentication system includes:

```text
Login
  ↓
Access Token
  ↓
Authenticated API Requests
  ↓
Access Token Expiration
  ↓
Refresh Token
  ↓
New Access Token
```

The current implementation uses a short-lived access token and a refresh token stored using an HTTP-only cookie.

Protected API requests use:

```http
Authorization: Bearer <accessToken>
```

---

# 🌐 API Overview

## Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register user        |
| POST   | `/api/auth/login`    | Login                |
| POST   | `/api/auth/logout`   | Logout               |
| POST   | `/api/auth/refresh`  | Refresh access token |
| GET    | `/api/auth/me`       | Current user profile |

## Protected Resources

| Endpoint         | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `/api/products`  | Product/SKU management                        |
| `/api/locations` | Warehouse, distributor and retailer locations |
| `/api/supply`    | Supply transfer records                       |
| `/api/inventory` | Inventory and stock levels                    |
| `/api/reports`   | Reports and CSV export                        |
| `/api/alerts`    | Supply and stock alerts                       |
| `/api/users`     | User administration                           |

The protected resources require an authenticated access token.

---

# 🖥️ Frontend Pages

| Route        | Access    | Purpose                         |
| ------------ | --------- | ------------------------------- |
| `/login`     | Public    | User authentication             |
| `/dashboard` | All roles | KPIs and analytics              |
| `/supply`    | All roles | Supply management               |
| `/inventory` | All roles | Inventory tracking              |
| `/products`  | All roles | Product/SKU management          |
| `/locations` | All roles | Location management             |
| `/reports`   | All roles | Analytics and CSV export        |
| `/alerts`    | All roles | Alert management                |
| `/users`     | ADMIN     | User management                 |
| `/profile`   | All roles | Profile and password management |

---

# 🗄️ Database

The application uses **MySQL** for storing supply chain information.

Database:

```text
tume_bag_db
```

The database contains information related to:

* Users
* Bag SKUs
* Locations
* Supply transfers
* Inventory
* Alerts

The project's seed process creates tables and demo data including users, bag SKUs, locations, supply records, inventory levels, and alerts.

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure you have:

* Node.js 18+
* MySQL 8.0+
* npm
* Git

The repository currently specifies Node.js 18+ and MySQL 8.0+ as prerequisites.

---

## 1. Clone the Repository

```bash
git clone https://github.com/Ganesh-Machale/Tumi-Supply-cain-Tracing-system.git
```

Navigate to the application:

```bash
cd Tumi-Supply-cain-Tracing-system/tume-bag-tracker
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

# 🔧 Environment Configuration

Create a backend `.env` file using `.env.example`.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=tume_bag_db

JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

### ⚠️ Security

Never upload your real:

* Database password
* JWT secrets
* API keys
* Environment variables

to GitHub.

Add:

```gitignore
.env
node_modules/
```

to `.gitignore`.

---

# 🗄️ Database Setup

Start your MySQL server.

Then create the database:

```sql
CREATE DATABASE tume_bag_db;
```

Run the seed command:

```bash
cd backend
npm run seed
```

The seed process creates the required tables and demo data.

---

# 👤 Demo Accounts

For local development, the seeded database provides:

| Role    | Email                 | Password      |
| ------- | --------------------- | ------------- |
| ADMIN   | `admin@tumebag.com`   | `Admin@123`   |
| MANAGER | `manager@tumebag.com` | `Manager@123` |
| VIEWER  | `viewer@tumebag.com`  | `Viewer@123`  |

> ⚠️ These credentials are intended for local/demo use. Change them before deploying a real production system.

---

# ▶️ Run the Application

The backend and frontend run separately.

## Start Backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

## Start Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

These are the development ports configured in the current project documentation.

---

# ❤️ Backend Health Check

You can verify that the backend is running using:

```bash
curl http://localhost:5000/health
```

---

# 📊 Reporting

The reporting module provides:

* Supply summaries
* Inventory summaries
* Chart data
* Date-filtered analytics
* CSV export

This makes it possible to use the application for operational reporting and analysis.

---

# 📱 Responsive Design

The frontend supports:

* Desktop
* Laptop
* Tablet
* Mobile

The application includes a responsive sidebar and mobile hamburger navigation.

---

# 🌙 Theme Support

The application provides:

```text
☀️ Light Mode
🌙 Dark Mode
```

The selected theme preference is stored in browser Local Storage.

---

# 🧠 What I Learned

Building this project helped me gain practical experience with:

### Frontend

* React
* Components
* React routing
* Vite
* Tailwind CSS
* Chart.js
* Axios
* Responsive UI

### Backend

* Node.js
* Express.js
* REST APIs
* Middleware
* Authentication
* Authorization
* JWT
* Refresh tokens

### Database

* MySQL
* SQL
* Database relationships
* Inventory data
* Supply records

### Security

* JWT authentication
* HTTP-only cookies
* Role-based access control
* Protected routes
* Environment variables

### Development

* Git
* GitHub
* npm
* Full-stack architecture
* Debugging
* API integration

---

# 🎯 Project Highlights

This project demonstrates a complete full-stack workflow:

```text
React
  ↓
Vite
  ↓
Axios
  ↓
Express.js
  ↓
Node.js
  ↓
JWT Authentication
  ↓
MySQL
  ↓
Supply & Inventory Data
```

It combines **frontend development, backend APIs, authentication, database management, role-based authorization, analytics, and reporting** into one application.

---

# 🔮 Future Improvements

Potential improvements include:

* 📍 Real-time supply tracking
* 📦 Barcode/QR-code scanning
* 📧 Email notifications
* 📱 Mobile application
* 📊 Advanced analytics
* 🤖 Inventory demand forecasting
* 🚚 Delivery tracking
* 🗺️ Map-based shipment tracking
* 📝 Audit logs
* 🔐 Two-factor authentication
* ☁️ Cloud deployment
* ⚙️ CI/CD automation
* 🔔 Real-time notifications using WebSockets

---

# 🚀 Production Deployment

The current project documentation provides a deployment path using **Vercel for the frontend** and **Railway for the backend**.

### Frontend

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Set:

```env
VITE_API_URL=https://your-production-api-url
```

### Backend

```text
Root Directory: backend
Start Command: npm start
```

Configure the required environment variables and set:

```env
NODE_ENV=production
```

---

# 📜 License

MIT License.

Built for **Tume Bag Co. supply chain and inventory operations**.

---

# 👨‍💻 Author

## Ganesh Machale

**Full Stack Web Developer | MERN Stack Developer**

Interested in building scalable web applications using:

* JavaScript
* React
* Node.js
* Express.js
* MongoDB
* MySQL
* REST APIs
* Git & GitHub

### GitHub

https://github.com/Ganesh-Machale

### Project Repository

https://github.com/Ganesh-Machale/Tumi-Supply-cain-Tracing-system

---

## ⭐ Support

If you found this project useful, consider giving the repository a ⭐ **Star** on GitHub.

### 🏷️ Topics

`React` `React19` `Node.js` `Express.js` `MySQL` `JWT` `RESTAPI` `TailwindCSS` `Vite` `Chart.js` `Axios` `SupplyChain` `InventoryManagement` `FullStackDevelopment` `JavaScript`
