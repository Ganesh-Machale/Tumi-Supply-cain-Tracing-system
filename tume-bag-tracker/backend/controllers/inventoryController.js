const db = require('../config/db');

// GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const { locationId, productId, type, region } = req.query;
    let query = `
      SELECT i.*, 
             p.sku_code AS product_sku, p.name AS product_name, p.category AS product_category, p.reorder_level AS product_reorder_level,
             l.name AS location_name, l.type AS location_type, l.region AS location_region, l.state AS location_state
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE p.is_active = true AND l.is_active = true
    `;
    let params = [];

    if (locationId) {
      query += ' AND i.location_id = ?';
      params.push(locationId);
    }
    if (productId) {
      query += ' AND i.product_id = ?';
      params.push(productId);
    }
    if (type) {
      query += ' AND l.type = ?';
      params.push(type);
    }
    if (region) {
      query += ' AND l.region = ?';
      params.push(region);
    }

    query += ' ORDER BY l.name ASC, p.sku_code ASC';
    const [inventory] = await db.query(query, params);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
};

// GET /api/inventory/low-stock
const getLowStock = async (req, res) => {
  try {
    const query = `
      SELECT i.*, 
             p.sku_code AS product_sku, p.name AS product_name, p.category AS product_category, p.reorder_level AS product_reorder_level,
             l.name AS location_name, l.type AS location_type, l.region AS location_region
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN locations l ON i.location_id = l.id
      WHERE i.current_quantity < p.reorder_level AND p.is_active = true AND l.is_active = true
      ORDER BY i.current_quantity ASC
    `;
    const [lowStock] = await db.query(query);
    res.json(lowStock);
  } catch (error) {
    console.error('Error fetching low stock inventory:', error);
    res.status(500).json({ message: 'Error fetching low stock inventory' });
  }
};

module.exports = {
  getInventory,
  getLowStock
};
