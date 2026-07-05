-- Tume Bag Supply Tracker — MySQL Schema
-- Run: mysql -u root -p < database/schema.sql
-- Or use: npm run seed (from backend/) to create DB, tables, and seed data

CREATE DATABASE IF NOT EXISTS tume_bag_db;
USE tume_bag_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'MANAGER', 'VIEWER') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_size VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  reorder_level INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  INDEX idx_products_sku (sku_code),
  INDEX idx_products_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('WAREHOUSE', 'DISTRIBUTOR', 'RETAILER') NOT NULL,
  region VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  INDEX idx_locations_type (type),
  INDEX idx_locations_region (region)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS supply_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_no VARCHAR(100) UNIQUE NOT NULL,
  product_id INT NOT NULL,
  from_location_id INT NOT NULL,
  to_location_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  supply_date DATE NOT NULL,
  status ENUM('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (from_location_id) REFERENCES locations(id),
  FOREIGN KEY (to_location_id) REFERENCES locations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_supply_date (supply_date),
  INDEX idx_supply_status (status),
  INDEX idx_supply_ref (reference_no)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  current_quantity INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_product_location (product_id, location_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  alert_type ENUM('LOW_STOCK', 'OVERSTOCK', 'DELAYED_SHIPMENT') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_alerts_type (alert_type),
  INDEX idx_alerts_read (is_read)
) ENGINE=InnoDB;
