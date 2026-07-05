const db = require('../config/db');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default high limit or paginate
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT p.*, COALESCE(SUM(i.current_quantity), 0) AS total_stock 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id 
      WHERE p.is_active = true
    `;
    let queryParams = [];

    if (search) {
      query += ' AND (p.sku_code LIKE ? OR p.name LIKE ? OR p.category LIKE ?)';
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    query += ' GROUP BY p.id ORDER BY p.id DESC';
    
    // Pagination limits
    if (req.query.page) {
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) AS total FROM products WHERE is_active = true';
    let countParams = [];
    if (search) {
      countQuery += ' AND (sku_code LIKE ? OR name LIKE ? OR category LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }

    const [products] = await db.query(query, queryParams);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query(
      `SELECT p.*, COALESCE(SUM(i.current_quantity), 0) AS total_stock 
       FROM products p 
       LEFT JOIN inventory i ON p.id = i.product_id 
       WHERE p.id = ? AND p.is_active = true 
       GROUP BY p.id`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product details' });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { sku_code, name, category, unit_size, unit_price, reorder_level } = req.body;

    if (!sku_code || !name || !category || !unit_size || unit_price === undefined || reorder_level === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check unique sku_code
    const [existing] = await db.query('SELECT id FROM products WHERE sku_code = ? AND is_active = true', [sku_code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Product with this SKU code already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO products (sku_code, name, category, unit_size, unit_price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
      [sku_code, name, category, unit_size, unit_price, reorder_level]
    );

    res.status(201).json({
      message: 'Product created successfully',
      id: result.insertId,
      sku_code,
      name,
      category,
      unit_size,
      unit_price,
      reorder_level
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku_code, name, category, unit_size, unit_price, reorder_level } = req.body;

    if (!sku_code || !name || !category || !unit_size || unit_price === undefined || reorder_level === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check unique sku_code (excluding current product)
    const [existing] = await db.query('SELECT id FROM products WHERE sku_code = ? AND id != ? AND is_active = true', [sku_code, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Product with this SKU code already exists' });
    }

    const [result] = await db.query(
      'UPDATE products SET sku_code = ?, name = ?, category = ?, unit_size = ?, unit_price = ?, reorder_level = ? WHERE id = ?',
      [sku_code, name, category, unit_size, unit_price, reorder_level, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      id,
      sku_code,
      name,
      category,
      unit_size,
      unit_price,
      reorder_level
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// DELETE /api/products/:id (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Perform soft delete
    const [result] = await db.query('UPDATE products SET is_active = false WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully (soft delete)' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
