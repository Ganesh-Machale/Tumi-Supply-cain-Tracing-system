# Tume Bag Supply Tracker

A production-ready **Supply Quantity Distribution Tracking System** for **Tume Bag Co.** — monitor bag SKUs, warehouse stock, supply transfers, regional distribution, and low-stock alerts with role-based access control.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Chart.js, Axios |
| Backend  | Node.js, Express.js |
| Database | MySQL (mysql2) |
| Auth     | JWT — 15 min access token (memory) + 7 day refresh token (httpOnly cookie) |

## Features

- **JWT authentication** with silent token refresh and axios interceptors
- **Roles**: `ADMIN` (full access), `MANAGER` (supply + products), `VIEWER` (read-only)
- **Supply ledger** with auto-generated reference numbers (`TBK-YYYY-XXXX`)
- **Inventory** auto-updated when supply status becomes `DELIVERED`
- **Low-stock alerts** when quantity falls below reorder level
- **Dashboard & reports** with KPI cards, trend/region/product/status charts
- **CSV export** for supply records and inventory
- **Dark/light theme** toggle (preference stored in localStorage)
- **Responsive** sidebar with mobile hamburger menu

## Project Structure

```
tume-bag-tracker/
├── backend/          # Express API server
├── frontend/         # React SPA (Vite)
├── database/         # schema.sql
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+
- npm

## Quick Start (Local Development)

### 1. Clone and install dependencies

```bash
cd tume-bag-tracker/backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Copy the backend env template and edit with your MySQL credentials:

```bash
cp backend/.env.example backend/.env
```

Required variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=tume_bag_db
JWT_ACCESS_SECRET=your_access_secret_key_min_32chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32chars
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Create database and seed data

```bash
cd backend
npm run seed
```

This creates all tables and inserts realistic demo data:
- 3 users (Admin, Manager, Viewer)
- 5 bag SKUs, 8 locations, 20 supply records, inventory levels, and alerts

**Demo login credentials:**

| Role    | Email                 | Password     |
|---------|-----------------------|--------------|
| ADMIN   | admin@tumebag.com     | Admin@123    |
| MANAGER | manager@tumebag.com   | Manager@123  |
| VIEWER  | viewer@tumebag.com    | Viewer@123   |

### 4. Start the servers

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

API runs at `http://localhost:5000`

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`

### 5. Health check

```bash
curl http://localhost:5000/health
```

## API Overview

### Auth (public)

| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| POST   | `/api/auth/register`  | Register user |
| POST   | `/api/auth/login`     | Login → access token + refresh cookie |
| POST   | `/api/auth/logout`    | Clear session |
| POST   | `/api/auth/refresh`   | Issue new access token |
| GET    | `/api/auth/me`        | Current user profile |

### Protected resources

All other routes require `Authorization: Bearer <accessToken>`.

- `/api/products` — SKU management
- `/api/locations` — Warehouses, distributors, retailers
- `/api/supply` — Supply transfer records
- `/api/inventory` — Stock levels + low-stock endpoint
- `/api/reports` — Summary, charts data, CSV export
- `/api/alerts` — Stock and shipment alerts
- `/api/users` — User admin (ADMIN only)

## Frontend Pages

| Route        | Access   | Description |
|--------------|----------|-------------|
| `/login`     | Public   | Sign in |
| `/dashboard` | All roles| KPIs, charts, recent supply |
| `/supply`    | All roles| Supply ledger + add/edit status |
| `/inventory` | All roles| Stock grid with health indicators |
| `/products`  | All roles| SKU catalog (edit: ADMIN/MANAGER) |
| `/locations` | All roles| Location directory (edit: ADMIN) |
| `/reports`   | All roles| Date-filtered analytics + CSV |
| `/alerts`    | All roles| Alert notifications |
| `/users`     | ADMIN    | User role & activation |
| `/profile`   | All roles| Profile + change password |

## Production Deployment

### Frontend (Vercel)

1. Set root directory to `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_URL=https://your-railway-api.up.railway.app`

### Backend (Railway)

1. Set root directory to `backend`
2. Start command: `npm start`
3. Add MySQL plugin or external DB connection
4. Set all env vars from `.env.example`
5. Set `CLIENT_URL` to your Vercel frontend URL
6. Set `NODE_ENV=production`

## Scripts

| Location  | Command        | Description |
|-----------|----------------|-------------|
| backend   | `npm run dev`  | Nodemon dev server |
| backend   | `npm start`    | Production server |
| backend   | `npm run seed` | Reset DB + seed data |
| frontend  | `npm run dev`  | Vite dev server |
| frontend  | `npm run build`| Production build |

## License

MIT — built for Tume Bag Co. internal supply chain operations.
