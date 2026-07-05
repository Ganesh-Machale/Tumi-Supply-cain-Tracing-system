const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createTablesSql = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'VIEWER') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_size VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    reorder_level INT NOT NULL,
    is_active BOOLEAN DEFAULT true
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type ENUM('WAREHOUSE', 'DISTRIBUTOR', 'RETAILER') NOT NULL,
    region VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS supply_records (
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
    FOREIGN KEY (created_by) REFERENCES users(id)
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    current_quantity INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_location (product_id, location_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    alert_type ENUM('LOW_STOCK', 'OVERSTOCK', 'DELAYED_SHIPMENT') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`
];

async function seed() {
  // Connect to MySQL server first (without database)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD
  });

  console.log('Connected to MySQL server.');

  // Create database
  const dbName = process.env.DB_NAME || 'tume_bag_db';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  console.log(`Database "${dbName}" checked/created.`);

  // Switch to the database
  await connection.query(`USE \`${dbName}\`;`);

  // Create tables
  for (const tableSql of createTablesSql) {
    await connection.query(tableSql);
  }
  console.log('All tables created successfully.');

  // Truncate tables to re-seed cleanly
  await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
  await connection.query('TRUNCATE TABLE alerts;');
  await connection.query('TRUNCATE TABLE inventory;');
  await connection.query('TRUNCATE TABLE supply_records;');
  await connection.query('TRUNCATE TABLE locations;');
  await connection.query('TRUNCATE TABLE products;');
  await connection.query('TRUNCATE TABLE refresh_tokens;');
  await connection.query('TRUNCATE TABLE users;');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Tables cleared.');

  // 1. Seed Users
  const salt = bcrypt.genSaltSync(12);
  const users = [
    {
      name: 'Tume Admin',
      email: 'admin@tumebag.com',
      password_hash: bcrypt.hashSync('Admin@123', salt),
      role: 'ADMIN'
    },
    {
      name: 'Tume Manager',
      email: 'manager@tumebag.com',
      password_hash: bcrypt.hashSync('Manager@123', salt),
      role: 'MANAGER'
    },
    {
      name: 'Tume Viewer',
      email: 'viewer@tumebag.com',
      password_hash: bcrypt.hashSync('Viewer@123', salt),
      role: 'VIEWER'
    }
  ];

  const userIds = [];
  for (const u of users) {
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.name, u.email, u.password_hash, u.role]
    );
    userIds.push(result.insertId);
  }
  console.log('Seeded users.');

  // 2. Seed Products
  const products = [
    { sku_code: 'TB-JUTE-50', name: 'Tume Large Jute Bag 50kg', category: 'Jute', unit_size: '50kg', unit_price: 150.00, reorder_level: 100 },
    { sku_code: 'TB-JUTE-25', name: 'Tume Medium Jute Bag 25kg', category: 'Jute', unit_size: '25kg', unit_price: 85.00, reorder_level: 150 },
    { sku_code: 'TB-PLAS-50', name: 'Tume Heavy Duty Plastic Bag 50kg', category: 'Plastic', unit_size: '50kg', unit_price: 45.00, reorder_level: 200 },
    { sku_code: 'TB-CLOTH-10', name: 'Tume Canvas Cloth Bag 10kg', category: 'Cloth', unit_size: '10kg', unit_price: 120.00, reorder_level: 50 },
    { sku_code: 'TB-PAPER-05', name: 'Tume Craft Paper Bag 5kg', category: 'Paper', unit_size: '5kg', unit_price: 25.00, reorder_level: 300 }
  ];

  const productIds = [];
  for (const p of products) {
    const [result] = await connection.query(
      'INSERT INTO products (sku_code, name, category, unit_size, unit_price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
      [p.sku_code, p.name, p.category, p.unit_size, p.unit_price, p.reorder_level]
    );
    productIds.push(result.insertId);
  }
  console.log('Seeded products.');

  // 3. Seed Locations
  const locations = [
    // Warehouses
    { name: 'Pune Central Warehouse', type: 'WAREHOUSE', region: 'Pune', state: 'Maharashtra', contact_person: 'Aman Sharma', phone: '9876543210' },
    { name: 'Mumbai Port Depot', type: 'WAREHOUSE', region: 'Mumbai', state: 'Maharashtra', contact_person: 'Rahul Patil', phone: '9876543211' },
    // Distributors
    { name: 'Nashik Agro Distributors', type: 'DISTRIBUTOR', region: 'Nashik', state: 'Maharashtra', contact_person: 'Sanjay Kale', phone: '9876543212' },
    { name: 'Pune Bag House', type: 'DISTRIBUTOR', region: 'Pune', state: 'Maharashtra', contact_person: 'Meena Joshi', phone: '9876543213' },
    { name: 'Mumbai Supply Solutions', type: 'DISTRIBUTOR', region: 'Mumbai', state: 'Maharashtra', contact_person: 'Vikas Mehta', phone: '9876543214' },
    // Retailers
    { name: 'Deccan Retailers', type: 'RETAILER', region: 'Pune', state: 'Maharashtra', contact_person: 'Sunita Rao', phone: '9876543215' },
    { name: 'Dadaji Bag Emporium', type: 'RETAILER', region: 'Mumbai', state: 'Maharashtra', contact_person: 'Karan Singh', phone: '9876543216' },
    { name: 'Panchavati Traders', type: 'RETAILER', region: 'Nashik', state: 'Maharashtra', contact_person: 'Anil Deshmukh', phone: '9876543217' }
  ];

  const locationIds = [];
  for (const l of locations) {
    const [result] = await connection.query(
      'INSERT INTO locations (name, type, region, state, contact_person, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [l.name, l.type, l.region, l.state, l.contact_person, l.phone]
    );
    locationIds.push(result.insertId);
  }
  console.log('Seeded locations.');

  const WH_PUNE = locationIds[0];
  const WH_MUMBAI = locationIds[1];
  const DIST_NASHIK = locationIds[2];
  const DIST_PUNE = locationIds[3];
  const DIST_MUMBAI = locationIds[4];
  const RET_PUNE = locationIds[5];
  const RET_MUMBAI = locationIds[6];
  const RET_NASHIK = locationIds[7];

  const PROD_JUTE_50 = productIds[0];
  const PROD_JUTE_25 = productIds[1];
  const PROD_PLAS_50 = productIds[2];
  const PROD_CLOTH_10 = productIds[3];
  const PROD_PAPER_05 = productIds[4];

  // Initialize Warehouse stock levels first so transfers don't result in unrealistic values
  // We'll give Warehouses 1000 to 5000 units of each product
  const initialStock = [
    { product_id: PROD_JUTE_50, location_id: WH_PUNE, qty: 2500 },
    { product_id: PROD_JUTE_25, location_id: WH_PUNE, qty: 3000 },
    { product_id: PROD_PLAS_50, location_id: WH_PUNE, qty: 5000 },
    { product_id: PROD_CLOTH_10, location_id: WH_PUNE, qty: 1200 },
    { product_id: PROD_PAPER_05, location_id: WH_PUNE, qty: 4000 },

    { product_id: PROD_JUTE_50, location_id: WH_MUMBAI, qty: 3500 },
    { product_id: PROD_JUTE_25, location_id: WH_MUMBAI, qty: 4000 },
    { product_id: PROD_PLAS_50, location_id: WH_MUMBAI, qty: 6000 },
    { product_id: PROD_CLOTH_10, location_id: WH_MUMBAI, qty: 1500 },
    { product_id: PROD_PAPER_05, location_id: WH_MUMBAI, qty: 5000 }
  ];

  for (const stock of initialStock) {
    await connection.query(
      'INSERT INTO inventory (product_id, location_id, current_quantity) VALUES (?, ?, ?)',
      [stock.product_id, stock.location_id, stock.qty]
    );
  }
  console.log('Seeded initial warehouse inventory.');

  // Helper to get product price
  const getPrice = (prodId) => {
    const p = products[productIds.indexOf(prodId)];
    return p ? p.unit_price : 10.00;
  };

  // 4. Seed Supply Records (20 records, dates spread across the last 30 days)
  const supplyRecords = [
    { ref: 'TBK-2026-0001', prod: PROD_JUTE_50, from: WH_PUNE, to: DIST_PUNE, qty: 300, date: '2026-05-26', status: 'DELIVERED', notes: 'Monthly distribution' },
    { ref: 'TBK-2026-0002', prod: PROD_JUTE_25, from: WH_PUNE, to: DIST_NASHIK, qty: 400, date: '2026-05-28', status: 'DELIVERED', notes: 'Agro packaging request' },
    { ref: 'TBK-2026-0003', prod: PROD_PLAS_50, from: WH_MUMBAI, to: DIST_MUMBAI, qty: 1000, date: '2026-05-30', status: 'DELIVERED', notes: 'Bulk chemical distribution' },
    { ref: 'TBK-2026-0004', prod: PROD_CLOTH_10, from: WH_PUNE, to: DIST_PUNE, qty: 150, date: '2026-06-01', status: 'DELIVERED', notes: 'Shopping bags order' },
    { ref: 'TBK-2026-0005', prod: PROD_PAPER_05, from: WH_MUMBAI, to: DIST_MUMBAI, qty: 500, date: '2026-06-02', status: 'DELIVERED', notes: 'Food delivery bags supply' },
    { ref: 'TBK-2026-0006', prod: PROD_JUTE_50, from: DIST_PUNE, to: RET_PUNE, qty: 100, date: '2026-06-04', status: 'DELIVERED', notes: 'Retail stock replenishment' },
    { ref: 'TBK-2026-0007', prod: PROD_PLAS_50, from: DIST_MUMBAI, to: RET_MUMBAI, qty: 300, date: '2026-06-05', status: 'DELIVERED', notes: 'Industrial client sale' },
    { ref: 'TBK-2026-0008', prod: PROD_JUTE_25, from: DIST_NASHIK, to: RET_NASHIK, qty: 120, date: '2026-06-08', status: 'DELIVERED', notes: 'Harvest season demand' },
    { ref: 'TBK-2026-0009', prod: PROD_CLOTH_10, from: DIST_PUNE, to: RET_PUNE, qty: 50, date: '2026-06-10', status: 'DELIVERED', notes: 'Boutique bag deliveries' },
    { ref: 'TBK-2026-0010', prod: PROD_PAPER_05, from: DIST_MUMBAI, to: RET_MUMBAI, qty: 200, date: '2026-06-12', status: 'DELIVERED', notes: 'Cafe pack supply' },
    // Non-delivered/Transit/Pending/Cancelled records
    { ref: 'TBK-2026-0011', prod: PROD_JUTE_50, from: WH_PUNE, to: DIST_NASHIK, qty: 500, date: '2026-06-15', status: 'IN_TRANSIT', notes: 'En-route to Nashik Warehouse' },
    { ref: 'TBK-2026-0012', prod: PROD_PLAS_50, from: WH_MUMBAI, to: DIST_MUMBAI, qty: 1200, date: '2026-06-17', status: 'DISPATCHED', notes: 'Leaving Mumbai port' },
    { ref: 'TBK-2026-0013', prod: PROD_JUTE_25, from: WH_PUNE, to: DIST_PUNE, qty: 400, date: '2026-06-19', status: 'PENDING', notes: 'Awaiting transport approval' },
    { ref: 'TBK-2026-0014', prod: PROD_CLOTH_10, from: WH_MUMBAI, to: DIST_MUMBAI, qty: 150, date: '2026-06-20', status: 'PENDING', notes: 'Stock verification needed' },
    { ref: 'TBK-2026-0015', prod: PROD_PAPER_05, from: WH_PUNE, to: DIST_PUNE, qty: 800, date: '2026-06-21', status: 'IN_TRANSIT', notes: 'Dispatched via local courier' },
    { ref: 'TBK-2026-0016', prod: PROD_JUTE_50, from: DIST_PUNE, to: RET_PUNE, qty: 150, date: '2026-06-22', status: 'DELIVERED', notes: 'Urgent refill' },
    { ref: 'TBK-2026-0017', prod: PROD_PLAS_50, from: DIST_MUMBAI, to: RET_MUMBAI, qty: 400, date: '2026-06-22', status: 'DELIVERED', notes: 'Urgent refill' },
    { ref: 'TBK-2026-0018', prod: PROD_PAPER_05, from: DIST_NASHIK, to: RET_NASHIK, qty: 250, date: '2026-06-23', status: 'CANCELLED', notes: 'Order cancelled by customer' },
    { ref: 'TBK-2026-0019', prod: PROD_JUTE_25, from: WH_MUMBAI, to: DIST_MUMBAI, qty: 600, date: '2026-06-24', status: 'IN_TRANSIT', notes: 'Leaving Mumbai' },
    { ref: 'TBK-2026-0020', prod: PROD_CLOTH_10, from: DIST_PUNE, to: RET_PUNE, qty: 80, date: '2026-06-24', status: 'PENDING', notes: 'Awaiting loading' }
  ];

  for (const r of supplyRecords) {
    const price = getPrice(r.prod);
    const total = r.qty * price;
    await connection.query(
      `INSERT INTO supply_records 
      (reference_no, product_id, from_location_id, to_location_id, quantity, unit_price, total_value, supply_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.ref, r.prod, r.from, r.to, r.qty, price, total, r.date, r.status, r.notes, userIds[0]] // created by Admin
    );

    // If status is DELIVERED, update inventory!
    if (r.status === 'DELIVERED') {
      // Subtract from "from" location
      await connection.query(
        `INSERT INTO inventory (product_id, location_id, current_quantity) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE current_quantity = current_quantity - ?`,
        [r.prod, r.from, -r.qty, r.qty]
      );

      // Add to "to" location
      await connection.query(
        `INSERT INTO inventory (product_id, location_id, current_quantity) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE current_quantity = current_quantity + ?`,
        [r.prod, r.to, r.qty, r.qty]
      );
    }
  }
  console.log('Seeded supply records and calculated inventory.');

  // 5. Seed Alerts (2 LOW_STOCK, 1 DELAYED)
  // Let's check which inventory levels are below reorder level, or just seed specific alerts as requested.
  // We can insert some manually to be sure they match the requested format.
  const alerts = [
    {
      product_id: PROD_CLOTH_10,
      location_id: DIST_PUNE,
      alert_type: 'LOW_STOCK',
      message: 'Current stock of Tume Canvas Cloth Bag 10kg at Pune Bag House is 20 units, which is below the reorder level of 50 units.'
    },
    {
      product_id: PROD_JUTE_50,
      location_id: RET_PUNE,
      alert_type: 'LOW_STOCK',
      message: 'Current stock of Tume Large Jute Bag 50kg at Deccan Retailers is 50 units, which is below the reorder level of 100 units.'
    },
    {
      product_id: PROD_JUTE_25,
      location_id: DIST_MUMBAI,
      alert_type: 'DELAYED_SHIPMENT',
      message: 'Shipment TBK-2026-0019 for Tume Medium Jute Bag 25kg to Mumbai Supply Solutions is delayed in transit.'
    }
  ];

  for (const a of alerts) {
    await connection.query(
      'INSERT INTO alerts (product_id, location_id, alert_type, message, is_read) VALUES (?, ?, ?, ?, false)',
      [a.product_id, a.location_id, a.alert_type, a.message]
    );

    // Also make sure they have a matching record in inventory to make reports consistent
    if (a.alert_type === 'LOW_STOCK') {
      const qty = a.product_id === PROD_CLOTH_10 ? 20 : 50;
      await connection.query(
        `INSERT INTO inventory (product_id, location_id, current_quantity) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE current_quantity = ?`,
        [a.product_id, a.location_id, qty, qty]
      );
    }
  }
  console.log('Seeded alerts.');

  await connection.end();
  console.log('Database seeding completed successfully.');
}

seed().catch(err => {
  console.error('Error during seeding database:', err);
  process.exit(1);
});
