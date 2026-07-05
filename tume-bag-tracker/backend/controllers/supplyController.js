const db = require('../config/db');
const generateRefNo = require('../utils/generateRefNo');

// Helper to update inventory and create alert if below reorder level
const updateInventoryAndAlert = async (connection, productId, locationId, qtyChange) => {
  // Update inventory level
  await connection.query(
    `INSERT INTO inventory (product_id, location_id, current_quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE current_quantity = current_quantity + ?`,
    [productId, locationId, qtyChange, qtyChange]
  );

  // Retrieve current quantity
  const [invRows] = await connection.query(
    'SELECT current_quantity FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );
  const currentQuantity = invRows[0]?.current_quantity || 0;

  // Retrieve product details for reorder level validation
  const [prodRows] = await connection.query(
    'SELECT name, sku_code, reorder_level FROM products WHERE id = ?',
    [productId]
  );
  if (prodRows.length === 0) return;
  const { name: prodName, sku_code: sku, reorder_level: reorderLevel } = prodRows[0];

  // Retrieve location details for alert message
  const [locRows] = await connection.query(
    'SELECT name FROM locations WHERE id = ?',
    [locationId]
  );
  const locName = locRows[0]?.name || 'Unknown Location';

  // Check reorder level
  if (currentQuantity < reorderLevel) {
    // Check if an unread LOW_STOCK alert already exists to prevent duplicate notifications
    const [existing] = await connection.query(
      'SELECT id FROM alerts WHERE product_id = ? AND location_id = ? AND alert_type = "LOW_STOCK" AND is_read = false',
      [productId, locationId]
    );

    if (existing.length === 0) {
      const message = `Low Stock Alert: ${prodName} (${sku}) at ${locName} is currently ${currentQuantity} units (Reorder level: ${reorderLevel}).`;
      await connection.query(
        `INSERT INTO alerts (product_id, location_id, alert_type, message, is_read)
         VALUES (?, ?, 'LOW_STOCK', ?, false)`,
        [productId, locationId, message]
      );
    }
  }
};

// GET /api/supply
const getSupplyRecords = async (req, res) => {
  try {
    const { startDate, endDate, status, region, product, limit = 20, page = 1 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT sr.*, 
             p.sku_code AS product_sku, p.name AS product_name, p.category AS product_category,
             fl.name AS from_location_name, fl.type AS from_location_type, fl.region AS from_location_region,
             tl.name AS to_location_name, tl.type AS to_location_type, tl.region AS to_location_region,
             u.name AS creator_name
      FROM supply_records sr
      JOIN products p ON sr.product_id = p.id
      JOIN locations fl ON sr.from_location_id = fl.id
      JOIN locations tl ON sr.to_location_id = tl.id
      JOIN users u ON sr.created_by = u.id
      WHERE 1=1
    `;
    let queryParams = [];

    if (startDate) {
      query += ' AND sr.supply_date >= ?';
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ' AND sr.supply_date <= ?';
      queryParams.push(endDate);
    }
    if (status) {
      query += ' AND sr.status = ?';
      queryParams.push(status);
    }
    if (region) {
      query += ' AND (fl.region = ? OR tl.region = ?)';
      queryParams.push(region, region);
    }
    if (product) {
      query += ' AND (p.name LIKE ? OR p.sku_code LIKE ?)';
      const searchParam = `%${product}%`;
      queryParams.push(searchParam, searchParam);
    }

    query += ' ORDER BY sr.supply_date DESC, sr.id DESC LIMIT ? OFFSET ?';
    queryParams.push(parsedLimit, offset);

    // Count query
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM supply_records sr
      JOIN products p ON sr.product_id = p.id
      JOIN locations fl ON sr.from_location_id = fl.id
      JOIN locations tl ON sr.to_location_id = tl.id
      WHERE 1=1
    `;
    let countParams = [];

    if (startDate) {
      countQuery += ' AND sr.supply_date >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND sr.supply_date <= ?';
      countParams.push(endDate);
    }
    if (status) {
      countQuery += ' AND sr.status = ?';
      countParams.push(status);
    }
    if (region) {
      countQuery += ' AND (fl.region = ? OR tl.region = ?)';
      countParams.push(region, region);
    }
    if (product) {
      countQuery += ' AND (p.name LIKE ? OR p.sku_code LIKE ?)';
      const searchParam = `%${product}%`;
      countParams.push(searchParam, searchParam);
    }

    const [records] = await db.query(query, queryParams);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      records,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching supply records:', error);
    res.status(500).json({ message: 'Error fetching supply records' });
  }
};

// GET /api/supply/:id
const getSupplyRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const [records] = await db.query(
      `SELECT sr.*, 
              p.sku_code AS product_sku, p.name AS product_name, p.category AS product_category,
              fl.name AS from_location_name, fl.type AS from_location_type, fl.region AS from_location_region,
              tl.name AS to_location_name, tl.type AS to_location_type, tl.region AS to_location_region,
              u.name AS creator_name
       FROM supply_records sr
       JOIN products p ON sr.product_id = p.id
       JOIN locations fl ON sr.from_location_id = fl.id
       JOIN locations tl ON sr.to_location_id = tl.id
       JOIN users u ON sr.created_by = u.id
       WHERE sr.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ message: 'Supply record not found' });
    }
    res.json(records[0]);
  } catch (error) {
    console.error('Error fetching supply record:', error);
    res.status(500).json({ message: 'Error fetching supply record details' });
  }
};

// POST /api/supply
const createSupplyRecord = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { product_id, from_location_id, to_location_id, quantity, unit_price, supply_date, status = 'PENDING', notes } = req.body;

    if (!product_id || !from_location_id || !to_location_id || !quantity || !unit_price || !supply_date) {
      await connection.rollback();
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (parseInt(quantity) <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    // Generate unique reference number
    const refNo = await generateRefNo();

    const totalValue = quantity * unit_price;
    const createdBy = req.user.id;

    // Insert supply record
    const [result] = await connection.query(
      `INSERT INTO supply_records 
       (reference_no, product_id, from_location_id, to_location_id, quantity, unit_price, total_value, supply_date, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [refNo, product_id, from_location_id, to_location_id, quantity, unit_price, totalValue, supply_date, status, notes, createdBy]
    );

    const recordId = result.insertId;

    // If status is DELIVERED, adjust inventories and check alerts
    if (status === 'DELIVERED') {
      await updateInventoryAndAlert(connection, product_id, from_location_id, -quantity);
      await updateInventoryAndAlert(connection, product_id, to_location_id, quantity);
    }

    await connection.commit();
    res.status(201).json({
      message: 'Supply record created successfully',
      id: recordId,
      reference_no: refNo,
      total_value: totalValue
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating supply record:', error);
    res.status(500).json({ message: 'Error creating supply record' });
  } finally {
    connection.release();
  }
};

// PUT /api/supply/:id/status
const updateSupplyStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(status)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid or missing status value' });
    }

    // Get current supply record state
    const [records] = await connection.query('SELECT * FROM supply_records WHERE id = ?', [id]);
    if (records.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Supply record not found' });
    }

    const record = records[0];
    const prevStatus = record.status;

    if (prevStatus === status) {
      await connection.rollback();
      return res.json({ message: 'Status remains unchanged', id });
    }

    // Update status in db
    await connection.query('UPDATE supply_records SET status = ? WHERE id = ?', [status, id]);

    // Handle inventory logic based on transition
    if (prevStatus !== 'DELIVERED' && status === 'DELIVERED') {
      // Transitioning to DELIVERED: subtract from source, add to destination
      await updateInventoryAndAlert(connection, record.product_id, record.from_location_id, -record.quantity);
      await updateInventoryAndAlert(connection, record.product_id, record.to_location_id, record.quantity);
    } else if (prevStatus === 'DELIVERED' && status !== 'DELIVERED') {
      // Transitioning AWAY from DELIVERED: reverse inventory change (add back to source, subtract from destination)
      await updateInventoryAndAlert(connection, record.product_id, record.from_location_id, record.quantity);
      await updateInventoryAndAlert(connection, record.product_id, record.to_location_id, -record.quantity);
    }

    await connection.commit();
    res.json({ message: `Supply record status updated to ${status} successfully`, id, status });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating supply status:', error);
    res.status(500).json({ message: 'Error updating supply record status' });
  } finally {
    connection.release();
  }
};

// DELETE /api/supply/:id (Cancel record - ADMIN only)
const deleteSupplyRecord = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Get current supply record state
    const [records] = await connection.query('SELECT * FROM supply_records WHERE id = ?', [id]);
    if (records.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Supply record not found' });
    }

    const record = records[0];
    const prevStatus = record.status;

    if (prevStatus === 'CANCELLED') {
      await connection.rollback();
      return res.status(400).json({ message: 'Supply record is already cancelled' });
    }

    // Mark as CANCELLED
    await connection.query('UPDATE supply_records SET status = "CANCELLED" WHERE id = ?', [id]);

    // If it was DELIVERED previously, reverse the inventory!
    if (prevStatus === 'DELIVERED') {
      await updateInventoryAndAlert(connection, record.product_id, record.from_location_id, record.quantity);
      await updateInventoryAndAlert(connection, record.product_id, record.to_location_id, -record.quantity);
    }

    await connection.commit();
    res.json({ message: 'Supply record cancelled successfully', id });
  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling supply record:', error);
    res.status(500).json({ message: 'Error cancelling supply record' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getSupplyRecords,
  getSupplyRecordById,
  createSupplyRecord,
  updateSupplyStatus,
  deleteSupplyRecord
};
