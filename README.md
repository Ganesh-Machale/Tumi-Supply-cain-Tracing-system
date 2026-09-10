# 🏭 Tume Bag Supply Chain Tracking System

A full-stack **Supply Chain Quantity Distribution Tracking System** built for managing bag products, inventory, warehouses, supply transfers, regional distribution, and stock alerts.

The system provides a centralized dashboard where authorized users can monitor supply operations, inventory levels, product SKUs, locations, reports, and low-stock alerts.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure access and refresh token system
- Automatic token refresh using Axios interceptors
- Role-based access control
- Three user roles:
  - `ADMIN`
  - `MANAGER`
  - `VIEWER`

### 📦 Supply Management

- Create and manage supply transfer records
- Track supply status
- Automatically generate supply reference numbers
- Reference format:

```text
TBK-YYYY-XXXX
